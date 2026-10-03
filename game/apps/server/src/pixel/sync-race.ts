import { CONTENT_VERSION } from '@suite/content';
import {
  PIXEL_GAME_VERSION,
  applyAnswer,
  assertNoAnswerLeak,
  buildSession,
  buildSessionMeta,
  getPreset,
  questionIdForRound,
  roundFromQuestionId,
  toPublicQuestion,
  type BuiltSession,
} from '@suite/core/pixel';
import type { Server as SocketServer, Socket } from 'socket.io';
import { z } from 'zod';
import { PROTOCOL_VERSION } from '../config.js';
import type { Db } from '../db/pool.js';
import { freshMatchSeed, pixelOdors } from './daily.js';

export const SYNC_MIN_PLAYERS = 2;
export const SYNC_MAX_PLAYERS = 4;
export const SYNC_COUNTDOWN_MS = 3000;
export const SYNC_QUESTION_MS = 20_000;
export const SYNC_INTER_QUESTION_MS = 2000;
export const SYNC_REACTION_COOLDOWN_MS = 3000;
export const SYNC_PRESET_ID = 'daily-standard' as const;

const REACTIONS = ['ready', 'good_luck', '👍', '😮', '🔥'] as const;
export type ReactionKind = (typeof REACTIONS)[number];

type Phase =
  | { name: 'lobby' }
  | { name: 'countdown'; endsAtMs: number }
  | { name: 'question'; round: number; endsAtMs: number }
  | { name: 'between'; round: number; endsAtMs: number }
  | { name: 'finished' };

type PlayerState = {
  userId: string;
  publicId: string;
  nickname: string;
  seat: number;
  ready: boolean;
  connected: boolean;
  score: number;
  correctCount: number;
  answeredThisRound: boolean;
  lastReactionAtMs: number;
};

type MatchRuntime = {
  matchId: string;
  roomId: string;
  code: string;
  hostUserId: string;
  privateSeed: string;
  session: BuiltSession;
  phase: Phase;
  players: Map<string, PlayerState>;
  timer: ReturnType<typeof setTimeout> | null;
  answerKey: Array<{ questionId: string; answerId: string; optionIds: string[] }>;
};

const roomsByCode = new Map<string, string>(); // code -> roomId
const runtimeByMatch = new Map<string, MatchRuntime>();
const matchByUser = new Map<string, string>();
const socketByUser = new Map<string, string>(); // userId -> socketId

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

export function buildSyncSession(privateSeed: string): BuiltSession {
  const settings = getPreset(SYNC_PRESET_ID);
  const meta = buildSessionMeta({
    seed: privateSeed,
    mode: 'practice',
    presetId: SYNC_PRESET_ID,
    contentVersion: CONTENT_VERSION,
  });
  return buildSession({ odors: pixelOdors(), settings, meta });
}

export const CreateRoomBody = z
  .object({
    protocolVersion: z.string(),
    gameVersion: z.string(),
    contentVersion: z.string(),
  })
  .strict();

export const JoinRoomBody = z
  .object({
    code: z.string().min(4).max(8),
    protocolVersion: z.string(),
    gameVersion: z.string(),
    contentVersion: z.string(),
  })
  .strict();

function assertVersions(body: {
  protocolVersion: string;
  gameVersion: string;
  contentVersion: string;
}): void {
  if (body.protocolVersion !== PROTOCOL_VERSION) throw httpError(409, 'version_mismatch');
  if (body.gameVersion !== PIXEL_GAME_VERSION) throw httpError(409, 'version_mismatch');
  if (body.contentVersion !== CONTENT_VERSION) throw httpError(409, 'version_mismatch');
}

export async function createSyncRoom(
  db: Db,
  args: { userId: string; publicId: string; nickname: string; body: unknown },
) {
  const parsed = CreateRoomBody.safeParse(args.body ?? {});
  if (!parsed.success) throw httpError(400, 'invalid_body');
  assertVersions(parsed.data);

  let code = roomCode();
  for (let i = 0; i < 5 && roomsByCode.has(code); i++) code = roomCode();

  const privateSeed = freshMatchSeed();
  const roomIns = await db.query<{ id: string }>(
    `INSERT INTO rooms (code, host_user_id, status, protocol_version, game_version, content_version, public_config, server_truth)
     VALUES ($1, $2, 'open', $3, $4, $5, $6::jsonb, $7::jsonb)
     RETURNING id`,
    [
      code,
      args.userId,
      PROTOCOL_VERSION,
      PIXEL_GAME_VERSION,
      CONTENT_VERSION,
      JSON.stringify({ gameKey: 'pixel', mode: 'sync_race', minPlayers: SYNC_MIN_PLAYERS, maxPlayers: SYNC_MAX_PLAYERS }),
      JSON.stringify({ privateSeed }),
    ],
  );
  const roomId = roomIns.rows[0]!.id;
  roomsByCode.set(code, roomId);

  const matchIns = await db.query<{ id: string }>(
    `INSERT INTO matches (room_id, game_key, status, protocol_version, game_version, content_version, server_truth)
     VALUES ($1, 'pixel', 'lobby', $2, $3, $4, $5::jsonb)
     RETURNING id`,
    [roomId, PROTOCOL_VERSION, PIXEL_GAME_VERSION, CONTENT_VERSION, JSON.stringify({ privateSeed })],
  );
  const matchId = matchIns.rows[0]!.id;

  await db.query(
    `INSERT INTO match_players (match_id, user_id, seat, public_state, server_truth)
     VALUES ($1, $2, 0, $3::jsonb, '{}'::jsonb)`,
    [matchId, args.userId, JSON.stringify({ publicId: args.publicId, nickname: args.nickname, ready: false })],
  );

  const session = buildSyncSession(privateSeed);
  const runtime: MatchRuntime = {
    matchId,
    roomId,
    code,
    hostUserId: args.userId,
    privateSeed,
    session,
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
          score: 0,
          correctCount: 0,
          answeredThisRound: false,
          lastReactionAtMs: 0,
        },
      ],
    ]),
    timer: null,
    answerKey: session.questions.map((q) => ({
      questionId: questionIdForRound(q.round),
      answerId: q.answerId,
      optionIds: [...q.optionIds],
    })),
  };
  runtimeByMatch.set(matchId, runtime);
  matchByUser.set(args.userId, matchId);

  const payload = publicLobby(runtime);
  assertNoAnswerLeak(payload);
  return payload;
}

export async function joinSyncRoom(
  db: Db,
  args: { userId: string; publicId: string; nickname: string; body: unknown },
) {
  const parsed = JoinRoomBody.safeParse(args.body ?? {});
  if (!parsed.success) throw httpError(400, 'invalid_body');
  assertVersions(parsed.data);

  const code = parsed.data.code.trim().toUpperCase();
  const roomRes = await db.query<{ id: string; status: string; server_truth: unknown }>(
    `SELECT id, status, server_truth FROM rooms WHERE code = $1`,
    [code],
  );
  const room = roomRes.rows[0];
  if (!room || room.status !== 'open') throw httpError(404, 'room_not_found');

  const matchRes = await db.query<{ id: string; status: string }>(
    `SELECT id, status FROM matches WHERE room_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [room.id],
  );
  const match = matchRes.rows[0];
  if (!match) throw httpError(404, 'match_not_found');

  let runtime = runtimeByMatch.get(match.id);
  if (!runtime) {
    // Reconstruct lobby-only runtime if process restarted mid-lobby.
    const seed = (room.server_truth as { privateSeed?: string })?.privateSeed ?? freshMatchSeed();
    const session = buildSyncSession(seed);
    runtime = {
      matchId: match.id,
      roomId: room.id,
      code,
      hostUserId: '',
      privateSeed: seed,
      session,
      phase: { name: 'lobby' },
      players: new Map(),
      timer: null,
      answerKey: session.questions.map((q) => ({
        questionId: questionIdForRound(q.round),
        answerId: q.answerId,
        optionIds: [...q.optionIds],
      })),
    };
    const players = await db.query<{
      user_id: string;
      seat: number;
      public_state: { publicId?: string; nickname?: string; ready?: boolean };
    }>(`SELECT user_id, seat, public_state FROM match_players WHERE match_id = $1`, [match.id]);
    for (const p of players.rows) {
      runtime.players.set(p.user_id, {
        userId: p.user_id,
        publicId: p.public_state.publicId ?? 'unknown',
        nickname: p.public_state.nickname ?? 'Player',
        seat: p.seat,
        ready: Boolean(p.public_state.ready),
        connected: false,
        score: 0,
        correctCount: 0,
        answeredThisRound: false,
        lastReactionAtMs: 0,
      });
      if (p.seat === 0) runtime.hostUserId = p.user_id;
    }
    runtimeByMatch.set(match.id, runtime);
    roomsByCode.set(code, room.id);
  }

  if (runtime.phase.name !== 'lobby') throw httpError(409, 'match_already_started');
  if (runtime.players.has(args.userId)) {
    const payload = publicLobby(runtime);
    assertNoAnswerLeak(payload);
    return payload;
  }
  if (runtime.players.size >= SYNC_MAX_PLAYERS) throw httpError(409, 'room_full');

  const seat = runtime.players.size;
  await db.query(
    `INSERT INTO match_players (match_id, user_id, seat, public_state, server_truth)
     VALUES ($1, $2, $3, $4::jsonb, '{}'::jsonb)
     ON CONFLICT (match_id, user_id) DO NOTHING`,
    [
      match.id,
      args.userId,
      seat,
      JSON.stringify({ publicId: args.publicId, nickname: args.nickname, ready: false }),
    ],
  );

  runtime.players.set(args.userId, {
    userId: args.userId,
    publicId: args.publicId,
    nickname: args.nickname,
    seat,
    ready: false,
    connected: false,
    score: 0,
    correctCount: 0,
    answeredThisRound: false,
    lastReactionAtMs: 0,
  });
  matchByUser.set(args.userId, match.id);

  const payload = publicLobby(runtime);
  assertNoAnswerLeak(payload);
  return payload;
}

function publicPlayers(runtime: MatchRuntime) {
  return [...runtime.players.values()]
    .sort((a, b) => a.seat - b.seat)
    .map((p) => ({
      publicId: p.publicId,
      nickname: p.nickname,
      seat: p.seat,
      ready: p.ready,
      connected: p.connected,
      score: p.score,
      correctCount: p.correctCount,
      answered: p.answeredThisRound,
      isHost: p.userId === runtime.hostUserId,
    }));
}

function publicLobby(runtime: MatchRuntime) {
  return {
    roomId: runtime.roomId,
    matchId: runtime.matchId,
    code: runtime.code,
    phase: runtime.phase.name,
    protocolVersion: PROTOCOL_VERSION,
    gameVersion: PIXEL_GAME_VERSION,
    contentVersion: CONTENT_VERSION,
    questionCount: runtime.session.settings.questionCount,
    players: publicPlayers(runtime),
    minPlayers: SYNC_MIN_PLAYERS,
    maxPlayers: SYNC_MAX_PLAYERS,
  };
}

function clearTimer(runtime: MatchRuntime): void {
  if (runtime.timer) {
    clearTimeout(runtime.timer);
    runtime.timer = null;
  }
}

function emitToMatch(io: SocketServer, runtime: MatchRuntime, event: string, payload: unknown): void {
  assertNoAnswerLeak(payload);
  io.to(`match:${runtime.matchId}`).emit(event, payload);
}

function schedule(runtime: MatchRuntime, _io: SocketServer, delayMs: number, fn: () => void): void {
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
      PIXEL_GAME_VERSION,
      CONTENT_VERSION,
      eventType,
      JSON.stringify(publicPayload),
      JSON.stringify(serverTruth),
    ],
  );
}

function beginCountdown(io: SocketServer, db: Db, runtime: MatchRuntime): void {
  if (runtime.players.size < SYNC_MIN_PLAYERS) return;
  if (![...runtime.players.values()].every((p) => p.ready)) return;
  if (runtime.phase.name !== 'lobby') return;

  const endsAtMs = Date.now() + SYNC_COUNTDOWN_MS;
  runtime.phase = { name: 'countdown', endsAtMs };
  void appendEvent(db, runtime.matchId, 'countdown', { endsAtMs });
  void db.query(`UPDATE matches SET status = 'countdown' WHERE id = $1`, [runtime.matchId]);
  void db.query(`UPDATE rooms SET status = 'locked' WHERE id = $1`, [runtime.roomId]);

  emitToMatch(io, runtime, 'sync_phase', {
    phase: 'countdown',
    endsAtMs,
    serverNowMs: Date.now(),
    players: publicPlayers(runtime),
  });

  schedule(runtime, io, SYNC_COUNTDOWN_MS, () => {
    openQuestion(io, db, runtime, 0);
  });
}

function openQuestion(io: SocketServer, db: Db, runtime: MatchRuntime, round: number): void {
  const q = runtime.session.questions[round];
  if (!q) {
    finishMatch(io, db, runtime);
    return;
  }
  for (const p of runtime.players.values()) p.answeredThisRound = false;
  const endsAtMs = Date.now() + SYNC_QUESTION_MS;
  runtime.phase = { name: 'question', round, endsAtMs };
  const publicQ = toPublicQuestion(q);
  void appendEvent(db, runtime.matchId, 'question_open', { round, endsAtMs, questionId: publicQ.questionId });
  void db.query(`UPDATE matches SET status = 'question' WHERE id = $1`, [runtime.matchId]);

  emitToMatch(io, runtime, 'sync_phase', {
    phase: 'question',
    round,
    endsAtMs,
    serverNowMs: Date.now(),
    question: publicQ,
    settings: {
      matrixSize: runtime.session.settings.matrixSize,
      patternDisplayMs: runtime.session.settings.patternDisplayMs,
    },
    players: publicPlayers(runtime),
  });

  schedule(runtime, io, SYNC_QUESTION_MS, () => {
    closeQuestion(io, db, runtime, round);
  });
}

function closeQuestion(io: SocketServer, db: Db, runtime: MatchRuntime, round: number): void {
  const key = runtime.answerKey[round];
  // Unanswered players stay unanswered; no host override.
  runtime.phase = { name: 'between', round, endsAtMs: Date.now() + SYNC_INTER_QUESTION_MS };
  void appendEvent(
    db,
    runtime.matchId,
    'question_close',
    { round, questionId: key?.questionId },
    { answerId: key?.answerId },
  );

  emitToMatch(io, runtime, 'sync_phase', {
    phase: 'between',
    round,
    endsAtMs: runtime.phase.endsAtMs,
    serverNowMs: Date.now(),
    // Correct option revealed only after close — not opponents' picks.
    correctOptionId: key?.answerId ?? null,
    players: publicPlayers(runtime),
  });

  schedule(runtime, io, SYNC_INTER_QUESTION_MS, () => {
    openQuestion(io, db, runtime, round + 1);
  });
}

function finishMatch(io: SocketServer, db: Db, runtime: MatchRuntime): void {
  clearTimer(runtime);
  runtime.phase = { name: 'finished' };
  const standings = publicPlayers(runtime)
    .slice()
    .sort((a, b) => b.correctCount - a.correctCount || b.score - a.score || a.seat - b.seat);

  const result = {
    serverVerified: true as const,
    matchId: runtime.matchId,
    gameVersion: PIXEL_GAME_VERSION,
    contentVersion: CONTENT_VERSION,
    protocolVersion: PROTOCOL_VERSION,
    standings,
    questionCount: runtime.session.settings.questionCount,
    reportPath: '/api/v1/reports',
  };

  void appendEvent(db, runtime.matchId, 'match_finish', result);
  void db.query(
    `UPDATE matches SET status = 'finished', finished_at = now(), public_result = $2::jsonb WHERE id = $1`,
    [runtime.matchId, JSON.stringify(result)],
  );
  void db.query(`UPDATE rooms SET status = 'closed', closed_at = now() WHERE id = $1`, [runtime.roomId]);

  emitToMatch(io, runtime, 'sync_phase', {
    phase: 'finished',
    serverNowMs: Date.now(),
    result,
  });
}

function handleAnswer(
  io: SocketServer,
  db: Db,
  runtime: MatchRuntime,
  userId: string,
  payload: unknown,
): void {
  if (runtime.phase.name !== 'question') {
    emitUser(io, userId, 'sync_error', { error: 'question_closed' });
    return;
  }
  const parsed = z
    .object({
      questionId: z.string(),
      selectedOptionId: z.string(),
      protocolVersion: z.string(),
      gameVersion: z.string(),
      contentVersion: z.string(),
    })
    .strict()
    .safeParse(payload);
  if (!parsed.success) {
    emitUser(io, userId, 'sync_error', { error: 'invalid_body' });
    return;
  }
  if (
    parsed.data.protocolVersion !== PROTOCOL_VERSION ||
    parsed.data.gameVersion !== PIXEL_GAME_VERSION ||
    parsed.data.contentVersion !== CONTENT_VERSION
  ) {
    emitUser(io, userId, 'sync_error', { error: 'version_mismatch' });
    return;
  }

  const round = runtime.phase.round;
  const expectedId = questionIdForRound(round);
  if (parsed.data.questionId !== expectedId || roundFromQuestionId(parsed.data.questionId) !== round) {
    emitUser(io, userId, 'sync_error', { error: 'out_of_order' });
    return;
  }

  const player = runtime.players.get(userId);
  if (!player) return;
  if (player.answeredThisRound) {
    emitUser(io, userId, 'sync_error', { error: 'duplicate_answer' });
    return;
  }
  if (Date.now() > runtime.phase.endsAtMs) {
    emitUser(io, userId, 'sync_error', { error: 'time_window_exceeded' });
    return;
  }

  const q = runtime.session.questions[round]!;
  if (!q.optionIds.includes(parsed.data.selectedOptionId)) {
    emitUser(io, userId, 'sync_error', { error: 'invalid_option' });
    return;
  }

  const outcome = applyAnswer({
    settings: runtime.session.settings,
    currentScore: player.score,
    answerId: q.answerId,
    optionIds: q.optionIds,
    chosenId: parsed.data.selectedOptionId,
    alreadyAnswered: false,
  });

  player.answeredThisRound = true;
  player.score = outcome.nextScore;
  if (outcome.correct) player.correctCount += 1;

  void appendEvent(
    db,
    runtime.matchId,
    'answer',
    { publicId: player.publicId, questionId: expectedId, answered: true },
    {
      userId,
      selectedOptionId: parsed.data.selectedOptionId,
      correct: outcome.correct,
    },
  );

  // Broadcast answered flag + scores only — never selected option.
  emitToMatch(io, runtime, 'sync_player_update', {
    players: publicPlayers(runtime),
  });
  emitUser(io, userId, 'sync_answer_feedback', {
    correct: outcome.correct,
    score: player.score,
    correctCount: player.correctCount,
  });

  if ([...runtime.players.values()].every((p) => p.answeredThisRound || !p.connected)) {
    // Early close when everyone who is connected has answered.
    if ([...runtime.players.values()].filter((p) => p.connected).every((p) => p.answeredThisRound)) {
      clearTimer(runtime);
      closeQuestion(io, db, runtime, round);
    }
  }
}

function emitUser(io: SocketServer, userId: string, event: string, payload: unknown): void {
  const sid = socketByUser.get(userId);
  if (!sid) return;
  assertNoAnswerLeak(payload);
  io.to(sid).emit(event, payload);
}

function handleReaction(io: SocketServer, runtime: MatchRuntime, userId: string, payload: unknown): void {
  const parsed = z.object({ kind: z.enum(REACTIONS) }).strict().safeParse(payload);
  if (!parsed.success) {
    emitUser(io, userId, 'sync_error', { error: 'invalid_reaction' });
    return;
  }
  const player = runtime.players.get(userId);
  if (!player) return;
  const now = Date.now();
  if (now - player.lastReactionAtMs < SYNC_REACTION_COOLDOWN_MS) {
    emitUser(io, userId, 'sync_error', { error: 'reaction_cooldown' });
    return;
  }
  player.lastReactionAtMs = now;
  emitToMatch(io, runtime, 'sync_reaction', {
    publicId: player.publicId,
    kind: parsed.data.kind,
    atMs: now,
  });
}

export function attachSyncRaceHandlers(io: SocketServer, db: Db): void {
  io.on('connection', (socket: Socket) => {
    const userId = (socket.data as { userId?: string }).userId;
    if (!userId) return;

    socketByUser.set(userId, socket.id);

    const existingMatchId = matchByUser.get(userId);
    if (existingMatchId) {
      const runtime = runtimeByMatch.get(existingMatchId);
      if (runtime) {
        const player = runtime.players.get(userId);
        if (player) {
          player.connected = true;
          void socket.join(`match:${runtime.matchId}`);
          // Reconnect allowed through end of current question.
          const snapshot = reconnectSnapshot(runtime);
          assertNoAnswerLeak(snapshot);
          socket.emit('sync_reconnected', snapshot);
          emitToMatch(io, runtime, 'sync_player_update', { players: publicPlayers(runtime) });
        }
      }
    }

    socket.on('sync_join_match', (payload: unknown) => {
      const parsed = z.object({ matchId: z.string().uuid() }).safeParse(payload);
      if (!parsed.success) {
        socket.emit('sync_error', { error: 'invalid_body' });
        return;
      }
      const runtime = runtimeByMatch.get(parsed.data.matchId);
      if (!runtime || !runtime.players.has(userId)) {
        socket.emit('sync_error', { error: 'not_in_match' });
        return;
      }
      matchByUser.set(userId, runtime.matchId);
      const player = runtime.players.get(userId)!;
      player.connected = true;
      void socket.join(`match:${runtime.matchId}`);
      const snap = reconnectSnapshot(runtime);
      assertNoAnswerLeak(snap);
      socket.emit('sync_reconnected', snap);
      emitToMatch(io, runtime, 'sync_player_update', { players: publicPlayers(runtime) });
    });

    socket.on('sync_ready', (payload: unknown) => {
      const runtime = runtimeForUser(userId);
      if (!runtime) {
        socket.emit('sync_error', { error: 'not_in_match' });
        return;
      }
      if (runtime.phase.name !== 'lobby') {
        socket.emit('sync_error', { error: 'not_in_lobby' });
        return;
      }
      const parsed = z.object({ ready: z.boolean() }).safeParse(payload ?? { ready: true });
      if (!parsed.success) return;
      const player = runtime.players.get(userId);
      if (!player) return;
      player.ready = parsed.data.ready;
      void db.query(
        `UPDATE match_players SET public_state = jsonb_set(public_state, '{ready}', $3::jsonb)
         WHERE match_id = $1 AND user_id = $2`,
        [runtime.matchId, userId, JSON.stringify(player.ready)],
      );
      emitToMatch(io, runtime, 'sync_player_update', { players: publicPlayers(runtime) });
      beginCountdown(io, db, runtime);
    });

    socket.on('sync_answer', (payload: unknown) => {
      const runtime = runtimeForUser(userId);
      if (!runtime) {
        socket.emit('sync_error', { error: 'not_in_match' });
        return;
      }
      handleAnswer(io, db, runtime, userId, payload);
    });

    socket.on('sync_reaction', (payload: unknown) => {
      const runtime = runtimeForUser(userId);
      if (!runtime) {
        socket.emit('sync_error', { error: 'not_in_match' });
        return;
      }
      handleReaction(io, runtime, userId, payload);
    });

    socket.on('disconnect', () => {
      if (socketByUser.get(userId) === socket.id) socketByUser.delete(userId);
      const runtime = runtimeForUser(userId);
      if (!runtime) return;
      const player = runtime.players.get(userId);
      if (!player) return;
      player.connected = false;
      emitToMatch(io, runtime, 'sync_player_update', { players: publicPlayers(runtime) });
      // If in question and all remaining connected players answered, close early.
      if (runtime.phase.name === 'question') {
        const connected = [...runtime.players.values()].filter((p) => p.connected);
        if (connected.length > 0 && connected.every((p) => p.answeredThisRound)) {
          clearTimer(runtime);
          closeQuestion(io, db, runtime, runtime.phase.round);
        }
      }
    });
  });
}

function runtimeForUser(userId: string): MatchRuntime | undefined {
  const matchId = matchByUser.get(userId);
  if (!matchId) return undefined;
  return runtimeByMatch.get(matchId);
}

function reconnectSnapshot(runtime: MatchRuntime) {
  const base = publicLobby(runtime);
  if (runtime.phase.name === 'question') {
    const q = runtime.session.questions[runtime.phase.round]!;
    return {
      ...base,
      phase: 'question' as const,
      round: runtime.phase.round,
      endsAtMs: runtime.phase.endsAtMs,
      serverNowMs: Date.now(),
      question: toPublicQuestion(q),
      settings: {
        matrixSize: runtime.session.settings.matrixSize,
        patternDisplayMs: runtime.session.settings.patternDisplayMs,
      },
    };
  }
  if (runtime.phase.name === 'countdown' || runtime.phase.name === 'between') {
    return {
      ...base,
      phase: runtime.phase.name,
      endsAtMs: runtime.phase.endsAtMs,
      serverNowMs: Date.now(),
      round: runtime.phase.name === 'between' ? runtime.phase.round : undefined,
    };
  }
  if (runtime.phase.name === 'finished') {
    return {
      ...base,
      phase: 'finished' as const,
      players: publicPlayers(runtime),
    };
  }
  return { ...base, phase: 'lobby' as const };
}

/** Test helper — clear in-memory race state between integration cases. */
export function resetSyncRaceMemory(): void {
  for (const rt of runtimeByMatch.values()) clearTimer(rt);
  runtimeByMatch.clear();
  roomsByCode.clear();
  matchByUser.clear();
  socketByUser.clear();
}
