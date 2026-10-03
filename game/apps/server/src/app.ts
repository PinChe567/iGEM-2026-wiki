import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyInstance } from 'fastify';
import type { Server as HttpServer } from 'node:http';
import { Server as SocketServer } from 'socket.io';
import { z } from 'zod';
import type { ServerConfig } from './config.js';
import { GuestCreateBody, ProfilePatchBody, PROTOCOL_VERSION } from './config.js';
import type { Db } from './db/pool.js';
import {
  clearSessionCookie,
  consumeWsTicket,
  createGuestSession,
  destroySession,
  issueWsTicket,
  loadSessionFromRequest,
  setSessionCookie,
  verifyCsrf,
} from './auth/session.js';
import { normalizeNickname } from './nickname.js';
import { createLogger } from './security/crypto.js';
import { SUPPORTED, assertCompatibleVersions } from './versions.js';
import {
  ensurePixelDailyChallenge,
  publicChallengeView,
} from './pixel/daily.js';
import {
  answerPixelDailyRun,
  finishPixelDailyRun,
  getPixelRun,
  startPixelDailyRun,
} from './pixel/runs.js';
import {
  attachSyncRaceHandlers,
  createSyncRoom,
  joinSyncRoom,
} from './pixel/sync-race.js';
import {
  ensureSpectrumDailyChallenge,
  publicSpectrumChallengeView,
} from './spectrum/daily.js';
import {
  finishSpectrumDailyRun,
  getSpectrumRun,
  guessSpectrumDailyRun,
  startSpectrumDailyRun,
} from './spectrum/runs.js';
import {
  attachSpectrumRaceHandlers,
  createSpectrumRace,
  joinSpectrumRace,
} from './spectrum/race.js';

const GUEST_DISCLAIMER =
  'Guest sessions are device-local. Without account recovery, changing browser or device will not restore this guest profile.';

function originAllowed(config: ServerConfig, origin: string | undefined): boolean {
  if (!origin) return true; // same-origin / non-browser
  return config.originAllowlist.includes(origin);
}

async function requireCsrf(
  db: Db,
  config: ServerConfig,
  request: { auth?: { id: string }; headers: Record<string, unknown> },
  reply: { code: (n: number) => { send: (b: unknown) => unknown } },
): Promise<boolean> {
  if (!request.auth) {
    reply.code(401).send({ error: 'unauthorized' });
    return false;
  }
  const csrf = request.headers['x-csrf-token'];
  const csrfOk = await verifyCsrf(
    db,
    config,
    request.auth.id,
    typeof csrf === 'string' ? csrf : undefined,
  );
  if (!csrfOk) {
    reply.code(403).send({ error: 'csrf_invalid' });
    return false;
  }
  return true;
}

export type AppContext = {
  config: ServerConfig;
  db: Db;
  log: ReturnType<typeof createLogger>;
};

export async function buildApp(ctx: AppContext): Promise<{
  app: FastifyInstance;
  attachSocket: (httpServer: HttpServer) => SocketServer;
}> {
  const { config, db, log } = ctx;

  const app = Fastify({
    logger: false,
    bodyLimit: config.bodyLimitBytes,
    trustProxy: false,
  });

  await app.register(cookie);
  await app.register(cors, {
    origin: (origin, cb) => {
      if (originAllowed(config, origin)) cb(null, true);
      else cb(new Error('origin_not_allowed'), false);
    },
    credentials: true,
  });
  await app.register(rateLimit, {
    max: config.rateLimitMax,
    timeWindow: config.rateLimitWindowMs,
    hook: 'onRequest',
    allowList: [],
  });

  app.addHook('onRequest', async (request, reply) => {
    const origin = request.headers.origin;
    if (origin && !originAllowed(config, origin)) {
      return reply.code(403).send({ error: 'origin_not_allowed' });
    }
  });

  app.addHook('preHandler', async (request) => {
    request.auth = (await loadSessionFromRequest(db, config, request)) ?? undefined;
  });

  app.setErrorHandler((err, _req, reply) => {
    const e = err as Error & { statusCode?: number; code?: string };
    if (e.message === 'origin_not_allowed' || e.code === 'FST_ERR_CTP_INVALID_MEDIA_TYPE') {
      const status = e.message === 'origin_not_allowed' ? 403 : 415;
      return reply.code(status).send({
        error: e.message === 'origin_not_allowed' ? 'origin_not_allowed' : 'invalid_media',
      });
    }
    const status = e.statusCode ?? 500;
    const code = e.code;
    if (status >= 500) log.error('request_error', { message: e.message });
    reply.code(status).send({
      error: code ?? (status >= 500 ? 'internal_error' : e.message),
    });
  });

  app.get('/health', async () => ({
    ok: true,
    protocolVersion: PROTOCOL_VERSION,
    api: 'pixel-online-verified',
  }));

  app.post(
    '/api/v1/session/guest',
    {
      config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      const parsed = GuestCreateBody.safeParse(request.body ?? {});
      if (!parsed.success) {
        return reply.code(400).send({ error: 'invalid_body' });
      }
      try {
        const created = await createGuestSession(db, config, parsed.data.nickname);
        setSessionCookie(reply, config, created.rawToken);
        return {
          publicId: created.session.user.publicId,
          nickname: created.session.user.nickname,
          isGuest: true,
          csrfToken: created.csrfToken,
          guestDisclaimer: GUEST_DISCLAIMER,
          protocolVersion: PROTOCOL_VERSION,
        };
      } catch (e) {
        const err = e as Error & { statusCode?: number; code?: string };
        return reply.code(err.statusCode ?? 500).send({ error: err.code ?? 'guest_failed' });
      }
    },
  );

  app.get('/api/v1/session/me', async (request, reply) => {
    if (!request.auth) return reply.code(401).send({ error: 'unauthorized' });
    return {
      publicId: request.auth.user.publicId,
      nickname: request.auth.user.nickname,
      isGuest: request.auth.user.isGuest,
      guestDisclaimer: GUEST_DISCLAIMER,
      protocolVersion: PROTOCOL_VERSION,
    };
  });

  app.post('/api/v1/session/logout', async (request, reply) => {
    if (!(await requireCsrf(db, config, request, reply))) return;
    await destroySession(db, request.auth!.id);
    clearSessionCookie(reply, config);
    return { ok: true };
  });

  app.patch('/api/v1/profile', async (request, reply) => {
    if (!(await requireCsrf(db, config, request, reply))) return;

    const parsed = ProfilePatchBody.safeParse(request.body ?? {});
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_body' });
    const nick = normalizeNickname(parsed.data.nickname);
    if (!nick.ok) return reply.code(400).send({ error: nick.code });

    await db.query(`UPDATE users SET nickname = $2, updated_at = now() WHERE id = $1`, [
      request.auth!.user.id,
      nick.nickname,
    ]);
    return {
      publicId: request.auth!.user.publicId,
      nickname: nick.nickname,
      isGuest: request.auth!.user.isGuest,
    };
  });

  app.get('/api/v1/profiles/:publicId', async (request, reply) => {
    const { publicId } = request.params as { publicId: string };
    if (!/^[A-Za-z0-9_-]{3,40}$/.test(publicId)) {
      return reply.code(400).send({ error: 'invalid_public_id' });
    }
    const res = await db.query<{ public_id: string; nickname: string; is_guest: boolean }>(
      `SELECT public_id, nickname, is_guest FROM users WHERE public_id = $1`,
      [publicId],
    );
    const row = res.rows[0];
    if (!row) return reply.code(404).send({ error: 'not_found' });
    return {
      publicId: row.public_id,
      nickname: row.nickname,
      isGuest: row.is_guest,
    };
  });

  app.get('/api/v1/daily/:gameKey', async (request, reply) => {
    const { gameKey } = request.params as { gameKey: string };
    if (!['pixel', 'labyrinth', 'spectrum'].includes(gameKey)) {
      return reply.code(400).send({ error: 'unknown_game' });
    }

    if (gameKey === 'pixel') {
      const challenge = await ensurePixelDailyChallenge(db, config.challengeSecret);
      return publicChallengeView(challenge);
    }

    if (gameKey === 'spectrum') {
      const challenge = await ensureSpectrumDailyChallenge(db, config.challengeSecret);
      return publicSpectrumChallengeView(challenge);
    }

    // Labyrinth: metadata stub only (not in this delivery).
    const today = new Date().toISOString().slice(0, 10);
    const res = await db.query<{
      id: string;
      game_key: string;
      challenge_date: string;
      protocol_version: string;
      game_version: string;
      content_version: string;
      public_metadata: unknown;
    }>(
      `SELECT id, game_key, challenge_date::text, protocol_version, game_version, content_version, public_metadata
       FROM daily_challenges
       WHERE game_key = $1 AND challenge_date = $2::date`,
      [gameKey, today],
    );
    let row = res.rows[0];
    if (!row) {
      const versions = SUPPORTED.games[gameKey as keyof typeof SUPPORTED.games];
      const ins = await db.query<{
        id: string;
        game_key: string;
        challenge_date: string;
        protocol_version: string;
        game_version: string;
        content_version: string;
        public_metadata: unknown;
      }>(
        `INSERT INTO daily_challenges
           (game_key, challenge_date, protocol_version, game_version, content_version, public_metadata, server_truth)
         VALUES ($1, $2::date, $3, $4, $5, $6::jsonb, $7::jsonb)
         ON CONFLICT (game_key, challenge_date) DO UPDATE SET game_key = EXCLUDED.game_key
         RETURNING id, game_key, challenge_date::text, protocol_version, game_version, content_version, public_metadata`,
        [
          gameKey,
          today,
          PROTOCOL_VERSION,
          versions.gameVersion,
          versions.contentVersion,
          JSON.stringify({ title: `${gameKey} daily`, open: true }),
          JSON.stringify({ seedHint: 'server-only' }),
        ],
      );
      row = ins.rows[0]!;
    }

    return {
      challengeId: row.id,
      gameKey: row.game_key,
      date: row.challenge_date,
      protocolVersion: row.protocol_version,
      gameVersion: row.game_version,
      contentVersion: row.content_version,
      metadata: row.public_metadata,
    };
  });

  app.get('/api/v1/leaderboards/:challengeId', async (request, reply) => {
    const { challengeId } = request.params as { challengeId: string };
    if (!z.string().uuid().safeParse(challengeId).success) {
      return reply.code(400).send({ error: 'invalid_challenge_id' });
    }

    const challenge = await db.query<{
      game_version: string;
      content_version: string;
      game_key: string;
    }>(`SELECT game_version, content_version, game_key FROM daily_challenges WHERE id = $1`, [
      challengeId,
    ]);
    const ch = challenge.rows[0];
    if (!ch) return reply.code(404).send({ error: 'challenge_not_found' });

    const res = await db.query<{
      public_id: string;
      nickname: string;
      published_score: number;
      published_rank: number | null;
      public_payload: unknown;
      correct_count: number | null;
      duration_ms: number | null;
      completed_at: string | null;
      ranked: boolean;
      game_version: string | null;
      content_version: string | null;
      solved: boolean | null;
      guesses_used: number | null;
    }>(
      ch.game_key === 'spectrum'
        ? `SELECT u.public_id, u.nickname, le.published_score, le.published_rank, le.public_payload,
                 le.correct_count, le.duration_ms, le.completed_at::text, le.ranked,
                 le.game_version, le.content_version, le.solved, le.guesses_used
          FROM leaderboard_entries le
          JOIN users u ON u.id = le.user_id
          WHERE le.challenge_id = $1
            AND le.ranked = TRUE
            AND (le.game_version IS NULL OR le.game_version = $2)
            AND (le.content_version IS NULL OR le.content_version = $3)
          ORDER BY COALESCE(le.solved, FALSE) DESC,
                   le.guesses_used ASC NULLS LAST,
                   le.duration_ms ASC NULLS LAST,
                   le.completed_at ASC NULLS LAST
          LIMIT 100`
        : `SELECT u.public_id, u.nickname, le.published_score, le.published_rank, le.public_payload,
                 le.correct_count, le.duration_ms, le.completed_at::text, le.ranked,
                 le.game_version, le.content_version, le.solved, le.guesses_used
          FROM leaderboard_entries le
          JOIN users u ON u.id = le.user_id
          WHERE le.challenge_id = $1
            AND le.ranked = TRUE
            AND (le.game_version IS NULL OR le.game_version = $2)
            AND (le.content_version IS NULL OR le.content_version = $3)
          ORDER BY le.correct_count DESC NULLS LAST,
                   le.duration_ms ASC NULLS LAST,
                   le.completed_at ASC NULLS LAST,
                   le.published_score DESC,
                   le.created_at ASC
          LIMIT 100`,
      [challengeId, ch.game_version, ch.content_version],
    );

    const mapped = res.rows.map((r, i) => ({
      publicId: r.public_id,
      nickname: r.nickname,
      score: r.published_score,
      correctCount: r.correct_count,
      durationMs: r.duration_ms,
      completedAt: r.completed_at,
      solved: r.solved,
      guessesUsed: r.guesses_used,
      rank: r.published_rank ?? i + 1,
      payload: r.public_payload,
    }));

    if (ch.game_key === 'spectrum') {
      const entries = mapped.filter((e) => e.solved);
      const participation = mapped.filter((e) => !e.solved);
      return {
        challengeId,
        gameKey: ch.game_key,
        gameVersion: ch.game_version,
        contentVersion: ch.content_version,
        sort: ['solved DESC', 'guessesUsed ASC', 'elapsedMs ASC', 'completedAt ASC'],
        rankedPolicy: 'first_completed_only',
        entries,
        participation,
      };
    }

    return {
      challengeId,
      gameKey: ch.game_key,
      gameVersion: ch.game_version,
      contentVersion: ch.content_version,
      sort: ['correctCount DESC', 'durationMs ASC', 'completedAt ASC'],
      rankedPolicy: ch.game_key === 'pixel' ? 'first_completed_only' : undefined,
      entries: mapped,
    };
  });

  // —— Pixel Lab daily runs (server-verified) ——
  app.post('/api/v1/pixel/daily/runs/start', async (request, reply) => {
    if (!(await requireCsrf(db, config, request, reply))) return;
    try {
      return await startPixelDailyRun(db, {
        userId: request.auth!.user.id,
        challengeSecret: config.challengeSecret,
        body: request.body,
      });
    } catch (e) {
      const err = e as Error & { statusCode?: number; code?: string };
      return reply.code(err.statusCode ?? 500).send({ error: err.code ?? 'start_failed' });
    }
  });

  app.post('/api/v1/pixel/daily/runs/:runId/answer', async (request, reply) => {
    if (!(await requireCsrf(db, config, request, reply))) return;
    const { runId } = request.params as { runId: string };
    if (!z.string().uuid().safeParse(runId).success) {
      return reply.code(400).send({ error: 'invalid_run_id' });
    }
    try {
      return await answerPixelDailyRun(db, {
        userId: request.auth!.user.id,
        runId,
        body: request.body,
      });
    } catch (e) {
      const err = e as Error & { statusCode?: number; code?: string };
      return reply.code(err.statusCode ?? 500).send({ error: err.code ?? 'answer_failed' });
    }
  });

  app.post('/api/v1/pixel/daily/runs/:runId/finish', async (request, reply) => {
    if (!(await requireCsrf(db, config, request, reply))) return;
    const { runId } = request.params as { runId: string };
    if (!z.string().uuid().safeParse(runId).success) {
      return reply.code(400).send({ error: 'invalid_run_id' });
    }
    try {
      return await finishPixelDailyRun(db, {
        userId: request.auth!.user.id,
        runId,
        body: request.body,
      });
    } catch (e) {
      const err = e as Error & { statusCode?: number; code?: string };
      return reply.code(err.statusCode ?? 500).send({ error: err.code ?? 'finish_failed' });
    }
  });

  app.get('/api/v1/pixel/daily/runs/:runId', async (request, reply) => {
    if (!request.auth) return reply.code(401).send({ error: 'unauthorized' });
    const { runId } = request.params as { runId: string };
    if (!z.string().uuid().safeParse(runId).success) {
      return reply.code(400).send({ error: 'invalid_run_id' });
    }
    try {
      return await getPixelRun(db, { userId: request.auth.user.id, runId });
    } catch (e) {
      const err = e as Error & { statusCode?: number; code?: string };
      return reply.code(err.statusCode ?? 500).send({ error: err.code ?? 'run_failed' });
    }
  });

  // —— Sync Race lobby REST ——
  app.post('/api/v1/pixel/sync/rooms', async (request, reply) => {
    if (!(await requireCsrf(db, config, request, reply))) return;
    try {
      return await createSyncRoom(db, {
        userId: request.auth!.user.id,
        publicId: request.auth!.user.publicId,
        nickname: request.auth!.user.nickname,
        body: request.body,
      });
    } catch (e) {
      const err = e as Error & { statusCode?: number; code?: string };
      return reply.code(err.statusCode ?? 500).send({ error: err.code ?? 'room_create_failed' });
    }
  });

  app.post('/api/v1/pixel/sync/rooms/join', async (request, reply) => {
    if (!(await requireCsrf(db, config, request, reply))) return;
    try {
      return await joinSyncRoom(db, {
        userId: request.auth!.user.id,
        publicId: request.auth!.user.publicId,
        nickname: request.auth!.user.nickname,
        body: request.body,
      });
    } catch (e) {
      const err = e as Error & { statusCode?: number; code?: string };
      return reply.code(err.statusCode ?? 500).send({ error: err.code ?? 'room_join_failed' });
    }
  });

  // —— Spectrum daily runs (server-verified) ——
  app.post('/api/v1/spectrum/daily/runs/start', async (request, reply) => {
    if (!(await requireCsrf(db, config, request, reply))) return;
    try {
      return await startSpectrumDailyRun(db, {
        userId: request.auth!.user.id,
        challengeSecret: config.challengeSecret,
        body: request.body,
      });
    } catch (e) {
      const err = e as Error & { statusCode?: number; code?: string };
      return reply.code(err.statusCode ?? 500).send({ error: err.code ?? 'start_failed' });
    }
  });

  app.post('/api/v1/spectrum/daily/runs/:runId/guess', async (request, reply) => {
    if (!(await requireCsrf(db, config, request, reply))) return;
    const { runId } = request.params as { runId: string };
    if (!z.string().uuid().safeParse(runId).success) {
      return reply.code(400).send({ error: 'invalid_run_id' });
    }
    try {
      return await guessSpectrumDailyRun(db, {
        userId: request.auth!.user.id,
        runId,
        body: request.body,
      });
    } catch (e) {
      const err = e as Error & { statusCode?: number; code?: string };
      return reply.code(err.statusCode ?? 500).send({ error: err.code ?? 'guess_failed' });
    }
  });

  app.post('/api/v1/spectrum/daily/runs/:runId/finish', async (request, reply) => {
    if (!(await requireCsrf(db, config, request, reply))) return;
    const { runId } = request.params as { runId: string };
    if (!z.string().uuid().safeParse(runId).success) {
      return reply.code(400).send({ error: 'invalid_run_id' });
    }
    try {
      return await finishSpectrumDailyRun(db, {
        userId: request.auth!.user.id,
        runId,
        body: request.body,
      });
    } catch (e) {
      const err = e as Error & { statusCode?: number; code?: string };
      return reply.code(err.statusCode ?? 500).send({ error: err.code ?? 'finish_failed' });
    }
  });

  app.get('/api/v1/spectrum/daily/runs/:runId', async (request, reply) => {
    if (!request.auth) return reply.code(401).send({ error: 'unauthorized' });
    const { runId } = request.params as { runId: string };
    if (!z.string().uuid().safeParse(runId).success) {
      return reply.code(400).send({ error: 'invalid_run_id' });
    }
    try {
      return await getSpectrumRun(db, { userId: request.auth.user.id, runId });
    } catch (e) {
      const err = e as Error & { statusCode?: number; code?: string };
      return reply.code(err.statusCode ?? 500).send({ error: err.code ?? 'run_failed' });
    }
  });

  // —— Spectrum race lobby REST ——
  app.post('/api/v1/spectrum/race/rooms', async (request, reply) => {
    if (!(await requireCsrf(db, config, request, reply))) return;
    try {
      return await createSpectrumRace(db, {
        userId: request.auth!.user.id,
        publicId: request.auth!.user.publicId,
        nickname: request.auth!.user.nickname,
        body: request.body,
      });
    } catch (e) {
      const err = e as Error & { statusCode?: number; code?: string };
      return reply.code(err.statusCode ?? 500).send({ error: err.code ?? 'room_create_failed' });
    }
  });

  app.post('/api/v1/spectrum/race/rooms/join', async (request, reply) => {
    if (!(await requireCsrf(db, config, request, reply))) return;
    try {
      return await joinSpectrumRace(db, {
        userId: request.auth!.user.id,
        publicId: request.auth!.user.publicId,
        nickname: request.auth!.user.nickname,
        body: request.body,
      });
    } catch (e) {
      const err = e as Error & { statusCode?: number; code?: string };
      return reply.code(err.statusCode ?? 500).send({ error: err.code ?? 'room_join_failed' });
    }
  });

  app.post('/api/v1/reports', async (request, reply) => {
    if (!(await requireCsrf(db, config, request, reply))) return;
    const ReportBody = z
      .object({
        reason: z.string().min(3).max(500),
        reportedPublicId: z.string().min(3).max(40).optional(),
        context: z
          .object({
            challengeId: z.string().uuid().optional(),
            matchId: z.string().uuid().optional(),
            runId: z.string().uuid().optional(),
            note: z.string().max(500).optional(),
          })
          .strict()
          .optional(),
      })
      .strict();
    const parsed = ReportBody.safeParse(request.body ?? {});
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_body' });

    let reportedUserId = request.auth!.user.id;
    if (parsed.data.reportedPublicId) {
      const u = await db.query<{ id: string }>(`SELECT id FROM users WHERE public_id = $1`, [
        parsed.data.reportedPublicId,
      ]);
      if (!u.rows[0]) return reply.code(404).send({ error: 'reported_user_not_found' });
      reportedUserId = u.rows[0].id;
      if (reportedUserId === request.auth!.user.id) {
        return reply.code(400).send({ error: 'cannot_report_self' });
      }
    }

    // Self-report for challenge issues uses reporter as both when no target (moderation queue).
    if (!parsed.data.reportedPublicId) {
      await db.query(
        `INSERT INTO moderation_actions (actor_label, target_user_id, action_type, detail)
         VALUES ('player_report', $1, 'challenge_issue', $2::jsonb)`,
        [
          request.auth!.user.id,
          JSON.stringify({
            reason: parsed.data.reason,
            context: parsed.data.context ?? {},
            reporterPublicId: request.auth!.user.publicId,
          }),
        ],
      );
      return { ok: true, queued: true };
    }

    await db.query(
      `INSERT INTO reports (reporter_user_id, reported_user_id, reason, context)
       VALUES ($1, $2, $3, $4::jsonb)`,
      [
        request.auth!.user.id,
        reportedUserId,
        parsed.data.reason,
        JSON.stringify(parsed.data.context ?? {}),
      ],
    );
    return { ok: true, queued: true };
  });

  app.get('/api/v1/ws-ticket', async (request, reply) => {
    if (!request.auth) return reply.code(401).send({ error: 'unauthorized' });
    const ticket = await issueWsTicket(db, config, request.auth.user.id);
    return {
      ticket,
      expiresInMs: config.wsTicketTtlMs,
      protocolVersion: PROTOCOL_VERSION,
    };
  });

  // Legacy score POST remains disabled — use run finish / sync race instead.
  app.post('/api/v1/scores', async (_request, reply) => {
    return reply.code(501).send({
      error: 'score_ingestion_not_enabled',
      hint: 'Use /api/v1/pixel/daily/runs/*, /api/v1/spectrum/daily/runs/*, or race WebSocket events',
    });
  });

  function attachSocket(httpServer: HttpServer): SocketServer {
    const io = new SocketServer(httpServer, {
      path: '/socket.io',
      cors: {
        origin: config.originAllowlist,
        credentials: true,
      },
      maxHttpBufferSize: config.bodyLimitBytes,
      pingTimeout: config.wsIdleTimeoutMs,
      pingInterval: Math.floor(config.wsIdleTimeoutMs / 3),
    });

    io.use(async (socket, next) => {
      try {
        const origin = socket.handshake.headers.origin;
        if (origin && !originAllowed(config, String(origin))) {
          return next(new Error('origin_not_allowed'));
        }
        const ticket = (socket.handshake.auth as { ticket?: string })?.ticket;
        if (!ticket || typeof ticket !== 'string') {
          return next(new Error('ticket_required'));
        }
        const userId = await consumeWsTicket(db, config, ticket);
        if (!userId) return next(new Error('ticket_invalid'));
        (socket.data as { userId: string }).userId = userId;
        next();
      } catch {
        next(new Error('handshake_failed'));
      }
    });

    attachSyncRaceHandlers(io, db);
    attachSpectrumRaceHandlers(io, db);

    io.on('connection', (socket) => {
      socket.emit('hello', {
        protocolVersion: PROTOCOL_VERSION,
        supported: SUPPORTED,
      });

      socket.on('ping_suite', () => {
        socket.emit('pong_suite', { t: Date.now() });
      });

      socket.on('game_event', (payload: unknown) => {
        const Envelope = z.object({
          protocolVersion: z.string(),
          gameVersion: z.string(),
          contentVersion: z.string(),
          gameKey: z.enum(['pixel', 'labyrinth', 'spectrum']),
          challengeId: z.string().uuid().optional(),
          matchId: z.string().uuid().optional(),
          type: z.string(),
        });
        const parsed = Envelope.safeParse(payload);
        if (!parsed.success) {
          socket.emit('error_event', { error: 'invalid_envelope' });
          return;
        }
        const check = assertCompatibleVersions(parsed.data, parsed.data.gameKey);
        if (!check.ok) {
          socket.emit('error_event', { error: check.code, detail: check.detail });
          socket.disconnect(true);
          return;
        }
        socket.emit('event_ack', {
          type: parsed.data.type,
          challengeId: parsed.data.challengeId,
          matchId: parsed.data.matchId,
        });
      });
    });

    return io;
  }

  return { app, attachSocket };
}
