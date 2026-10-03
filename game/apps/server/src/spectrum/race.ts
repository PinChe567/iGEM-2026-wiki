import { SPECTRUM_CONTENT_VERSION, SPECTRUM_ODOR_IDS, signatureMap } from '@suite/content';
import {
  SPECTRUM_RULE_VERSION,
  assertNoTruthLeak,
  buildPuzzle,
  computeSignals,
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
  type DifficultyId,
  type MixtureComponent,
  type SpectrumPuzzle,
} from '@suite/core/spectrum';
import { randomBytes } from 'node:crypto';
import type { Server as SocketServer, Socket } from 'socket.io';
import { z } from 'zod';
import { PROTOCOL_VERSION } from '../config.js';
import type { Db } from '../db/pool.js';

/** Bumped when race timing / grace rules change. */
export const SPECTRUM_RACE_MODE_VERSION = '1.0.0' as const;
export const SPECTRUM_RACE_COUNTDOWN_MS = 3000;
export const SPECTRUM_RACE_GRACE_MS = 45_000;
export const SPECTRUM_RACE_MAX_DURATION_MS = 10 * 60 * 1000;
export const SPECTRUM_RACE_MIN_PLAYERS = 2;
export const SPECTRUM_RACE_MAX_PLAYERS = 4;
export const SPECTRUM_RACE_REACTION_COOLDOWN_MS = 3000;
export const SPECTRUM_RACE_GUESS_COOLDOWN_MS = 400;
export const SPECTRUM_RACE_DIFFICULTY: DifficultyId = 'easy';

const REACTIONS = ['ready', 'good_luck', '👍', '😮', '🔥'] as const;
const SIGS = signatureMap();
const ODOR_IDS = [...SPECTRUM_ODOR_IDS];

type Phase =
  | { name: 'lobby' }
  | { name: 'countdown'; endsAtMs: number }
  | { name: 'racing'; startedAtMs: number; endsAtMs: number; graceEndsAtMs: number | null }
  | { name: 'debrief' }
  | { name: 'finished' };

type PlayerState = {
  userId: string;
  publicId: string;
  nickname: string;
  seat: number;
  ready: boolean;
  connected: boolean;
  guessesUsed: number;
  solved: boolean;
  finishedAtMs: number | null;
  guessKeys: string[];
  privateGuesses: Array<{
    attemptNumber: number;
    guess: CanonicalMixture;
    ab: { a: number; b: number };
    fit: number;
  }>;
  shareGuessHistory: boolean;
  lastReactionAtMs: number;
  lastGuessAtMs: number;
};

type RaceRuntime = {
  matchId: string;
  roomId: string;
  code: string;
  hostUserId: string;
  privateSeed: string;
  puzzle: SpectrumPuzzle;
  modeVersion: typeof SPECTRUM_RACE_MODE_VERSION;
  phase: Phase;
  players: Map<string, PlayerState>;
  timer: ReturnType<typeof setTimeout> | null;
  firstSolveAtMs: number | null;
};

const roomsByCode = new Map<string, string>();
const runtimeByMatch = new Map<string, RaceRuntime>();
const matchByUser = new Map<string, string>();
const socketByUser = new Map<string, string>();

function httpError(status: number, code: string): Error & { statusCode: number; code: string } {
  const err = new Error(code) as Error & { statusCode: number; code: string };
  err.statusCode = status;
  err.code = code;
  return err;
}

function roomCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)]!;
  return out;
}

function freshSeed(): string {
  return `sr-${randomBytes(24).toString('base64url')}`;
}

function buildRacePuzzle(seed: string): SpectrumPuzzle {
  return buildPuzzle({
    seed,
    difficulty: SPECTRUM_RACE_DIFFICULTY,
    signatures: SIGS,
    odorIds: ODOR_IDS,
    contentVersion: SPECTRUM_CONTENT_VERSION,
  });
}

export const CreateRaceBody = z
  .object({
    protocolVersion: z.string(),
    gameVersion: z.string(),
    contentVersion: z.string(),
    shareGuessHistory: z.boolean().optional(),
  })
  .strict();

export const JoinRaceBody = z
  .object({
    code: z.string().min(4).max(8),
    protocolVersion: z.string(),
    gameVersion: z.string(),
    contentVersion: z.string(),
    shareGuessHistory: z.boolean().optional(),
  })
  .strict();

function assertVersions(body: {
  protocolVersion: string;
  gameVersion: string;
  contentVersion: string;
}): void {
  if (body.protocolVersion !== PROTOCOL_VERSION) throw httpError(409, 'version_mismatch');
  if (body.gameVersion !== SPECTRUM_RULE_VERSION) throw httpError(409, 'version_mismatch');
  if (body.contentVersion !== SPECTRUM_CONTENT_VERSION) throw httpError(409, 'version_mismatch');
}

function publicPlayers(runtime: RaceRuntime) {
  return [...runtime.players.values()]
    .sort((a, b) => a.seat - b.seat)
    .map((p) => ({
      publicId: p.publicId,
      nickname: p.nickname,
      seat: p.seat,
      ready: p.ready,
      connected: p.connected,
      guessesUsed: p.guessesUsed,
      solved: p.solved,
      finishedAtMs: p.finishedAtMs,
      isHost: p.userId === runtime.hostUserId,
      shareGuessHistory: p.shareGuessHistory,
    }));
}

function publicLobby(runtime: RaceRuntime) {
  const pub = toPublicPuzzle(runtime.puzzle);
  return {
    roomId: runtime.roomId,
    matchId: runtime.matchId,
    code: runtime.code,
    phase: runtime.phase.name,
    modeVersion: runtime.modeVersion,
    protocolVersion: PROTOCOL_VERSION,
    gameVersion: SPECTRUM_RULE_VERSION,
    contentVersion: SPECTRUM_CONTENT_VERSION,
    graceMs: SPECTRUM_RACE_GRACE_MS,
    players: publicPlayers(runtime),
    minPlayers: SPECTRUM_RACE_MIN_PLAYERS,
    maxPlayers: SPECTRUM_RACE_MAX_PLAYERS,
    // Shared signal + rules — identical for all; no truth.
    observedSignal: pub.observedSignal,
    poolIds: pub.poolIds,
    difficulty: pub.difficulty,
    maxGuesses: pub.maxGuesses,
    ratioRules: pub.ratioRules,
    truthComponentCount: pub.truthComponentCount,
  };
}

export async function createSpectrumRace(
  db: Db,
  args: { userId: string; publicId: string; nickname: string; body: unknown },
) {
  const parsed = CreateRaceBody.safeParse(args.body ?? {});
  if (!parsed.success) throw httpError(400, 'invalid_body');
  assertVersions(parsed.data);

  let code = roomCode();
  for (let i = 0; i < 5 && roomsByCode.has(code); i++) code = roomCode();
  const privateSeed = freshSeed();
  const puzzle = buildRacePuzzle(privateSeed);

  const roomIns = await db.query<{ id: string }>(
    `INSERT INTO rooms (code, host_user_id, status, protocol_version, game_version, content_version, public_config, server_truth)
     VALUES ($1, $2, 'open', $3, $4, $5, $6::jsonb, $7::jsonb)
     RETURNING id`,
    [
      code,
      args.userId,
      PROTOCOL_VERSION,
      SPECTRUM_RULE_VERSION,
      SPECTRUM_CONTENT_VERSION,
      JSON.stringify({
        gameKey: 'spectrum',
        mode: 'race',
        modeVersion: SPECTRUM_RACE_MODE_VERSION,
        graceMs: SPECTRUM_RACE_GRACE_MS,
      }),
      JSON.stringify({ privateSeed }),
    ],
  );
  const roomId = roomIns.rows[0]!.id;
  roomsByCode.set(code, roomId);

  const matchIns = await db.query<{ id: string }>(
    `INSERT INTO matches (room_id, game_key, status, protocol_version, game_version, content_version, server_truth)
     VALUES ($1, 'spectrum', 'lobby', $2, $3, $4, $5::jsonb)
     RETURNING id`,
    [
      roomId,
      PROTOCOL_VERSION,
      SPECTRUM_RULE_VERSION,
      SPECTRUM_CONTENT_VERSION,
      JSON.stringify({ privateSeed, modeVersion: SPECTRUM_RACE_MODE_VERSION }),
    ],
  );
  const matchId = matchIns.rows[0]!.id;

  const share = parsed.data.shareGuessHistory !== false;
  await db.query(
    `INSERT INTO match_players (match_id, user_id, seat, public_state, server_truth)
     VALUES ($1, $2, 0, $3::jsonb, '{}'::jsonb)`,
    [
      matchId,
      args.userId,
      JSON.stringify({
        publicId: args.publicId,
        nickname: args.nickname,
        ready: false,
        shareGuessHistory: share,
      }),
    ],
  );

  const runtime: RaceRuntime = {
    matchId,
    roomId,
    code,
    hostUserId: args.userId,
    privateSeed,
    puzzle,
    modeVersion: SPECTRUM_RACE_MODE_VERSION,
    phase: { name: 'lobby' },
    players: new Map([
      [
        args.userId,
        {
          userId: args.userId,
          publicId: args.publicId,
          nickname: args.nickname,
          seat: 0,
          ready: false,
          connected: false,
          guessesUsed: 0,
          solved: false,
          finishedAtMs: null,
          guessKeys: [],
          privateGuesses: [],
          shareGuessHistory: share,
          lastReactionAtMs: 0,
          lastGuessAtMs: 0,
        },
      ],
    ]),
    timer: null,
    firstSolveAtMs: null,
  };
  runtimeByMatch.set(matchId, runtime);
  matchByUser.set(args.userId, matchId);

  const payload = publicLobby(runtime);
  assertNoTruthLeak(payload);
  return payload;
}

export async function joinSpectrumRace(
  db: Db,
  args: { userId: string; publicId: string; nickname: string; body: unknown },
) {
  const parsed = JoinRaceBody.safeParse(args.body ?? {});
  if (!parsed.success) throw httpError(400, 'invalid_body');
  assertVersions(parsed.data);

  const code = parsed.data.code.trim().toUpperCase();
  const roomRes = await db.query<{ id: string; status: string; server_truth: unknown }>(
    `SELECT id, status, server_truth FROM rooms WHERE code = $1`,
    [code],
  );
  const room = roomRes.rows[0];
  if (!room || room.status !== 'open') throw httpError(404, 'room_not_found');

  const matchRes = await db.query<{ id: string }>(
    `SELECT id FROM matches WHERE room_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [room.id],
  );
  const match = matchRes.rows[0];
  if (!match) throw httpError(404, 'match_not_found');

  let runtime = runtimeByMatch.get(match.id);
  if (!runtime) {
    const seed =
      (room.server_truth as { privateSeed?: string })?.privateSeed ?? freshSeed();
    runtime = {
      matchId: match.id,
      roomId: room.id,
      code,
      hostUserId: '',
      privateSeed: seed,
      puzzle: buildRacePuzzle(seed),
      modeVersion: SPECTRUM_RACE_MODE_VERSION,
      phase: { name: 'lobby' },
      players: new Map(),
      timer: null,
      firstSolveAtMs: null,
    };
    const players = await db.query<{
      user_id: string;
      seat: number;
      public_state: {
        publicId?: string;
        nickname?: string;
        ready?: boolean;
        shareGuessHistory?: boolean;
      };
    }>(`SELECT user_id, seat, public_state FROM match_players WHERE match_id = $1`, [match.id]);
    for (const p of players.rows) {
      runtime.players.set(p.user_id, {
        userId: p.user_id,
        publicId: p.public_state.publicId ?? 'unknown',
        nickname: p.public_state.nickname ?? 'Player',
        seat: p.seat,
        ready: Boolean(p.public_state.ready),
        connected: false,
        guessesUsed: 0,
        solved: false,
        finishedAtMs: null,
        guessKeys: [],
        privateGuesses: [],
        shareGuessHistory: p.public_state.shareGuessHistory !== false,
        lastReactionAtMs: 0,
        lastGuessAtMs: 0,
      });
      if (p.seat === 0) runtime.hostUserId = p.user_id;
    }
    runtimeByMatch.set(match.id, runtime);
    roomsByCode.set(code, room.id);
  }

  if (runtime.phase.name !== 'lobby') throw httpError(409, 'match_already_started');
  if (runtime.players.has(args.userId)) {
    const payload = publicLobby(runtime);
    assertNoTruthLeak(payload);
    return payload;
  }
  if (runtime.players.size >= SPECTRUM_RACE_MAX_PLAYERS) throw httpError(409, 'room_full');

  const seat = runtime.players.size;
  const share = parsed.data.shareGuessHistory !== false;
  await db.query(
    `INSERT INTO match_players (match_id, user_id, seat, public_state, server_truth)
     VALUES ($1, $2, $3, $4::jsonb, '{}'::jsonb)
     ON CONFLICT (match_id, user_id) DO NOTHING`,
    [
      match.id,
      args.userId,
      seat,
      JSON.stringify({
        publicId: args.publicId,
        nickname: args.nickname,
        ready: false,
        shareGuessHistory: share,
      }),
    ],
  );

  runtime.players.set(args.userId, {
    userId: args.userId,
    publicId: args.publicId,
    nickname: args.nickname,
    seat,
    ready: false,
    connected: false,
    guessesUsed: 0,
    solved: false,
    finishedAtMs: null,
    guessKeys: [],
    privateGuesses: [],
    shareGuessHistory: share,
    lastReactionAtMs: 0,
    lastGuessAtMs: 0,
  });
  matchByUser.set(args.userId, match.id);

  const payload = publicLobby(runtime);
  assertNoTruthLeak(payload);
  return payload;
}

function clearTimer(runtime: RaceRuntime): void {
  if (runtime.timer) {
    clearTimeout(runtime.timer);
    runtime.timer = null;
  }
}

function emitToMatch(io: SocketServer, runtime: RaceRuntime, event: string, payload: unknown): void {
  assertNoTruthLeak(payload);
  io.to(`match:${runtime.matchId}`).emit(event, payload);
}

function emitUser(io: SocketServer, userId: string, event: string, payload: unknown): void {
  const sid = socketByUser.get(userId);
  if (!sid) return;
  // Private feedback may include curve but never truth before debrief.
  if (event !== 'spectrum_race_debrief') assertNoTruthLeak(payload);
  io.to(sid).emit(event, payload);
}

function schedule(runtime: RaceRuntime, delayMs: number, fn: () => void): void {
  clearTimer(runtime);
  runtime.timer = setTimeout(fn, delayMs);
}

async function appendEvent(
  db: Db,
  matchId: string,
  eventType: string,
  publicPayload: unknown,
  serverTruth: unknown = {},
): Promise<void> {
  const seqRes = await db.query<{ seq: number }>(
    `SELECT COALESCE(MAX(seq), 0) + 1 AS seq FROM match_events WHERE match_id = $1`,
    [matchId],
  );
  const seq = Number(seqRes.rows[0]?.seq ?? 1);
  await db.query(
    `INSERT INTO match_events
       (match_id, seq, protocol_version, game_version, content_version, event_type, public_payload, server_truth)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb)`,
    [
      matchId,
      seq,
      PROTOCOL_VERSION,
      SPECTRUM_RULE_VERSION,
      SPECTRUM_CONTENT_VERSION,
      eventType,
      JSON.stringify(publicPayload),
      JSON.stringify(serverTruth),
    ],
  );
}

function beginCountdown(io: SocketServer, db: Db, runtime: RaceRuntime): void {
  if (runtime.players.size < SPECTRUM_RACE_MIN_PLAYERS) return;
  if (![...runtime.players.values()].every((p) => p.ready)) return;
  if (runtime.phase.name !== 'lobby') return;

  const endsAtMs = Date.now() + SPECTRUM_RACE_COUNTDOWN_MS;
  runtime.phase = { name: 'countdown', endsAtMs };
  void appendEvent(db, runtime.matchId, 'countdown', { endsAtMs, modeVersion: runtime.modeVersion });
  void db.query(`UPDATE matches SET status = 'countdown' WHERE id = $1`, [runtime.matchId]);
  void db.query(`UPDATE rooms SET status = 'locked' WHERE id = $1`, [runtime.roomId]);

  emitToMatch(io, runtime, 'spectrum_race_phase', {
    phase: 'countdown',
    endsAtMs,
    serverNowMs: Date.now(),
    modeVersion: runtime.modeVersion,
    players: publicPlayers(runtime),
  });

  schedule(runtime, SPECTRUM_RACE_COUNTDOWN_MS, () => startRace(io, db, runtime));
}

function startRace(io: SocketServer, db: Db, runtime: RaceRuntime): void {
  const startedAtMs = Date.now();
  const endsAtMs = startedAtMs + SPECTRUM_RACE_MAX_DURATION_MS;
  runtime.phase = { name: 'racing', startedAtMs, endsAtMs, graceEndsAtMs: null };
  const pub = toPublicPuzzle(runtime.puzzle);
  void appendEvent(db, runtime.matchId, 'race_start', {
    startedAtMs,
    endsAtMs,
    modeVersion: runtime.modeVersion,
  });
  void db.query(`UPDATE matches SET status = 'racing' WHERE id = $1`, [runtime.matchId]);

  emitToMatch(io, runtime, 'spectrum_race_phase', {
    phase: 'racing',
    startedAtMs,
    endsAtMs,
    graceEndsAtMs: null,
    serverNowMs: Date.now(),
    modeVersion: runtime.modeVersion,
    observedSignal: pub.observedSignal,
    poolIds: pub.poolIds,
    maxGuesses: pub.maxGuesses,
    ratioRules: pub.ratioRules,
    players: publicPlayers(runtime),
  });

  schedule(runtime, SPECTRUM_RACE_MAX_DURATION_MS, () => finishRace(io, db, runtime));
}

function maybeEnterGrace(io: SocketServer, db: Db, runtime: RaceRuntime, nowMs: number): void {
  if (runtime.phase.name !== 'racing') return;
  if (runtime.firstSolveAtMs != null) return;
  runtime.firstSolveAtMs = nowMs;
  const graceEndsAtMs = nowMs + SPECTRUM_RACE_GRACE_MS;
  runtime.phase = {
    ...runtime.phase,
    graceEndsAtMs,
  };
  void appendEvent(db, runtime.matchId, 'grace', {
    graceEndsAtMs,
    graceMs: SPECTRUM_RACE_GRACE_MS,
    modeVersion: runtime.modeVersion,
  });
  emitToMatch(io, runtime, 'spectrum_race_phase', {
    phase: 'racing',
    startedAtMs: runtime.phase.startedAtMs,
    endsAtMs: runtime.phase.endsAtMs,
    graceEndsAtMs,
    serverNowMs: nowMs,
    modeVersion: runtime.modeVersion,
    players: publicPlayers(runtime),
  });
  const remainingHard = Math.max(0, runtime.phase.endsAtMs - nowMs);
  const delay = Math.min(SPECTRUM_RACE_GRACE_MS, remainingHard);
  schedule(runtime, delay, () => finishRace(io, db, runtime));
}

function finishRace(io: SocketServer, db: Db, runtime: RaceRuntime): void {
  if (runtime.phase.name === 'finished' || runtime.phase.name === 'debrief') return;
  clearTimer(runtime);
  runtime.phase = { name: 'debrief' };

  const standings = publicPlayers(runtime)
    .slice()
    .sort((a, b) => {
      if (a.solved !== b.solved) return a.solved ? -1 : 1;
      if (a.solved && b.solved) {
        if (a.guessesUsed !== b.guessesUsed) return a.guessesUsed - b.guessesUsed;
        return (a.finishedAtMs ?? 0) - (b.finishedAtMs ?? 0);
      }
      return a.seat - b.seat;
    });

  const result = {
    serverVerified: true as const,
    matchId: runtime.matchId,
    modeVersion: runtime.modeVersion,
    gameVersion: SPECTRUM_RULE_VERSION,
    contentVersion: SPECTRUM_CONTENT_VERSION,
    protocolVersion: PROTOCOL_VERSION,
    graceMs: SPECTRUM_RACE_GRACE_MS,
    standings,
    truth: {
      components: runtime.puzzle.truth.components.map((c) => ({
        odorId: c.odorId,
        percent: c.percent,
      })),
    },
    // Guess histories only for players who opted to share.
    sharedGuessHistories: [...runtime.players.values()]
      .filter((p) => p.shareGuessHistory)
      .map((p) => ({
        publicId: p.publicId,
        guesses: p.privateGuesses.map((g) => ({
          attemptNumber: g.attemptNumber,
          guess: g.guess,
          abLabel: formatAB(g.ab),
          fit: g.fit,
        })),
      })),
    reportPath: '/api/v1/reports',
  };

  void appendEvent(db, runtime.matchId, 'race_finish', {
    standings,
    modeVersion: runtime.modeVersion,
  }, { truth: result.truth });
  void db.query(
    `UPDATE matches SET status = 'finished', finished_at = now(), public_result = $2::jsonb WHERE id = $1`,
    [runtime.matchId, JSON.stringify({ ...result, truth: undefined })],
  );
  void db.query(`UPDATE rooms SET status = 'closed', closed_at = now() WHERE id = $1`, [runtime.roomId]);

  // Debrief: send full result (with truth) privately after race end — not as pre-finish payload.
  for (const p of runtime.players.values()) {
    emitUser(io, p.userId, 'spectrum_race_debrief', result);
  }
  emitToMatch(io, runtime, 'spectrum_race_phase', {
    phase: 'debrief',
    serverNowMs: Date.now(),
    modeVersion: runtime.modeVersion,
    standings,
    // No truth / histories on the broadcast phase event.
  });

  runtime.phase = { name: 'finished' };
}

function handleGuess(
  io: SocketServer,
  db: Db,
  runtime: RaceRuntime,
  userId: string,
  payload: unknown,
): void {
  if (runtime.phase.name !== 'racing') {
    emitUser(io, userId, 'spectrum_race_error', { error: 'not_racing' });
    return;
  }
  const nowMs = Date.now();
  if (nowMs > runtime.phase.endsAtMs) {
    emitUser(io, userId, 'spectrum_race_error', { error: 'time_window_exceeded' });
    return;
  }
  if (runtime.phase.graceEndsAtMs != null && nowMs > runtime.phase.graceEndsAtMs) {
    emitUser(io, userId, 'spectrum_race_error', { error: 'grace_ended' });
    return;
  }

  const parsed = z
    .object({
      protocolVersion: z.string(),
      gameVersion: z.string(),
      contentVersion: z.string(),
      components: z
        .array(z.object({ odorId: z.string(), percent: z.number().int() }).strict())
        .min(1)
        .max(8),
    })
    .strict()
    .safeParse(payload);
  if (!parsed.success) {
    emitUser(io, userId, 'spectrum_race_error', { error: 'invalid_body' });
    return;
  }
  if (
    parsed.data.protocolVersion !== PROTOCOL_VERSION ||
    parsed.data.gameVersion !== SPECTRUM_RULE_VERSION ||
    parsed.data.contentVersion !== SPECTRUM_CONTENT_VERSION
  ) {
    emitUser(io, userId, 'spectrum_race_error', { error: 'version_mismatch' });
    return;
  }

  const player = runtime.players.get(userId);
  if (!player || player.solved) return;
  if (nowMs - player.lastGuessAtMs < SPECTRUM_RACE_GUESS_COOLDOWN_MS) {
    emitUser(io, userId, 'spectrum_race_error', { error: 'guess_rate_limited' });
    return;
  }

  const preset = getPreset(SPECTRUM_RACE_DIFFICULTY);
  if (player.guessesUsed >= preset.maxGuesses) {
    emitUser(io, userId, 'spectrum_race_error', { error: 'max_guesses' });
    return;
  }

  const validated = validateMixture(parsed.data.components as MixtureComponent[], {
    minPercent: preset.minPercent,
    percentStep: preset.percentStep,
    componentCountMin: preset.componentCountMin,
    componentCountMax: preset.componentCountMax,
  });
  if (!validated.ok) {
    emitUser(io, userId, 'spectrum_race_error', { error: `invalid_guess_${validated.error}` });
    return;
  }
  for (const c of validated.canonical.components) {
    if (!runtime.puzzle.poolIds.includes(c.odorId)) {
      emitUser(io, userId, 'spectrum_race_error', { error: 'invalid_guess_unknown_odor' });
      return;
    }
  }

  const key = mixtureKey(validated.canonical);
  if (player.guessKeys.includes(key)) {
    emitUser(io, userId, 'spectrum_race_error', { error: 'duplicate_guess' });
    return;
  }

  const ab = scoreAB(validated.canonical, runtime.puzzle.truth, runtime.puzzle.poolIds);
  const signals = computeSignals(
    validated.canonical,
    SIGS,
    preset.mixingModel,
    runtime.privateSeed,
  );
  const fit = signalFitScore(runtime.puzzle.observedSignal, signals.observed);
  const perfect =
    mixturesEqual(validated.canonical, runtime.puzzle.truth) ||
    isPerfectAB(ab, runtime.puzzle.truth.components.length);

  player.lastGuessAtMs = nowMs;
  player.guessesUsed += 1;
  player.guessKeys.push(key);
  player.privateGuesses.push({
    attemptNumber: player.guessesUsed,
    guess: validated.canonical,
    ab,
    fit,
  });

  if (perfect) {
    player.solved = true;
    player.finishedAtMs = nowMs;
    maybeEnterGrace(io, db, runtime, nowMs);
  }

  void appendEvent(
    db,
    runtime.matchId,
    'guess',
    {
      publicId: player.publicId,
      guessesUsed: player.guessesUsed,
      solved: player.solved,
      finishedAtMs: player.finishedAtMs,
    },
    { userId, guess: validated.canonical, ab, fit },
  );

  // Broadcast progress only — never A/B or selected mixture.
  emitToMatch(io, runtime, 'spectrum_race_progress', {
    players: publicPlayers(runtime),
    graceEndsAtMs: runtime.phase.name === 'racing' ? runtime.phase.graceEndsAtMs : null,
  });

  emitUser(io, userId, 'spectrum_race_guess_feedback', {
    attemptNumber: player.guessesUsed,
    ab,
    abLabel: formatAB(ab),
    fit,
    curve: publicCurveComparison(runtime.puzzle.observedSignal, signals.observed, fit),
    guess: validated.canonical,
    solved: player.solved,
    guessesUsed: player.guessesUsed,
    maxGuesses: preset.maxGuesses,
  });

  if ([...runtime.players.values()].every((p) => p.solved || p.guessesUsed >= preset.maxGuesses)) {
    finishRace(io, db, runtime);
  }
}

export function attachSpectrumRaceHandlers(io: SocketServer, db: Db): void {
  io.on('connection', (socket: Socket) => {
    const userId = (socket.data as { userId?: string }).userId;
    if (!userId) return;
    socketByUser.set(userId, socket.id);

    const existingMatchId = matchByUser.get(userId);
    if (existingMatchId) {
      const runtime = runtimeByMatch.get(existingMatchId);
      if (runtime?.players.has(userId)) {
        const player = runtime.players.get(userId)!;
        player.connected = true;
        void socket.join(`match:${runtime.matchId}`);
        const snap = reconnectSnapshot(runtime, userId);
        if (runtime.phase.name !== 'finished' && runtime.phase.name !== 'debrief') {
          assertNoTruthLeak(snap);
        }
        socket.emit('spectrum_race_reconnected', snap);
        emitToMatch(io, runtime, 'spectrum_race_progress', { players: publicPlayers(runtime) });
      }
    }

    socket.on('spectrum_race_join', (payload: unknown) => {
      const parsed = z.object({ matchId: z.string().uuid() }).safeParse(payload);
      if (!parsed.success) {
        socket.emit('spectrum_race_error', { error: 'invalid_body' });
        return;
      }
      const runtime = runtimeByMatch.get(parsed.data.matchId);
      if (!runtime || !runtime.players.has(userId)) {
        socket.emit('spectrum_race_error', { error: 'not_in_match' });
        return;
      }
      matchByUser.set(userId, runtime.matchId);
      runtime.players.get(userId)!.connected = true;
      void socket.join(`match:${runtime.matchId}`);
      const snap = reconnectSnapshot(runtime, userId);
      if (runtime.phase.name !== 'finished' && runtime.phase.name !== 'debrief') {
        assertNoTruthLeak(snap);
      }
      socket.emit('spectrum_race_reconnected', snap);
      emitToMatch(io, runtime, 'spectrum_race_progress', { players: publicPlayers(runtime) });
    });

    socket.on('spectrum_race_ready', (payload: unknown) => {
      const runtime = runtimeForUser(userId);
      if (!runtime) {
        socket.emit('spectrum_race_error', { error: 'not_in_match' });
        return;
      }
      if (runtime.phase.name !== 'lobby') {
        socket.emit('spectrum_race_error', { error: 'not_in_lobby' });
        return;
      }
      const parsed = z.object({ ready: z.boolean() }).safeParse(payload ?? { ready: true });
      if (!parsed.success) return;
      const player = runtime.players.get(userId);
      if (!player) return;
      player.ready = parsed.data.ready;
      emitToMatch(io, runtime, 'spectrum_race_progress', { players: publicPlayers(runtime) });
      beginCountdown(io, db, runtime);
    });

    socket.on('spectrum_race_share_setting', (payload: unknown) => {
      const runtime = runtimeForUser(userId);
      if (!runtime) return;
      const parsed = z.object({ shareGuessHistory: z.boolean() }).safeParse(payload);
      if (!parsed.success) return;
      const player = runtime.players.get(userId);
      if (!player) return;
      // Only changeable before debrief.
      if (runtime.phase.name === 'finished' || runtime.phase.name === 'debrief') return;
      player.shareGuessHistory = parsed.data.shareGuessHistory;
      emitToMatch(io, runtime, 'spectrum_race_progress', { players: publicPlayers(runtime) });
    });

    socket.on('spectrum_race_guess', (payload: unknown) => {
      const runtime = runtimeForUser(userId);
      if (!runtime) {
        socket.emit('spectrum_race_error', { error: 'not_in_match' });
        return;
      }
      handleGuess(io, db, runtime, userId, payload);
    });

    socket.on('spectrum_race_reaction', (payload: unknown) => {
      const runtime = runtimeForUser(userId);
      if (!runtime) return;
      const parsed = z.object({ kind: z.enum(REACTIONS) }).strict().safeParse(payload);
      if (!parsed.success) {
        socket.emit('spectrum_race_error', { error: 'invalid_reaction' });
        return;
      }
      const player = runtime.players.get(userId);
      if (!player) return;
      const now = Date.now();
      if (now - player.lastReactionAtMs < SPECTRUM_RACE_REACTION_COOLDOWN_MS) {
        socket.emit('spectrum_race_error', { error: 'reaction_cooldown' });
        return;
      }
      player.lastReactionAtMs = now;
      emitToMatch(io, runtime, 'spectrum_race_reaction', {
        publicId: player.publicId,
        kind: parsed.data.kind,
        atMs: now,
      });
    });

    socket.on('disconnect', () => {
      if (socketByUser.get(userId) === socket.id) socketByUser.delete(userId);
      const runtime = runtimeForUser(userId);
      if (!runtime) return;
      const player = runtime.players.get(userId);
      if (!player) return;
      player.connected = false;
      emitToMatch(io, runtime, 'spectrum_race_progress', { players: publicPlayers(runtime) });
    });
  });
}

function runtimeForUser(userId: string): RaceRuntime | undefined {
  const matchId = matchByUser.get(userId);
  if (!matchId) return undefined;
  return runtimeByMatch.get(matchId);
}

function reconnectSnapshot(runtime: RaceRuntime, userId: string) {
  const base = publicLobby(runtime);
  const player = runtime.players.get(userId);
  if (runtime.phase.name === 'racing') {
    return {
      ...base,
      phase: 'racing' as const,
      startedAtMs: runtime.phase.startedAtMs,
      endsAtMs: runtime.phase.endsAtMs,
      graceEndsAtMs: runtime.phase.graceEndsAtMs,
      serverNowMs: Date.now(),
      myHistory: player?.privateGuesses.map((g) => ({
        attemptNumber: g.attemptNumber,
        guess: g.guess,
        abLabel: formatAB(g.ab),
        fit: g.fit,
      })),
    };
  }
  if (runtime.phase.name === 'countdown') {
    return {
      ...base,
      phase: 'countdown' as const,
      endsAtMs: runtime.phase.endsAtMs,
      serverNowMs: Date.now(),
    };
  }
  return { ...base, phase: runtime.phase.name };
}

export function resetSpectrumRaceMemory(): void {
  for (const rt of runtimeByMatch.values()) clearTimer(rt);
  runtimeByMatch.clear();
  roomsByCode.clear();
  matchByUser.clear();
  socketByUser.clear();
}
