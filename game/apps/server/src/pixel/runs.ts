import {
  applyAnswer,
  assertNoAnswerLeak,
  roundFromQuestionId,
  summarizeResult,
  toPublicQuestion,
  type BuiltSession,
} from '@suite/core/pixel';
import { z } from 'zod';
import type { Db } from '../db/pool.js';
import { PROTOCOL_VERSION } from '../config.js';
import {
  DAILY_MAX_DURATION_MS,
  DAILY_RESUME_WINDOW_MS,
  RANKED_POLICY,
  buildPixelDailySession,
  ensurePixelDailyChallenge,
  publicQuestionsForChallenge,
  type PixelDailyTruth,
  isPixelTruth,
} from './daily.js';
import { CONTENT_VERSION } from '@suite/content';
import { PIXEL_GAME_VERSION } from '@suite/core/pixel';

/** Bodies must not carry client-computed score fields. */
export const StartRunBody = z
  .object({
    challengeId: z.string().uuid().optional(),
    protocolVersion: z.string(),
    gameVersion: z.string(),
    contentVersion: z.string(),
  })
  .strict();

export const AnswerBody = z
  .object({
    questionId: z.string().min(1).max(32),
    selectedOptionId: z.string().min(1).max(64),
    protocolVersion: z.string(),
    gameVersion: z.string(),
    contentVersion: z.string(),
  })
  .strict();

export const FinishBody = z
  .object({
    protocolVersion: z.string(),
    gameVersion: z.string(),
    contentVersion: z.string(),
  })
  .strict();

export type RunEvent =
  | {
      type: 'answer';
      at: string;
      questionId: string;
      round: number;
      selectedOptionId: string;
      correct: boolean;
      scoreDelta: number;
    }
  | { type: 'timeout'; at: string; questionId: string; round: number }
  | { type: 'finish'; at: string };

export type RunServerTruth = {
  privateSeed: string;
  challengeId: string;
  startedAtMs: number;
  events: RunEvent[];
  nextRound: number;
  score: number;
  answeredRounds: number[];
};

export type RunPublicResult = {
  serverVerified: true;
  challengeId: string;
  challengeDate: string;
  gameVersion: string;
  contentVersion: string;
  protocolVersion: string;
  ranked: boolean;
  rankedPolicy: typeof RANKED_POLICY;
  correctCount: number;
  score: number;
  maxScore: number;
  durationMs: number;
  completedAt: string;
  questionLog: Array<{
    questionId: string;
    round: number;
    selectedOptionId: string | null;
    correct: boolean;
  }>;
};

function httpError(status: number, code: string): Error & { statusCode: number; code: string } {
  const err = new Error(code) as Error & { statusCode: number; code: string };
  err.statusCode = status;
  err.code = code;
  return err;
}

function rejectClientScoreKeys(body: unknown): void {
  if (!body || typeof body !== 'object') return;
  const banned = ['score', 'durationMs', 'duration', 'correctCount', 'correct_count', 'rank', 'ranked'];
  for (const key of banned) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      throw httpError(400, 'client_score_rejected');
    }
  }
}

function parseTruth(raw: unknown): RunServerTruth {
  if (!raw || typeof raw !== 'object') throw httpError(500, 'run_corrupt');
  const t = raw as RunServerTruth;
  if (typeof t.startedAtMs !== 'number' || !Array.isArray(t.events)) {
    throw httpError(500, 'run_corrupt');
  }
  return t;
}

async function loadChallengeTruth(db: Db, challengeId: string): Promise<{
  date: string;
  gameVersion: string;
  contentVersion: string;
  truth: PixelDailyTruth;
}> {
  const res = await db.query<{
    challenge_date: string;
    game_version: string;
    content_version: string;
    server_truth: unknown;
  }>(
    `SELECT challenge_date::text, game_version, content_version, server_truth
     FROM daily_challenges WHERE id = $1 AND game_key = 'pixel'`,
    [challengeId],
  );
  const row = res.rows[0];
  if (!row || !isPixelTruth(row.server_truth)) throw httpError(404, 'challenge_not_found');
  return {
    date: row.challenge_date,
    gameVersion: row.game_version,
    contentVersion: row.content_version,
    truth: row.server_truth,
  };
}

async function hasRankedCompletion(db: Db, userId: string, challengeId: string): Promise<boolean> {
  const res = await db.query(
    `SELECT 1 FROM leaderboard_entries
     WHERE challenge_id = $1 AND user_id = $2 AND ranked = TRUE
     LIMIT 1`,
    [challengeId, userId],
  );
  return (res.rowCount ?? 0) > 0;
}

function elapsedMs(startedAtMs: number, nowMs: number): number {
  return Math.max(0, nowMs - startedAtMs);
}

function assertVersions(body: {
  protocolVersion: string;
  gameVersion: string;
  contentVersion: string;
}): void {
  if (body.protocolVersion !== PROTOCOL_VERSION) throw httpError(409, 'version_mismatch');
  if (body.gameVersion !== PIXEL_GAME_VERSION) throw httpError(409, 'version_mismatch');
  if (body.contentVersion !== CONTENT_VERSION) throw httpError(409, 'version_mismatch');
}

export async function startPixelDailyRun(
  db: Db,
  args: {
    userId: string;
    challengeSecret: string;
    body: unknown;
    nowMs?: number;
  },
) {
  rejectClientScoreKeys(args.body);
  const parsed = StartRunBody.safeParse(args.body ?? {});
  if (!parsed.success) throw httpError(400, 'invalid_body');
  assertVersions(parsed.data);

  const nowMs = args.nowMs ?? Date.now();
  const challenge = await ensurePixelDailyChallenge(db, args.challengeSecret);
  if (parsed.data.challengeId && parsed.data.challengeId !== challenge.id) {
    throw httpError(409, 'challenge_mismatch');
  }

  // Resume incomplete run if still within window (timer continues from original start).
  const open = await db.query<{
    id: string;
    status: string;
    server_truth: unknown;
    public_result: unknown;
    started_at: string | null;
    ranked: boolean | null;
    game_version: string;
    content_version: string;
    protocol_version: string;
  }>(
    `SELECT id, status, server_truth, public_result, started_at::text, ranked,
            game_version, content_version, protocol_version
     FROM game_runs
     WHERE user_id = $1 AND challenge_id = $2 AND status = 'in_progress'
     ORDER BY created_at DESC
     LIMIT 1`,
    [args.userId, challenge.id],
  );

  const existing = open.rows[0];
  if (existing) {
    const truth = parseTruth(existing.server_truth);
    const age = elapsedMs(truth.startedAtMs, nowMs);
    if (age <= DAILY_RESUME_WINDOW_MS && age <= DAILY_MAX_DURATION_MS) {
      const session = buildPixelDailySession(truth.privateSeed, challenge.server_truth.contentVersion);
      const payload = resumePayload(existing.id, challenge, truth, session, nowMs, false);
      assertNoAnswerLeak(payload);
      return payload;
    }
    await db.query(
      `UPDATE game_runs SET status = 'abandoned', finished_at = now() WHERE id = $1`,
      [existing.id],
    );
  }

  const alreadyRanked = await hasRankedCompletion(db, args.userId, challenge.id);
  const rankedEligible = !alreadyRanked;
  const runTruth: RunServerTruth = {
    privateSeed: challenge.server_truth.privateSeed,
    challengeId: challenge.id,
    startedAtMs: nowMs,
    events: [],
    nextRound: 0,
    score: 0,
    answeredRounds: [],
  };

  const ins = await db.query<{ id: string }>(
    `INSERT INTO game_runs
       (user_id, game_key, challenge_id, protocol_version, game_version, content_version,
        status, public_result, server_truth, started_at, ranked)
     VALUES ($1, 'pixel', $2, $3, $4, $5, 'in_progress', '{}'::jsonb, $6::jsonb, to_timestamp($7 / 1000.0), $8)
     RETURNING id`,
    [
      args.userId,
      challenge.id,
      PROTOCOL_VERSION,
      PIXEL_GAME_VERSION,
      CONTENT_VERSION,
      JSON.stringify(runTruth),
      nowMs,
      rankedEligible,
    ],
  );

  const session = buildPixelDailySession(challenge.server_truth.privateSeed);
  const payload = resumePayload(ins.rows[0]!.id, challenge, runTruth, session, nowMs, rankedEligible);
  assertNoAnswerLeak(payload);
  return payload;
}

function resumePayload(
  runId: string,
  challenge: Awaited<ReturnType<typeof ensurePixelDailyChallenge>>,
  truth: RunServerTruth,
  session: BuiltSession,
  nowMs: number,
  rankedEligible: boolean,
) {
  const remainingMs = Math.max(0, DAILY_MAX_DURATION_MS - elapsedMs(truth.startedAtMs, nowMs));
  const current =
    truth.nextRound < session.questions.length
      ? toPublicQuestion(session.questions[truth.nextRound]!)
      : null;
  return {
    runId,
    status: 'in_progress' as const,
    challengeId: challenge.id,
    challengeDate: challenge.challenge_date,
    protocolVersion: PROTOCOL_VERSION,
    gameVersion: PIXEL_GAME_VERSION,
    contentVersion: CONTENT_VERSION,
    rankedEligible,
    rankedPolicy: RANKED_POLICY,
    rankedPolicyNote: challenge.public_metadata.rankedPolicyNote,
    serverStartedAtMs: truth.startedAtMs,
    serverNowMs: nowMs,
    elapsedMs: elapsedMs(truth.startedAtMs, nowMs),
    remainingMs,
    nextRound: truth.nextRound,
    questionCount: session.settings.questionCount,
    score: truth.score,
    currentQuestion: current,
    poolIds: [...session.poolIds],
    settings: {
      matrixSize: session.settings.matrixSize,
      patternDisplayMs: session.settings.patternDisplayMs,
      allowStudyReview: session.settings.allowStudyReview,
      noisePercentOfOff: session.settings.noisePercentOfOff,
      optionsPerQuestion: session.settings.optionsPerQuestion,
      passCorrect: session.settings.passCorrect,
      pointsPerCorrect: session.settings.pointsPerCorrect,
    },
    // Full public question list for study/display; no answer keys.
    questions: publicQuestionsForChallenge(challenge.server_truth).questions,
  };
}

export async function answerPixelDailyRun(
  db: Db,
  args: {
    userId: string;
    runId: string;
    body: unknown;
    nowMs?: number;
  },
) {
  rejectClientScoreKeys(args.body);
  const parsed = AnswerBody.safeParse(args.body ?? {});
  if (!parsed.success) throw httpError(400, 'invalid_body');
  assertVersions(parsed.data);

  const nowMs = args.nowMs ?? Date.now();
  const runRes = await db.query<{
    id: string;
    user_id: string;
    challenge_id: string;
    status: string;
    server_truth: unknown;
    ranked: boolean | null;
  }>(
    `SELECT id, user_id, challenge_id::text, status, server_truth, ranked
     FROM game_runs WHERE id = $1 AND game_key = 'pixel'`,
    [args.runId],
  );
  const run = runRes.rows[0];
  if (!run || run.user_id !== args.userId) throw httpError(404, 'run_not_found');
  if (run.status !== 'in_progress') throw httpError(409, 'run_not_active');

  const truth = parseTruth(run.server_truth);
  const age = elapsedMs(truth.startedAtMs, nowMs);
  if (age > DAILY_MAX_DURATION_MS) throw httpError(409, 'time_window_exceeded');

  const round = roundFromQuestionId(parsed.data.questionId);
  if (round === null) throw httpError(400, 'invalid_question_id');
  if (round !== truth.nextRound) throw httpError(409, 'out_of_order');
  if (truth.answeredRounds.includes(round)) throw httpError(409, 'duplicate_answer');

  const session = buildPixelDailySession(truth.privateSeed);
  const q = session.questions[round];
  if (!q) throw httpError(400, 'invalid_question_id');

  const outcome = applyAnswer({
    settings: session.settings,
    currentScore: truth.score,
    answerId: q.answerId,
    optionIds: q.optionIds,
    chosenId: parsed.data.selectedOptionId,
    alreadyAnswered: false,
  });

  if (parsed.data.selectedOptionId && !q.optionIds.includes(parsed.data.selectedOptionId)) {
    throw httpError(400, 'invalid_option');
  }

  const event: RunEvent = {
    type: 'answer',
    at: new Date(nowMs).toISOString(),
    questionId: parsed.data.questionId,
    round,
    selectedOptionId: parsed.data.selectedOptionId,
    correct: outcome.correct,
    scoreDelta: outcome.scoreDelta,
  };

  truth.events.push(event);
  truth.answeredRounds.push(round);
  truth.score = outcome.nextScore;
  truth.nextRound = round + 1;

  await db.query(`UPDATE game_runs SET server_truth = $2::jsonb WHERE id = $1`, [
    run.id,
    JSON.stringify(truth),
  ]);

  const next =
    truth.nextRound < session.questions.length
      ? toPublicQuestion(session.questions[truth.nextRound]!)
      : null;

  const payload = {
    runId: run.id,
    correct: outcome.correct,
    scoreDelta: outcome.scoreDelta,
    score: truth.score,
    nextRound: truth.nextRound,
    complete: next === null,
    remainingMs: Math.max(0, DAILY_MAX_DURATION_MS - age),
    elapsedMs: age,
    serverStartedAtMs: truth.startedAtMs,
    serverNowMs: nowMs,
    nextQuestion: next,
  };
  assertNoAnswerLeak(payload);
  return payload;
}

export async function finishPixelDailyRun(
  db: Db,
  args: {
    userId: string;
    runId: string;
    body: unknown;
    nowMs?: number;
  },
) {
  rejectClientScoreKeys(args.body);
  const parsed = FinishBody.safeParse(args.body ?? {});
  if (!parsed.success) throw httpError(400, 'invalid_body');
  assertVersions(parsed.data);

  const nowMs = args.nowMs ?? Date.now();
  const runRes = await db.query<{
    id: string;
    user_id: string;
    challenge_id: string;
    status: string;
    server_truth: unknown;
    ranked: boolean | null;
    public_result: unknown;
  }>(
    `SELECT id, user_id, challenge_id::text, status, server_truth, ranked, public_result
     FROM game_runs WHERE id = $1 AND game_key = 'pixel'`,
    [args.runId],
  );
  const run = runRes.rows[0];
  if (!run || run.user_id !== args.userId) throw httpError(404, 'run_not_found');

  if (run.status === 'completed') {
    return {
      ...(run.public_result as RunPublicResult),
      reportPath: '/api/v1/reports',
    };
  }
  if (run.status !== 'in_progress') throw httpError(409, 'run_not_active');

  const truth = parseTruth(run.server_truth);
  const challenge = await loadChallengeTruth(db, run.challenge_id);
  const session = buildPixelDailySession(truth.privateSeed, challenge.contentVersion);

  // Results are computed only from the event log (+ unanswered = incorrect).
  const answerEvents = truth.events.filter((e): e is Extract<RunEvent, { type: 'answer' }> => e.type === 'answer');
  let score = 0;
  const questionLog: RunPublicResult['questionLog'] = [];
  for (let round = 0; round < session.questions.length; round++) {
    const q = session.questions[round]!;
    const ev = answerEvents.find((e) => e.round === round);
    if (ev) {
      const outcome = applyAnswer({
        settings: session.settings,
        currentScore: score,
        answerId: q.answerId,
        optionIds: q.optionIds,
        chosenId: ev.selectedOptionId,
        alreadyAnswered: false,
      });
      score = outcome.nextScore;
      questionLog.push({
        questionId: ev.questionId,
        round,
        selectedOptionId: ev.selectedOptionId,
        correct: outcome.correct,
      });
    } else {
      questionLog.push({
        questionId: `q${round}`,
        round,
        selectedOptionId: null,
        correct: false,
      });
    }
  }

  const summary = summarizeResult(score, session.settings);
  const durationMs = Math.min(elapsedMs(truth.startedAtMs, nowMs), DAILY_MAX_DURATION_MS);
  const completedAt = new Date(nowMs).toISOString();

  // Ranked = first completed run only (product rule). Later completions stay unranked.
  const alreadyRanked = await hasRankedCompletion(db, args.userId, run.challenge_id);
  const ranked = !alreadyRanked;

  const publicResult: RunPublicResult = {
    serverVerified: true,
    challengeId: run.challenge_id,
    challengeDate: challenge.date,
    gameVersion: challenge.gameVersion,
    contentVersion: challenge.contentVersion,
    protocolVersion: PROTOCOL_VERSION,
    ranked,
    rankedPolicy: RANKED_POLICY,
    correctCount: summary.correctCount,
    score: summary.score,
    maxScore: summary.maxScore,
    durationMs,
    completedAt,
    questionLog,
  };

  truth.events.push({ type: 'finish', at: completedAt });

  await db.query(
    `UPDATE game_runs
     SET status = 'completed', finished_at = to_timestamp($2 / 1000.0),
         public_result = $3::jsonb, server_truth = $4::jsonb, ranked = $5
     WHERE id = $1`,
    [run.id, nowMs, JSON.stringify(publicResult), JSON.stringify(truth), ranked],
  );

  if (ranked) {
    await db.query(
      `INSERT INTO leaderboard_entries
         (challenge_id, user_id, published_score, published_rank, public_payload,
          correct_count, duration_ms, completed_at, ranked, game_version, content_version)
       VALUES ($1, $2, $3, NULL, $4::jsonb, $5, $6, to_timestamp($7 / 1000.0), TRUE, $8, $9)
       ON CONFLICT (challenge_id, user_id) DO NOTHING`,
      [
        run.challenge_id,
        args.userId,
        summary.score,
        JSON.stringify({
          correctCount: summary.correctCount,
          durationMs,
          completedAt,
          runId: run.id,
          serverVerified: true,
        }),
        summary.correctCount,
        durationMs,
        nowMs,
        challenge.gameVersion,
        challenge.contentVersion,
      ],
    );
    await recomputeRanks(db, run.challenge_id, challenge.gameVersion, challenge.contentVersion);
  }

  const payload = {
    ...publicResult,
    reportPath: '/api/v1/reports',
  };
  assertNoAnswerLeak(payload);
  return payload;
}

export async function recomputeRanks(
  db: Db,
  challengeId: string,
  gameVersion: string,
  contentVersion: string,
): Promise<void> {
  const ranked = await db.query<{ id: string }>(
    `SELECT id FROM leaderboard_entries
     WHERE challenge_id = $1 AND ranked = TRUE
       AND game_version = $2 AND content_version = $3
     ORDER BY correct_count DESC NULLS LAST,
              duration_ms ASC NULLS LAST,
              completed_at ASC NULLS LAST
     LIMIT 500`,
    [challengeId, gameVersion, contentVersion],
  );
  let rank = 1;
  for (const row of ranked.rows) {
    await db.query(`UPDATE leaderboard_entries SET published_rank = $2, updated_at = now() WHERE id = $1`, [
      row.id,
      rank++,
    ]);
  }
}

export async function getPixelRun(
  db: Db,
  args: { userId: string; runId: string; nowMs?: number },
) {
  const nowMs = args.nowMs ?? Date.now();
  const runRes = await db.query<{
    id: string;
    user_id: string;
    challenge_id: string;
    status: string;
    server_truth: unknown;
    public_result: unknown;
    ranked: boolean | null;
  }>(
    `SELECT id, user_id, challenge_id::text, status, server_truth, public_result, ranked
     FROM game_runs WHERE id = $1 AND game_key = 'pixel'`,
    [args.runId],
  );
  const run = runRes.rows[0];
  if (!run || run.user_id !== args.userId) throw httpError(404, 'run_not_found');

  if (run.status === 'completed') {
    return { status: 'completed' as const, result: run.public_result };
  }
  if (run.status !== 'in_progress') {
    return { status: run.status, result: run.public_result };
  }

  const truth = parseTruth(run.server_truth);
  const challengeRow = await db.query<{
    challenge_date: string;
    public_metadata: unknown;
    server_truth: unknown;
  }>(
    `SELECT challenge_date::text, public_metadata, server_truth FROM daily_challenges WHERE id = $1`,
    [run.challenge_id],
  );
  const ch = challengeRow.rows[0];
  if (!ch || !isPixelTruth(ch.server_truth)) throw httpError(404, 'challenge_not_found');

  const session = buildPixelDailySession(truth.privateSeed);
  return resumePayload(
    run.id,
    {
      id: run.challenge_id,
      game_key: 'pixel',
      challenge_date: ch.challenge_date,
      protocol_version: PROTOCOL_VERSION,
      game_version: PIXEL_GAME_VERSION,
      content_version: CONTENT_VERSION,
      public_metadata: ch.public_metadata as Awaited<
        ReturnType<typeof ensurePixelDailyChallenge>
      >['public_metadata'],
      server_truth: ch.server_truth,
    },
    truth,
    session,
    nowMs,
    run.ranked !== false,
  );
}
