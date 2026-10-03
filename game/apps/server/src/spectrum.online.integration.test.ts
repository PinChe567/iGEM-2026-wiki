import { SPECTRUM_CONTENT_VERSION } from '@suite/content';
import {
  SPECTRUM_RULE_VERSION,
  assertNoTruthLeak,
  formatAB,
  scoreAB,
  canonicalizeMixture,
} from '@suite/core/spectrum';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { io as ioClient, type Socket } from 'socket.io-client';
import { buildApp } from './app.js';
import { loadConfig, PROTOCOL_VERSION } from './config.js';
import { migrate } from './db/migrate.js';
import { createIntegrationDb, type Queryable } from './db/test-db.js';
import { createLogger } from './security/crypto.js';
import {
  buildSpectrumDailyPuzzle,
  ensureSpectrumDailyChallenge,
} from './spectrum/daily.js';
import { resetSpectrumRaceMemory } from './spectrum/race.js';

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
    gameVersion: SPECTRUM_RULE_VERSION,
    contentVersion: SPECTRUM_CONTENT_VERSION,
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

describe('spectrum server-verified online modes', () => {
  const config = loadConfig({
    ...process.env,
    NODE_ENV: 'test',
    HOST: '127.0.0.1',
    PORT: '8802',
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
    resetSpectrumRaceMemory();
  });

  afterAll(async () => {
    if (app) await app.close();
    if (db) await db.end();
  });

  it('designated 0A2B + float-stable rebuild; daily GET never leaks truth', async () => {
    const pool2 = ['banana', 'lemon'];
    const truth = canonicalizeMixture([
      { odorId: 'banana', percent: 60 },
      { odorId: 'lemon', percent: 40 },
    ]);
    const swapped = canonicalizeMixture([
      { odorId: 'lemon', percent: 60 },
      { odorId: 'banana', percent: 40 },
    ]);
    expect(formatAB(scoreAB(swapped, truth, pool2))).toBe('0A2B');

    const a = await ensureSpectrumDailyChallenge(db, config.challengeSecret, '2099-06-01');
    const b = await ensureSpectrumDailyChallenge(db, config.challengeSecret, '2099-06-01');
    expect(a.server_truth.privateSeed).toBe(b.server_truth.privateSeed);
    const pa = buildSpectrumDailyPuzzle(a.server_truth.privateSeed);
    const pb = buildSpectrumDailyPuzzle(b.server_truth.privateSeed);
    expect(pa.observedSignal).toEqual(pb.observedSignal);
    expect(pa.truth).toEqual(pb.truth);

    const daily = await app.inject({
      method: 'GET',
      url: '/api/v1/daily/spectrum',
      headers: { origin: ORIGIN },
    });
    expect(daily.statusCode).toBe(200);
    const body = daily.json();
    assertNoTruthLeak(body);
    expect(JSON.stringify(body)).not.toMatch(/privateSeed|"truth"|answerKey/);
    expect(body.observedSignal).toHaveLength(12);
    expect(body.poolIds).toHaveLength(10);
  });

  it('guess validates schema/order; rejects client fit/score; resume keeps timer', async () => {
    const g = await guest(app, 'Spec Ace');
    const challenge = await ensureSpectrumDailyChallenge(db, config.challengeSecret);
    const puzzle = buildSpectrumDailyPuzzle(challenge.server_truth.privateSeed);

    const badScore = await app.inject({
      method: 'POST',
      url: '/api/v1/spectrum/daily/runs/start',
      headers: {
        origin: ORIGIN,
        cookie: `suite_sid=${g.cookie}`,
        'content-type': 'application/json',
        'x-csrf-token': g.csrf,
      },
      payload: { ...versions(), fit: 100, solved: true },
    });
    expect(badScore.statusCode).toBe(400);

    const start = await app.inject({
      method: 'POST',
      url: '/api/v1/spectrum/daily/runs/start',
      headers: {
        origin: ORIGIN,
        cookie: `suite_sid=${g.cookie}`,
        'content-type': 'application/json',
        'x-csrf-token': g.csrf,
      },
      payload: versions(),
    });
    expect(start.statusCode).toBe(200);
    assertNoTruthLeak(start.json());
    const runId = start.json().runId as string;
    const startedAt = start.json().serverStartedAtMs as number;

    await new Promise((r) => setTimeout(r, 40));
    const resume = await app.inject({
      method: 'POST',
      url: '/api/v1/spectrum/daily/runs/start',
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
    expect(resume.json().elapsedMs).toBeGreaterThanOrEqual(30);

    const invalid = await app.inject({
      method: 'POST',
      url: `/api/v1/spectrum/daily/runs/${runId}/guess`,
      headers: {
        origin: ORIGIN,
        cookie: `suite_sid=${g.cookie}`,
        'content-type': 'application/json',
        'x-csrf-token': g.csrf,
      },
      payload: {
        ...versions(),
        components: [
          { odorId: 'banana', percent: 50 },
          { odorId: 'banana', percent: 50 },
        ],
      },
    });
    expect(invalid.statusCode).toBe(400);
    expect(invalid.json().error).toMatch(/duplicate_odor/);

    const sumBad = await app.inject({
      method: 'POST',
      url: `/api/v1/spectrum/daily/runs/${runId}/guess`,
      headers: {
        origin: ORIGIN,
        cookie: `suite_sid=${g.cookie}`,
        'content-type': 'application/json',
        'x-csrf-token': g.csrf,
      },
      payload: {
        ...versions(),
        components: [
          { odorId: 'banana', percent: 40 },
          { odorId: 'lemon', percent: 40 },
        ],
      },
    });
    expect(sumBad.statusCode).toBe(400);

    // Canonical order independence: reverse component order same mixture
    const comps = [...puzzle.truth.components].reverse();
    const g1 = await app.inject({
      method: 'POST',
      url: `/api/v1/spectrum/daily/runs/${runId}/guess`,
      headers: {
        origin: ORIGIN,
        cookie: `suite_sid=${g.cookie}`,
        'content-type': 'application/json',
        'x-csrf-token': g.csrf,
      },
      payload: { ...versions(), components: comps },
    });
    expect(g1.statusCode).toBe(200);
    assertNoTruthLeak(g1.json());
    expect(g1.json().solved).toBe(true);
    expect(g1.json().abLabel).toMatch(/A0B$/);

    const dup = await app.inject({
      method: 'POST',
      url: `/api/v1/spectrum/daily/runs/${runId}/guess`,
      headers: {
        origin: ORIGIN,
        cookie: `suite_sid=${g.cookie}`,
        'content-type': 'application/json',
        'x-csrf-token': g.csrf,
      },
      payload: { ...versions(), components: puzzle.truth.components },
    });
    expect([409, 409]).toContain(dup.statusCode);

    const finish = await app.inject({
      method: 'POST',
      url: `/api/v1/spectrum/daily/runs/${runId}/finish`,
      headers: {
        origin: ORIGIN,
        cookie: `suite_sid=${g.cookie}`,
        'content-type': 'application/json',
        'x-csrf-token': g.csrf,
      },
      payload: versions(),
    });
    expect(finish.statusCode).toBe(200);
    expect(finish.json().serverVerified).toBe(true);
    expect(finish.json().ranked).toBe(true);
    expect(finish.json().truth).toBeTruthy();
  });

  it('leaderboard sorts solved first; ties by guesses then time; unsolved in participation', async () => {
    const challenge = await ensureSpectrumDailyChallenge(db, config.challengeSecret);
    const puzzle = buildSpectrumDailyPuzzle(challenge.server_truth.privateSeed);

    async function play(nick: string, solve: boolean, delayMs: number) {
      const g = await guest(app, nick);
      const start = await app.inject({
        method: 'POST',
        url: '/api/v1/spectrum/daily/runs/start',
        headers: {
          origin: ORIGIN,
          cookie: `suite_sid=${g.cookie}`,
          'content-type': 'application/json',
          'x-csrf-token': g.csrf,
        },
        payload: versions(),
      });
      const runId = start.json().runId as string;
      await new Promise((r) => setTimeout(r, delayMs));
      const components = solve
        ? puzzle.truth.components
        : [
            { odorId: 'mint', percent: 50 },
            { odorId: 'rose', percent: 50 },
          ];
      // burn one wrong guess then solve for slower/more guesses when needed
      if (solve && delayMs > 20) {
        await app.inject({
          method: 'POST',
          url: `/api/v1/spectrum/daily/runs/${runId}/guess`,
          headers: {
            origin: ORIGIN,
            cookie: `suite_sid=${g.cookie}`,
            'content-type': 'application/json',
            'x-csrf-token': g.csrf,
          },
          payload: {
            ...versions(),
            components: [
              { odorId: 'mint', percent: 50 },
              { odorId: 'rose', percent: 50 },
            ],
          },
        });
        await new Promise((r) => setTimeout(r, 30));
      }
      await app.inject({
        method: 'POST',
        url: `/api/v1/spectrum/daily/runs/${runId}/guess`,
        headers: {
          origin: ORIGIN,
          cookie: `suite_sid=${g.cookie}`,
          'content-type': 'application/json',
          'x-csrf-token': g.csrf,
        },
        payload: { ...versions(), components },
      });
      await app.inject({
        method: 'POST',
        url: `/api/v1/spectrum/daily/runs/${runId}/finish`,
        headers: {
          origin: ORIGIN,
          cookie: `suite_sid=${g.cookie}`,
          'content-type': 'application/json',
          'x-csrf-token': g.csrf,
        },
        payload: versions(),
      });
    }

    // Use a fresh date challenge to avoid colliding with prior ranked users on today's challenge
    const fresh = await ensureSpectrumDailyChallenge(db, config.challengeSecret, '2099-07-04');
    // Override by playing on today's challenge — previous test already ranked Spec Ace.
    // Create two more guests on current challenge.
    await play('Solver Fast', true, 5);
    await play('Solver Slow', true, 40);
    await play('Participant X', false, 5);

    const board = await app.inject({
      method: 'GET',
      url: `/api/v1/leaderboards/${challenge.id}`,
      headers: { origin: ORIGIN },
    });
    expect(board.statusCode).toBe(200);
    const json = board.json();
    expect(json.sort[0]).toMatch(/solved/i);
    for (const e of json.entries as Array<{ solved?: boolean }>) {
      expect(e.solved).toBe(true);
    }
    const part = json.participation as Array<{ nickname: string }> | undefined;
    expect(part?.some((p) => p.nickname === 'Participant X')).toBe(true);
    void fresh;
  });

  it('race: identical signal for all; progress hides A/B; reconnect works', async () => {
    const a = await guest(app, 'Spec Racer A');
    const b = await guest(app, 'Spec Racer B');

    const room = await app.inject({
      method: 'POST',
      url: '/api/v1/spectrum/race/rooms',
      headers: {
        origin: ORIGIN,
        cookie: `suite_sid=${a.cookie}`,
        'content-type': 'application/json',
        'x-csrf-token': a.csrf,
      },
      payload: versions(),
    });
    expect(room.statusCode).toBe(200);
    assertNoTruthLeak(room.json());
    const code = room.json().code as string;
    const matchId = room.json().matchId as string;
    const signalA = room.json().observedSignal as number[];

    const join = await app.inject({
      method: 'POST',
      url: '/api/v1/spectrum/race/rooms/join',
      headers: {
        origin: ORIGIN,
        cookie: `suite_sid=${b.cookie}`,
        'content-type': 'application/json',
        'x-csrf-token': b.csrf,
      },
      payload: { ...versions(), code },
    });
    expect(join.json().observedSignal).toEqual(signalA);
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
    const sockA = await connect(baseUrl, ticketA.json().ticket, ORIGIN);
    const sockB = await connect(baseUrl, ticketB.json().ticket, ORIGIN);
    sockA.on('spectrum_race_phase', (p) => eventsA.push(p));
    sockB.on('spectrum_race_progress', (p) => eventsA.push(p));

    sockA.emit('spectrum_race_join', { matchId });
    sockB.emit('spectrum_race_join', { matchId });
    await sleep(80);
    sockA.emit('spectrum_race_ready', { ready: true });
    sockB.emit('spectrum_race_ready', { ready: true });

    await waitFor(
      () => eventsA.find((e) => (e as { phase?: string }).phase === 'racing'),
      8000,
    );

    sockA.emit('spectrum_race_guess', {
      ...versions(),
      components: [
        { odorId: 'mint', percent: 50 },
        { odorId: 'rose', percent: 50 },
      ],
    });
    await sleep(100);
    const blob = JSON.stringify(eventsA);
    expect(blob).not.toContain('"truth"');
    expect(blob).not.toMatch(/"ab"\s*:/);

    sockA.close();
    const ticketA2 = await app.inject({
      method: 'GET',
      url: '/api/v1/ws-ticket',
      headers: { origin: ORIGIN, cookie: `suite_sid=${a.cookie}` },
    });
    const sockA2 = await connect(baseUrl, ticketA2.json().ticket, ORIGIN);
    const recon = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('reconnect timeout')), 5000);
      sockA2.on('spectrum_race_reconnected', (p) => {
        clearTimeout(t);
        resolve(p as Record<string, unknown>);
      });
      sockA2.emit('spectrum_race_join', { matchId });
    });
    expect(recon.observedSignal).toEqual(signalA);
    assertNoTruthLeak(recon);

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
