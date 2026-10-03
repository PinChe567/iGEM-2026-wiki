import { SPECTRUM_CONTENT_VERSION } from '@suite/content';
import {
  SPECTRUM_RULE_VERSION,
  assertNoTruthLeak,
  computeSignals,
  computeSpectrumScore,
  formatAB,
  getPreset,
  isPerfectAB,
  mixtureKey,
  mixturesEqual,
  publicCurveComparison,
  scoreAB,
  signalFitScore,
  toPublicPuzzle,
  validateMixture,
  type CanonicalMixture,
  type MixtureComponent,
} from '@suite/core/spectrum';
import { signatureMap } from '@suite/content';
import { z } from 'zod';
import { PROTOCOL_VERSION } from '../config.js';
import type { Db } from '../db/pool.js';
import {
  DAILY_MAX_DURATION_MS,
  DAILY_RESUME_WINDOW_MS,
  GUESS_RATE_LIMIT_BURST,
  GUESS_RATE_LIMIT_MS,
  RANKED_POLICY,
  buildSpectrumDailyPuzzle,
  ensureSpectrumDailyChallenge,
  isSpectrumTruth,
  type SpectrumDailyTruth,
} from './daily.js';

const SIGS = signatureMap();

export const StartRunBody = z
  .object({
    challengeId: z.string().uuid().optional(),
    protocolVersion: z.string(),
    gameVersion: z.string(),
    contentVersion: z.string(),
  })
  .strict();

export const GuessBody = z
  .object({
    protocolVersion: z.string(),
    gameVersion: z.string(),
    contentVersion: z.string(),
    components: z
      .array(
        z
          .object({
            odorId: z.string().min(1).max(64),
            percent: z.number().int(),
          })
          .strict(),
      )
      .min(1)
      .max(8),
  })
  .strict();

export const FinishBody = z
  .object({
    protocolVersion: z.string(),
    gameVersion: z.string(),
    contentVersion: z.string(),
  })
  .strict();

export type GuessEvent = {
  type: 'guess';
  at: string;
  attemptNumber: number;
  guess: CanonicalMixture;
  ab: { a: number; b: number };
  fit: number;
  perfect: boolean;
};

export type RunServerTruth = {
  privateSeed: string;
  challengeId: string;
  difficulty: SpectrumDailyTruth['difficulty'];
  startedAtMs: number;
  events: GuessEvent[];
  guessKeys: string[];
  guessesUsed: number;
  solved: boolean;
  lastGuessAtMs: number;
  recentGuessAtMs: number[];
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
  solved: boolean;
  guessesUsed: number;
  maxGuesses: number;
  durationMs: number;
  completedAt: string;
  guessScore: number;
  timeScore: number;
  totalScore: number;
  guessLog: Array<{
    attemptNumber: number;
    guess: CanonicalMixture;
    abLabel: string;
    fit: number;
  }>;
  truth: CanonicalMixture;
};

function httpError(status: number, code: string): Error & { statusCode: number; code: string } {
  const err = new Error(code) as Error & { statusCode: number; code: string };
  err.statusCode = status;
  err.code = code;
  return err;
}

function rejectClientScoreKeys(body: unknown): void {
  if (!body || typeof body !== 'object') return;
  const banned = [
    'score',
    'totalScore',
    'durationMs',
    'duration',
    'correctCount',
    'guessesUsed',
    'solved',
    'fit',
    'a',
    'b',
    'ab',
    'rank',
    'ranked',
  ];
  for (const key of banned) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      throw httpError(400, 'client_score_rejected');
    }
  }
}

function assertVersions(body: {
  protocolVersion: string;
  gameVersion: string;
  contentVersion: string;
}): void {
  if (body.protocolVersion !== PROTOCOL_VERSION) throw httpError(409, 'version_mismatch');
  if (body.gameVersion !== SPECTRUM_RULE_VERSION) throw httpError(409, 'version_mismatch');
  if (body.contentVersion !== SPECTRUM_CONTENT_VERSION) throw httpError(409, 'version_mismatch');
}

function elapsedMs(startedAtMs: number, nowMs: number): number {
  return Math.max(0, nowMs - startedAtMs);
}

function parseRunTruth(raw: unknown): RunServerTruth {
  if (!raw || typeof raw !== 'object') throw httpError(500, 'run_corrupt');
  const t = raw as RunServerTruth;
  if (typeof t.startedAtMs !== 'number' || !Array.isArray(t.events)) {
    throw httpError(500, 'run_corrupt');
  }
  return t;
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

function scoreGuess(args: {
  truth: CanonicalMixture;
  poolIds: readonly string[];
  observedSignal: readonly number[];
  guess: CanonicalMixture;
  privateSeed: string;
  difficulty: SpectrumDailyTruth['difficulty'];
}) {
  const preset = getPreset(args.difficulty);
  const ab = scoreAB(args.guess, args.truth, args.poolIds);
  const solved =
    mixturesEqual(args.guess, args.truth) ||
    isPerfectAB(ab, args.truth.components.length);
  const signals = computeSignals(
    args.guess,
    SIGS,
    preset.mixingModel,
    args.privateSeed,
  );
  const fit = signalFitScore(args.observedSignal, signals.observed);
  const perfect = solved;
  return {
    ab,
    fit,
    perfect,
    guessSignal: signals.observed,
    curve: publicCurveComparison(args.observedSignal, signals.observed, fit),
  };
}

export async function startSpectrumDailyRun(
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
  const challenge = await ensureSpectrumDailyChallenge(db, args.challengeSecret);
  if (parsed.data.challengeId && parsed.data.challengeId !== challenge.id) {
    throw httpError(409, 'challenge_mismatch');
  }

  const open = await db.query<{
    id: string;
    status: string;
    server_truth: unknown;
    ranked: boolean | null;
  }>(
    `SELECT id, status, server_truth, ranked
     FROM game_runs
     WHERE user_id = $1 AND challenge_id = $2 AND status = 'in_progress'
     ORDER BY created_at DESC
     LIMIT 1`,
    [args.userId, challenge.id],
  );

  const existing = open.rows[0];
  if (existing) {
    const truth = parseRunTruth(existing.server_truth);
    const age = elapsedMs(truth.startedAtMs, nowMs);
    if (age <= DAILY_RESUME_WINDOW_MS && age <= DAILY_MAX_DURATION_MS) {
      const payload = resumePayload(existing.id, challenge, truth, nowMs, existing.ranked !== false);
      assertNoTruthLeak(payload);
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
    difficulty: challenge.server_truth.difficulty,
    startedAtMs: nowMs,
    events: [],
    guessKeys: [],
    guessesUsed: 0,
    solved: false,
    lastGuessAtMs: 0,
    recentGuessAtMs: [],
  };

  const ins = await db.query<{ id: string }>(
    `INSERT INTO game_runs
       (user_id, game_key, challenge_id, protocol_version, game_version, content_version,
        status, public_result, server_truth, started_at, ranked)
     VALUES ($1, 'spectrum', $2, $3, $4, $5, 'in_progress', '{}'::jsonb, $6::jsonb, to_timestamp($7 / 1000.0), $8)
     RETURNING id`,
    [
      args.userId,
      challenge.id,
      PROTOCOL_VERSION,
      SPECTRUM_RULE_VERSION,
      SPECTRUM_CONTENT_VERSION,
      JSON.stringify(runTruth),
      nowMs,
      rankedEligible,
    ],
  );

  const payload = resumePayload(ins.rows[0]!.id, challenge, runTruth, nowMs, rankedEligible);
  assertNoTruthLeak(payload);
  return payload;
}

function resumePayload(
  runId: string,
  challenge: Awaited<ReturnType<typeof ensureSpectrumDailyChallenge>>,
  truth: RunServerTruth,
  nowMs: number,
  rankedEligible: boolean,
) {
  const puzzle = buildSpectrumDailyPuzzle(truth.privateSeed, truth.difficulty);
  const pub = toPublicPuzzle(puzzle);
  const preset = getPreset(truth.difficulty);
  return {
    runId,
    status: 'in_progress' as const,
    challengeId: challenge.id,
    challengeDate: challenge.challenge_date,
    protocolVersion: PROTOCOL_VERSION,
    gameVersion: SPECTRUM_RULE_VERSION,
    contentVersion: SPECTRUM_CONTENT_VERSION,
    rankedEligible,
    rankedPolicy: RANKED_POLICY,
    rankedPolicyNote: challenge.public_metadata.rankedPolicyNote,
    serverStartedAtMs: truth.startedAtMs,
    serverNowMs: nowMs,
    elapsedMs: elapsedMs(truth.startedAtMs, nowMs),
    remainingMs: Math.max(0, DAILY_MAX_DURATION_MS - elapsedMs(truth.startedAtMs, nowMs)),
    guessesUsed: truth.guessesUsed,
    maxGuesses: preset.maxGuesses,
    guessesRemaining: Math.max(0, preset.maxGuesses - truth.guessesUsed),
    solved: truth.solved,
    observedSignal: pub.observedSignal,
    poolIds: pub.poolIds,
    difficulty: pub.difficulty,
    ratioRules: pub.ratioRules,
    mixingModel: pub.mixingModel,
    showSignatureHints: pub.showSignatureHints,
    truthComponentCount: pub.truthComponentCount,
    history: truth.events.map((e) => ({
      attemptNumber: e.attemptNumber,
      guess: e.guess,
      ab: e.ab,
      abLabel: formatAB(e.ab),
      fit: e.fit,
    })),
  };
}

export async function guessSpectrumDailyRun(
  db: Db,
  args: {
    userId: string;
    runId: string;
    body: unknown;
    nowMs?: number;
  },
) {
  rejectClientScoreKeys(args.body);
  const parsed = GuessBody.safeParse(args.body ?? {});
  if (!parsed.success) throw httpError(400, 'invalid_body');
  assertVersions(parsed.data);

  const nowMs = args.nowMs ?? Date.now();
  const runRes = await db.query<{
    id: string;
    user_id: string;
    challenge_id: string;
    status: string;
    server_truth: unknown;
  }>(
    `SELECT id, user_id, challenge_id::text, status, server_truth
     FROM game_runs WHERE id = $1 AND game_key = 'spectrum'`,
    [args.runId],
  );
  const run = runRes.rows[0];
  if (!run || run.user_id !== args.userId) throw httpError(404, 'run_not_found');
  if (run.status !== 'in_progress') throw httpError(409, 'run_not_active');

  const truth = parseRunTruth(run.server_truth);
  if (truth.solved) throw httpError(409, 'already_solved');

  const age = elapsedMs(truth.startedAtMs, nowMs);
  if (age > DAILY_MAX_DURATION_MS) throw httpError(409, 'time_window_exceeded');

  const recent = truth.recentGuessAtMs.filter((t) => nowMs - t < GUESS_RATE_LIMIT_MS * 2);
  if (recent.length >= GUESS_RATE_LIMIT_BURST) {
    throw httpError(429, 'guess_rate_limited');
  }
  if (truth.lastGuessAtMs && nowMs - truth.lastGuessAtMs < GUESS_RATE_LIMIT_MS / 2) {
    throw httpError(429, 'guess_rate_limited');
  }

  const preset = getPreset(truth.difficulty);
  if (truth.guessesUsed >= preset.maxGuesses) throw httpError(409, 'max_guesses');

  const validated = validateMixture(parsed.data.components as MixtureComponent[], {
    minPercent: preset.minPercent,
    percentStep: preset.percentStep,
    componentCountMin: preset.componentCountMin,
    componentCountMax: preset.componentCountMax,
  });
  if (!validated.ok) throw httpError(400, `invalid_guess_${validated.error}`);

  const puzzle = buildSpectrumDailyPuzzle(truth.privateSeed, truth.difficulty);
  for (const c of validated.canonical.components) {
    if (!puzzle.poolIds.includes(c.odorId)) throw httpError(400, 'invalid_guess_unknown_odor');
  }

  const key = mixtureKey(validated.canonical);
  if (truth.guessKeys.includes(key)) throw httpError(409, 'duplicate_guess');

  const scored = scoreGuess({
    truth: puzzle.truth,
    poolIds: puzzle.poolIds,
    observedSignal: puzzle.observedSignal,
    guess: validated.canonical,
    privateSeed: truth.privateSeed,
    difficulty: truth.difficulty,
  });

  const attemptNumber = truth.guessesUsed + 1;
  const event: GuessEvent = {
    type: 'guess',
    at: new Date(nowMs).toISOString(),
    attemptNumber,
    guess: validated.canonical,
    ab: scored.ab,
    fit: scored.fit,
    perfect: scored.perfect,
  };

  truth.events.push(event);
  truth.guessKeys.push(key);
  truth.guessesUsed = attemptNumber;
  truth.solved = scored.perfect;
  truth.lastGuessAtMs = nowMs;
  truth.recentGuessAtMs = [...recent, nowMs].slice(-GUESS_RATE_LIMIT_BURST);

  await db.query(`UPDATE game_runs SET server_truth = $2::jsonb WHERE id = $1`, [
    run.id,
    JSON.stringify(truth),
  ]);

  const complete = truth.solved || truth.guessesUsed >= preset.maxGuesses;
  const payload = {
    runId: run.id,
    attemptNumber,
    ab: scored.ab,
    abLabel: formatAB(scored.ab),
    fit: scored.fit,
    curve: scored.curve,
    guess: validated.canonical,
    guessesUsed: truth.guessesUsed,
    maxGuesses: preset.maxGuesses,
    guessesRemaining: Math.max(0, preset.maxGuesses - truth.guessesUsed),
    solved: truth.solved,
    complete,
    remainingMs: Math.max(0, DAILY_MAX_DURATION_MS - age),
    elapsedMs: age,
    serverStartedAtMs: truth.startedAtMs,
    serverNowMs: nowMs,
  };
  assertNoTruthLeak(payload);
  return payload;
}

export async function finishSpectrumDailyRun(
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
    public_result: unknown;
  }>(
    `SELECT id, user_id, challenge_id::text, status, server_truth, public_result
     FROM game_runs WHERE id = $1 AND game_key = 'spectrum'`,
    [args.runId],
  );
  const run = runRes.rows[0];
  if (!run || run.user_id !== args.userId) throw httpError(404, 'run_not_found');

  if (run.status === 'completed') {
    return { ...(run.public_result as RunPublicResult), reportPath: '/api/v1/reports' };
  }
  if (run.status !== 'in_progress') throw httpError(409, 'run_not_active');

  const truth = parseRunTruth(run.server_truth);
  const challengeRow = await db.query<{
    challenge_date: string;
    game_version: string;
    content_version: string;
    server_truth: unknown;
  }>(
    `SELECT challenge_date::text, game_version, content_version, server_truth
     FROM daily_challenges WHERE id = $1`,
    [run.challenge_id],
  );
  const ch = challengeRow.rows[0];
  if (!ch || !isSpectrumTruth(ch.server_truth)) throw httpError(404, 'challenge_not_found');

  const puzzle = buildSpectrumDailyPuzzle(truth.privateSeed, truth.difficulty);
  const preset = getPreset(truth.difficulty);

  // Recompute from event log only.
  let solved = false;
  const guessLog: RunPublicResult['guessLog'] = [];
  for (const ev of truth.events) {
    const scored = scoreGuess({
      truth: puzzle.truth,
      poolIds: puzzle.poolIds,
      observedSignal: puzzle.observedSignal,
      guess: ev.guess,
      privateSeed: truth.privateSeed,
      difficulty: truth.difficulty,
    });
    if (scored.perfect) solved = true;
    guessLog.push({
      attemptNumber: ev.attemptNumber,
      guess: ev.guess,
      abLabel: formatAB(scored.ab),
      fit: scored.fit,
    });
  }

  const durationMs = Math.min(elapsedMs(truth.startedAtMs, nowMs), DAILY_MAX_DURATION_MS);
  const breakdown = computeSpectrumScore({
    solved,
    guessesUsed: truth.guessesUsed,
    difficulty: truth.difficulty,
    elapsedMs: durationMs,
    ruleVersion: SPECTRUM_RULE_VERSION,
  });

  const alreadyRanked = await hasRankedCompletion(db, args.userId, run.challenge_id);
  const ranked = !alreadyRanked;
  const completedAt = new Date(nowMs).toISOString();

  const publicResult: RunPublicResult = {
    serverVerified: true,
    challengeId: run.challenge_id,
    challengeDate: ch.challenge_date,
    gameVersion: ch.game_version,
    contentVersion: ch.content_version,
    protocolVersion: PROTOCOL_VERSION,
    ranked,
    rankedPolicy: RANKED_POLICY,
    solved,
    guessesUsed: truth.guessesUsed,
    maxGuesses: preset.maxGuesses,
    durationMs,
    completedAt,
    guessScore: breakdown.guessScore,
    timeScore: breakdown.timeScore,
    totalScore: breakdown.totalScore,
    guessLog,
    truth: {
      components: puzzle.truth.components.map((c) => ({
        odorId: c.odorId,
        percent: c.percent,
      })),
    },
  };

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
          correct_count, duration_ms, completed_at, ranked, game_version, content_version,
          solved, guesses_used)
       VALUES ($1, $2, $3, NULL, $4::jsonb, $5, $6, to_timestamp($7 / 1000.0), TRUE, $8, $9, $10, $11)
       ON CONFLICT (challenge_id, user_id) DO NOTHING`,
      [
        run.challenge_id,
        args.userId,
        breakdown.totalScore,
        JSON.stringify({
          solved,
          guessesUsed: truth.guessesUsed,
          durationMs,
          completedAt,
          runId: run.id,
          serverVerified: true,
        }),
        solved ? Math.max(0, preset.maxGuesses - truth.guessesUsed) : 0,
        durationMs,
        nowMs,
        ch.game_version,
        ch.content_version,
        solved,
        truth.guessesUsed,
      ],
    );
    await recomputeSpectrumRanks(db, run.challenge_id, ch.game_version, ch.content_version);
  }

  // Truth is revealed only after finish — assertNoTruthLeak would reject; skip for finish.
  return { ...publicResult, reportPath: '/api/v1/reports' };
}

export async function recomputeSpectrumRanks(
  db: Db,
  challengeId: string,
  gameVersion: string,
  contentVersion: string,
): Promise<void> {
  const ranked = await db.query<{ id: string }>(
    `SELECT id FROM leaderboard_entries
     WHERE challenge_id = $1 AND ranked = TRUE
       AND game_version = $2 AND content_version = $3
     ORDER BY COALESCE(solved, FALSE) DESC,
              guesses_used ASC NULLS LAST,
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

export async function getSpectrumRun(
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
     FROM game_runs WHERE id = $1 AND game_key = 'spectrum'`,
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

  const truth = parseRunTruth(run.server_truth);
  const row = await db.query<{
    id: string;
    game_key: string;
    challenge_date: string;
    protocol_version: string;
    game_version: string;
    content_version: string;
    public_metadata: unknown;
    server_truth: unknown;
  }>(
    `SELECT id, game_key, challenge_date::text, protocol_version, game_version, content_version,
            public_metadata, server_truth
     FROM daily_challenges WHERE id = $1`,
    [run.challenge_id],
  );
  const r = row.rows[0];
  if (!r || !isSpectrumTruth(r.server_truth)) throw httpError(404, 'challenge_not_found');

  const payload = resumePayload(
    run.id,
    {
      ...r,
      public_metadata: r.public_metadata as Awaited<
        ReturnType<typeof ensureSpectrumDailyChallenge>
      >['public_metadata'],
      server_truth: r.server_truth,
    },
    truth,
    nowMs,
    run.ranked !== false,
  );
  assertNoTruthLeak(payload);
  return payload;
}
