import { CONTENT_VERSION } from '@suite/content';
import { PIXEL_GAME_VERSION, assertNoAnswerLeak } from '@suite/core/pixel';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { io as ioClient, type Socket } from 'socket.io-client';
import { buildApp } from './app.js';
import { loadConfig, PROTOCOL_VERSION } from './config.js';
import { migrate } from './db/migrate.js';
import { createIntegrationDb, type Queryable } from './db/test-db.js';
import { createLogger } from './security/crypto.js';
import { buildPixelDailySession, ensurePixelDailyChallenge } from './pixel/daily.js';
import { resetSyncRaceMemory } from './pixel/sync-race.js';

const ORIGIN = 'http://127.0.0.1:5180';

function parseSetCookie(header: string | string[] | undefined): string | null {
  if (!header) return null;
  const raw = Array.isArray(header) ? header[0] : header;
  const m = raw.match(/suite_sid=([^;]+)/);
  return m ? m[1]! : null;
}

function versions() {
  return {
    protocolVersion: PROTOCOL_VERSION,
    gameVersion: PIXEL_GAME_VERSION,
    contentVersion: CONTENT_VERSION,
  };
}

async function guest(app: Awaited<ReturnType<typeof buildApp>>['app'], nickname: string) {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/session/guest',
    headers: { origin: ORIGIN, 'content-type': 'application/json' },
    payload: { nickname },
  });
  expect(res.statusCode).toBe(200);
  const body = res.json();
  const cookie = parseSetCookie(res.headers['set-cookie']);
  expect(cookie).toBeTruthy();
  return { cookie: cookie!, csrf: body.csrfToken as string, publicId: body.publicId as string };
}

describe('pixel server-verified online modes', () => {
  const config = loadConfig({
    ...process.env,
    NODE_ENV: 'test',
    HOST: '127.0.0.1',
    PORT: '8801',
    COOKIE_SECURE: 'false',
    ORIGIN_ALLOWLIST: ORIGIN,
    SESSION_SECRET: 'test-session-secret-32chars-min!!',
    CHALLENGE_SECRET: 'test-challenge-secret-32chars!!',
    DATABASE_URL:
      process.env.DATABASE_URL ??
      'postgres://suite:suite_dev_only@127.0.0.1:5433/suite_online',
    RATE_LIMIT_MAX: '500',
    BODY_LIMIT_BYTES: '8192',
  });

  let db: Queryable;
  let app: Awaited<ReturnType<typeof buildApp>>['app'];
  let attachSocket: Awaited<ReturnType<typeof buildApp>>['attachSocket'];
  let baseUrl: string;

  beforeAll(async () => {
    const created = await createIntegrationDb(config.databaseUrl);
    db = created.db;
    await migrate(db);
    const built = await buildApp({ config, db, log: createLogger('error') });
    app = built.app;
    attachSocket = built.attachSocket;
    await app.listen({ host: config.host, port: config.port });
    attachSocket(app.server);
    baseUrl = `http://${config.host}:${config.port}`;
  });

  beforeEach(() => {
    resetSyncRaceMemory();
  });

  afterAll(async () => {
    if (app) await app.close();
    if (db) await db.end();
  });

  it('builds identical public questions for the same UTC challenge', async () => {
    const a = await ensurePixelDailyChallenge(db, config.challengeSecret, '2099-01-15');
    const b = await ensurePixelDailyChallenge(db, config.challengeSecret, '2099-01-15');
    expect(a.id).toBe(b.id);
    expect(a.server_truth.privateSeed).toBe(b.server_truth.privateSeed);
    const sa = buildPixelDailySession(a.server_truth.privateSeed);
    const sb = buildPixelDailySession(b.server_truth.privateSeed);
    expect(sa.questions.map((q) => q.optionIds)).toEqual(sb.questions.map((q) => q.optionIds));
    expect(sa.questions.map((q) => q.displayCells)).toEqual(sb.questions.map((q) => q.displayCells));
  });

  it('daily metadata never leaks answer keys; run enforces order/dup/client-score rejection', async () => {
    const g = await guest(app, 'Daily Ace');
    const daily = await app.inject({
      method: 'GET',
      url: '/api/v1/daily/pixel',
      headers: { origin: ORIGIN },
    });
    expect(daily.statusCode).toBe(200);
    const dailyBody = daily.json();
    expect(dailyBody.rankedPolicy).toBe('first_completed_only');
    assertNoAnswerLeak(dailyBody);
    expect(JSON.stringify(dailyBody)).not.toMatch(/privateSeed|answerId|answerKey/);

    const rejectScore = await app.inject({
      method: 'POST',
      url: '/api/v1/pixel/daily/runs/start',
      headers: {
        origin: ORIGIN,
        cookie: `suite_sid=${g.cookie}`,
        'content-type': 'application/json',
        'x-csrf-token': g.csrf,
      },
      payload: { ...versions(), score: 999, correctCount: 10, durationMs: 1 },
    });
    expect(rejectScore.statusCode).toBe(400);
    expect(rejectScore.json().error).toBe('client_score_rejected');

    const oldClient = await app.inject({
      method: 'POST',
      url: '/api/v1/pixel/daily/runs/start',
      headers: {
        origin: ORIGIN,
        cookie: `suite_sid=${g.cookie}`,
        'content-type': 'application/json',
        'x-csrf-token': g.csrf,
      },
      payload: { ...versions(), gameVersion: '1.0.0' },
    });
    expect(oldClient.statusCode).toBe(409);
    expect(oldClient.json().error).toBe('version_mismatch');

    const start = await app.inject({
      method: 'POST',
      url: '/api/v1/pixel/daily/runs/start',
      headers: {
        origin: ORIGIN,
        cookie: `suite_sid=${g.cookie}`,
        'content-type': 'application/json',
        'x-csrf-token': g.csrf,
      },
      payload: versions(),
    });
    expect(start.statusCode).toBe(200);
    const run = start.json();
    assertNoAnswerLeak(run);
    expect(run.currentQuestion.questionId).toBe('q0');
    expect(run.questions[0]).not.toHaveProperty('answerId');

    const challenge = await ensurePixelDailyChallenge(db, config.challengeSecret);
    const session = buildPixelDailySession(challenge.server_truth.privateSeed);
    const correct0 = session.questions[0]!.answerId;

    const replayWrongOrder = await app.inject({
      method: 'POST',
      url: `/api/v1/pixel/daily/runs/${run.runId}/answer`,
      headers: {
        origin: ORIGIN,
        cookie: `suite_sid=${g.cookie}`,
        'content-type': 'application/json',
        'x-csrf-token': g.csrf,
      },
      payload: { ...versions(), questionId: 'q1', selectedOptionId: session.questions[1]!.answerId },
    });
    expect(replayWrongOrder.statusCode).toBe(409);
    expect(replayWrongOrder.json().error).toBe('out_of_order');

    const ans = await app.inject({
      method: 'POST',
      url: `/api/v1/pixel/daily/runs/${run.runId}/answer`,
      headers: {
        origin: ORIGIN,
        cookie: `suite_sid=${g.cookie}`,
        'content-type': 'application/json',
        'x-csrf-token': g.csrf,
      },
      payload: { ...versions(), questionId: 'q0', selectedOptionId: correct0 },
    });
    expect(ans.statusCode).toBe(200);
    expect(ans.json().correct).toBe(true);
    assertNoAnswerLeak(ans.json());

    const dup = await app.inject({
      method: 'POST',
      url: `/api/v1/pixel/daily/runs/${run.runId}/answer`,
      headers: {
        origin: ORIGIN,
        cookie: `suite_sid=${g.cookie}`,
        'content-type': 'application/json',
        'x-csrf-token': g.csrf,
      },
      payload: { ...versions(), questionId: 'q0', selectedOptionId: correct0 },
    });
    expect(dup.statusCode).toBe(409);
    expect(dup.json().error).toBe('out_of_order'); // nextRound already advanced

    // Double-click same next question
    const nextId = ans.json().nextQuestion.questionId as string;
    const nextCorrect = session.questions[1]!.answerId;
    const a1 = app.inject({
      method: 'POST',
      url: `/api/v1/pixel/daily/runs/${run.runId}/answer`,
      headers: {
        origin: ORIGIN,
        cookie: `suite_sid=${g.cookie}`,
        'content-type': 'application/json',
        'x-csrf-token': g.csrf,
      },
      payload: { ...versions(), questionId: nextId, selectedOptionId: nextCorrect },
    });
    const a2 = app.inject({
      method: 'POST',
      url: `/api/v1/pixel/daily/runs/${run.runId}/answer`,
      headers: {
        origin: ORIGIN,
        cookie: `suite_sid=${g.cookie}`,
        'content-type': 'application/json',
        'x-csrf-token': g.csrf,
      },
      payload: { ...versions(), questionId: nextId, selectedOptionId: nextCorrect },
    });
    const [r1, r2] = await Promise.all([a1, a2]);
    const codes = [r1.statusCode, r2.statusCode].sort();
    expect(codes).toEqual([200, 409]);
  });

  it('finish ignores client score fields; resume keeps original server timer; ranked first only; LB ties', async () => {
    const g = await guest(app, 'Rank Pilot');
    const challenge = await ensurePixelDailyChallenge(db, config.challengeSecret);
    const session = buildPixelDailySession(challenge.server_truth.privateSeed);

    const t0 = Date.now();
    const start = await app.inject({
      method: 'POST',
      url: '/api/v1/pixel/daily/runs/start',
      headers: {
        origin: ORIGIN,
        cookie: `suite_sid=${g.cookie}`,
        'content-type': 'application/json',
        'x-csrf-token': g.csrf,
      },
      payload: versions(),
    });
    const runId = start.json().runId as string;
    const startedAt = start.json().serverStartedAtMs as number;
    expect(startedAt).toBeGreaterThanOrEqual(t0 - 2000);

    // Simulate refresh resume — timer must not rewind
    await new Promise((r) => setTimeout(r, 50));
    const resume = await app.inject({
      method: 'POST',
      url: '/api/v1/pixel/daily/runs/start',
      headers: {
        origin: ORIGIN,
        cookie: `suite_sid=${g.cookie}`,
        'content-type': 'application/json',
        'x-csrf-token': g.csrf,
      },
      payload: versions(),
    });
    expect(resume.json().runId).toBe(runId);
    expect(resume.json().serverStartedAtMs).toBe(startedAt);
    expect(resume.json().elapsedMs).toBeGreaterThanOrEqual(40);

    for (let i = 0; i < session.questions.length; i++) {
      const q = session.questions[i]!;
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/pixel/daily/runs/${runId}/answer`,
        headers: {
          origin: ORIGIN,
          cookie: `suite_sid=${g.cookie}`,
          'content-type': 'application/json',
          'x-csrf-token': g.csrf,
        },
        payload: { ...versions(), questionId: `q${i}`, selectedOptionId: q.answerId },
      });
      expect(res.statusCode).toBe(200);
    }

    const finishReject = await app.inject({
      method: 'POST',
      url: `/api/v1/pixel/daily/runs/${runId}/finish`,
      headers: {
        origin: ORIGIN,
        cookie: `suite_sid=${g.cookie}`,
        'content-type': 'application/json',
        'x-csrf-token': g.csrf,
      },
      payload: { ...versions(), score: 1, correctCount: 1, durationMs: 1 },
    });
    expect(finishReject.statusCode).toBe(400);

    const finish = await app.inject({
      method: 'POST',
      url: `/api/v1/pixel/daily/runs/${runId}/finish`,
      headers: {
        origin: ORIGIN,
        cookie: `suite_sid=${g.cookie}`,
        'content-type': 'application/json',
        'x-csrf-token': g.csrf,
      },
      payload: versions(),
    });
    expect(finish.statusCode).toBe(200);
    const result = finish.json();
    assertNoAnswerLeak(result);
    expect(result.serverVerified).toBe(true);
    expect(result.ranked).toBe(true);
    expect(result.correctCount).toBe(session.questions.length);
    expect(result.reportPath).toBe('/api/v1/reports');

    // Second run is unranked practice
    const start2 = await app.inject({
      method: 'POST',
      url: '/api/v1/pixel/daily/runs/start',
      headers: {
        origin: ORIGIN,
        cookie: `suite_sid=${g.cookie}`,
        'content-type': 'application/json',
        'x-csrf-token': g.csrf,
      },
      payload: versions(),
    });
    expect(start2.json().rankedEligible).toBe(false);
    const runId2 = start2.json().runId as string;
    for (let i = 0; i < session.questions.length; i++) {
      await app.inject({
        method: 'POST',
        url: `/api/v1/pixel/daily/runs/${runId2}/answer`,
        headers: {
          origin: ORIGIN,
          cookie: `suite_sid=${g.cookie}`,
          'content-type': 'application/json',
          'x-csrf-token': g.csrf,
        },
        payload: {
          ...versions(),
          questionId: `q${i}`,
          selectedOptionId: session.questions[i]!.optionIds.find((id) => id !== session.questions[i]!.answerId)!,
        },
      });
    }
    const finish2 = await app.inject({
      method: 'POST',
      url: `/api/v1/pixel/daily/runs/${runId2}/finish`,
      headers: {
        origin: ORIGIN,
        cookie: `suite_sid=${g.cookie}`,
        'content-type': 'application/json',
        'x-csrf-token': g.csrf,
      },
      payload: versions(),
    });
    expect(finish2.json().ranked).toBe(false);

    // Tie-break: second guest slower → ranks after
    const g2 = await guest(app, 'Rank Bravo');
    const startB = await app.inject({
      method: 'POST',
      url: '/api/v1/pixel/daily/runs/start',
      headers: {
        origin: ORIGIN,
        cookie: `suite_sid=${g2.cookie}`,
        'content-type': 'application/json',
        'x-csrf-token': g2.csrf,
      },
      payload: versions(),
    });
    const runB = startB.json().runId as string;
    await new Promise((r) => setTimeout(r, 30));
    for (let i = 0; i < session.questions.length; i++) {
      await app.inject({
        method: 'POST',
        url: `/api/v1/pixel/daily/runs/${runB}/answer`,
        headers: {
          origin: ORIGIN,
          cookie: `suite_sid=${g2.cookie}`,
          'content-type': 'application/json',
          'x-csrf-token': g2.csrf,
        },
        payload: { ...versions(), questionId: `q${i}`, selectedOptionId: session.questions[i]!.answerId },
      });
    }
    await app.inject({
      method: 'POST',
      url: `/api/v1/pixel/daily/runs/${runB}/finish`,
      headers: {
        origin: ORIGIN,
        cookie: `suite_sid=${g2.cookie}`,
        'content-type': 'application/json',
        'x-csrf-token': g2.csrf,
      },
      payload: versions(),
    });

    const board = await app.inject({
      method: 'GET',
      url: `/api/v1/leaderboards/${challenge.id}`,
      headers: { origin: ORIGIN },
    });
    expect(board.statusCode).toBe(200);
    const entries = board.json().entries as Array<{ publicId: string; correctCount: number; durationMs: number }>;
    expect(entries.length).toBeGreaterThanOrEqual(2);
    expect(entries[0]!.correctCount).toBeGreaterThanOrEqual(entries[1]!.correctCount);
    if (entries[0]!.correctCount === entries[1]!.correctCount) {
      expect(entries[0]!.durationMs).toBeLessThanOrEqual(entries[1]!.durationMs);
    }
    assertNoAnswerLeak(board.json());
  });

  it('sync race: shared questions, answer privacy, reaction cooldown, reconnect before question end', async () => {
    const a = await guest(app, 'Racer A');
    const b = await guest(app, 'Racer B');

    const room = await app.inject({
      method: 'POST',
      url: '/api/v1/pixel/sync/rooms',
      headers: {
        origin: ORIGIN,
        cookie: `suite_sid=${a.cookie}`,
        'content-type': 'application/json',
        'x-csrf-token': a.csrf,
      },
      payload: versions(),
    });
    expect(room.statusCode).toBe(200);
    assertNoAnswerLeak(room.json());
    const code = room.json().code as string;
    const matchId = room.json().matchId as string;

    const join = await app.inject({
      method: 'POST',
      url: '/api/v1/pixel/sync/rooms/join',
      headers: {
        origin: ORIGIN,
        cookie: `suite_sid=${b.cookie}`,
        'content-type': 'application/json',
        'x-csrf-token': b.csrf,
      },
      payload: { ...versions(), code },
    });
    expect(join.statusCode).toBe(200);
    expect(join.json().matchId).toBe(matchId);

    const ticketA = await app.inject({
      method: 'GET',
      url: '/api/v1/ws-ticket',
      headers: { origin: ORIGIN, cookie: `suite_sid=${a.cookie}` },
    });
    const ticketB = await app.inject({
      method: 'GET',
      url: '/api/v1/ws-ticket',
      headers: { origin: ORIGIN, cookie: `suite_sid=${b.cookie}` },
    });

    const eventsA: unknown[] = [];
    const eventsB: unknown[] = [];

    const sockA = await connect(baseUrl, ticketA.json().ticket, ORIGIN);
    const sockB = await connect(baseUrl, ticketB.json().ticket, ORIGIN);
    sockA.on('sync_phase', (p) => eventsA.push(p));
    sockB.on('sync_phase', (p) => eventsB.push(p));
    sockA.on('sync_player_update', (p) => eventsA.push(p));
    sockB.on('sync_player_update', (p) => eventsB.push(p));

    sockA.emit('sync_join_match', { matchId });
    sockB.emit('sync_join_match', { matchId });
    await sleep(100);
    sockA.emit('sync_ready', { ready: true });
    sockB.emit('sync_ready', { ready: true });

    const qPhase = await waitFor(
      () => eventsA.find((e) => (e as { phase?: string }).phase === 'question') as
        | { phase: string; question: { questionId: string; optionIds: string[] }; round: number }
        | undefined,
      8000,
    );
    expect(qPhase?.question.questionId).toBe('q0');
    assertNoAnswerLeak(qPhase);

    const qPhaseB = eventsB.find((e) => (e as { phase?: string }).phase === 'question') as
      | { question: { optionIds: string[]; displayCells: unknown } }
      | undefined;
    expect(qPhaseB?.question.optionIds).toEqual(qPhase.question.optionIds);
    expect((qPhaseB?.question as { displayCells?: unknown }).displayCells).toEqual(
      (qPhase.question as { displayCells?: unknown }).displayCells,
    );

    // Opponent update must not include selected option
    sockA.emit('sync_answer', {
      ...versions(),
      questionId: 'q0',
      selectedOptionId: qPhase.question.optionIds[0],
    });
    await sleep(80);
    const updates = eventsB.filter((e) => Array.isArray((e as { players?: unknown }).players));
    const blob = JSON.stringify(updates);
    expect(blob).not.toContain('selectedOptionId');
    expect(blob).not.toContain('answerId');

    // Reaction cooldown
    const errs: string[] = [];
    sockA.on('sync_error', (p: { error: string }) => errs.push(p.error));
    sockA.emit('sync_reaction', { kind: '👍' });
    sockA.emit('sync_reaction', { kind: '👍' });
    await sleep(50);
    expect(errs).toContain('reaction_cooldown');

    // Reconnect before question ends
    sockA.close();
    const ticketA2 = await app.inject({
      method: 'GET',
      url: '/api/v1/ws-ticket',
      headers: { origin: ORIGIN, cookie: `suite_sid=${a.cookie}` },
    });
    const sockA2 = await connect(baseUrl, ticketA2.json().ticket, ORIGIN);
    const recon = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('reconnect timeout')), 5000);
      sockA2.on('sync_reconnected', (p) => {
        clearTimeout(t);
        resolve(p as Record<string, unknown>);
      });
      sockA2.emit('sync_join_match', { matchId });
    });
    expect(['question', 'between', 'countdown', 'lobby', 'finished']).toContain(recon.phase);
    assertNoAnswerLeak(recon);

    sockA2.close();
    sockB.close();
  }, 30_000);
});

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitFor<T>(fn: () => T | undefined, timeoutMs: number): Promise<T> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const v = fn();
    if (v !== undefined) return v;
    await sleep(40);
  }
  throw new Error('waitFor timeout');
}

function connect(baseUrl: string, ticket: string, origin: string): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = ioClient(baseUrl, {
      path: '/socket.io',
      auth: { ticket },
      transports: ['websocket'],
      extraHeaders: { origin },
    });
    const t = setTimeout(() => {
      socket.close();
      reject(new Error('connect timeout'));
    }, 8000);
    socket.on('hello', () => {
      clearTimeout(t);
      resolve(socket);
    });
    socket.on('connect_error', (err) => {
      clearTimeout(t);
      reject(err);
    });
  });
}
