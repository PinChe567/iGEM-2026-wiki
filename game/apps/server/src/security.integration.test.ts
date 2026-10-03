import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadConfig } from './config.js';
import { migrate } from './db/migrate.js';
import { createIntegrationDb, type Queryable } from './db/test-db.js';
import { buildApp } from './app.js';
import { createLogger, hashToken } from './security/crypto.js';
import { io as ioClient } from 'socket.io-client';

const ORIGIN = 'http://127.0.0.1:5180';

function parseSetCookie(header: string | string[] | undefined): string | null {
  if (!header) return null;
  const raw = Array.isArray(header) ? header[0] : header;
  const m = raw.match(/suite_sid=([^;]+)/);
  return m ? m[1]! : null;
}

describe('online server integration', () => {
  const config = loadConfig({
    ...process.env,
    NODE_ENV: 'test',
    HOST: '127.0.0.1',
    PORT: '8799',
    COOKIE_SECURE: 'false',
    ORIGIN_ALLOWLIST: ORIGIN,
    SESSION_SECRET: 'test-session-secret-32chars-min!!',
    DATABASE_URL:
      process.env.DATABASE_URL ??
      'postgres://suite:suite_dev_only@127.0.0.1:5433/suite_online',
    RATE_LIMIT_MAX: '200',
    BODY_LIMIT_BYTES: '2048',
  });

  let db: Queryable;
  let mode: 'postgres' | 'pglite';
  let app: Awaited<ReturnType<typeof buildApp>>['app'];
  let attachSocket: Awaited<ReturnType<typeof buildApp>>['attachSocket'];
  let baseUrl: string;

  beforeAll(async () => {
    const created = await createIntegrationDb(config.databaseUrl);
    db = created.db;
    mode = created.mode;

    const applied1 = await migrate(db);
    const applied2 = await migrate(db);
    expect(applied2).toEqual([]);
    if (mode === 'pglite') {
      expect(applied1.length).toBeGreaterThan(0);
    }

    const built = await buildApp({
      config,
      db,
      log: createLogger('error'),
    });
    app = built.app;
    attachSocket = built.attachSocket;
    await app.listen({ host: config.host, port: config.port });
    attachSocket(app.server);
    baseUrl = `http://${config.host}:${config.port}`;
  });

  afterAll(async () => {
    if (app) await app.close();
    if (db) await db.end();
  });

  it('reports database mode', () => {
    expect(['postgres', 'pglite']).toContain(mode);
  });

  it('health is public', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json().ok).toBe(true);
  });

  it('rejects unauthenticated /session/me', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/session/me' });
    expect(res.statusCode).toBe(401);
  });

  it('creates guest, me, profile, daily, leaderboard; enforces csrf and origin', async () => {
    const guest = await app.inject({
      method: 'POST',
      url: '/api/v1/session/guest',
      headers: { origin: ORIGIN, 'content-type': 'application/json' },
      payload: { nickname: 'Explorer One' },
    });
    expect(guest.statusCode).toBe(200);
    const body = guest.json();
    expect(body.publicId).toMatch(/^u_/);
    expect(body.csrfToken).toBeTruthy();
    expect(body.guestDisclaimer).toMatch(/will not restore/i);
    const cookie = parseSetCookie(guest.headers['set-cookie']);
    expect(cookie).toBeTruthy();

    const me = await app.inject({
      method: 'GET',
      url: '/api/v1/session/me',
      headers: { cookie: `suite_sid=${cookie}`, origin: ORIGIN },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json().nickname).toBe('Explorer One');

    const noCsrf = await app.inject({
      method: 'PATCH',
      url: '/api/v1/profile',
      headers: {
        cookie: `suite_sid=${cookie}`,
        origin: ORIGIN,
        'content-type': 'application/json',
      },
      payload: { nickname: 'Explorer Two' },
    });
    expect(noCsrf.statusCode).toBe(403);

    const patched = await app.inject({
      method: 'PATCH',
      url: '/api/v1/profile',
      headers: {
        cookie: `suite_sid=${cookie}`,
        origin: ORIGIN,
        'content-type': 'application/json',
        'x-csrf-token': body.csrfToken,
      },
      payload: { nickname: 'Explorer Two' },
    });
    expect(patched.statusCode).toBe(200);
    expect(patched.json().nickname).toBe('Explorer Two');

    const spoof = await app.inject({
      method: 'PATCH',
      url: '/api/v1/profile',
      headers: {
        cookie: `suite_sid=${cookie}`,
        origin: ORIGIN,
        'content-type': 'application/json',
        'x-csrf-token': body.csrfToken,
      },
      payload: { nickname: 'Ok', role: 'admin', score: 999 },
    });
    expect(spoof.statusCode).toBe(400);

    const badOrigin = await app.inject({
      method: 'POST',
      url: '/api/v1/session/guest',
      headers: { origin: 'https://evil.example', 'content-type': 'application/json' },
      payload: {},
    });
    expect(badOrigin.statusCode).toBe(403);

    const tampered = await app.inject({
      method: 'GET',
      url: '/api/v1/session/me',
      headers: { cookie: 'suite_sid=not-a-real-token', origin: ORIGIN },
    });
    expect(tampered.statusCode).toBe(401);

    const daily = await app.inject({
      method: 'GET',
      url: '/api/v1/daily/spectrum',
      headers: { origin: ORIGIN },
    });
    expect(daily.statusCode).toBe(200);
    const dailyBody = daily.json();
    expect(dailyBody.challengeId).toBeTruthy();
    expect(dailyBody.server_truth).toBeUndefined();
    expect(JSON.stringify(dailyBody)).not.toContain('server-only');

    const board = await app.inject({
      method: 'GET',
      url: `/api/v1/leaderboards/${dailyBody.challengeId}`,
      headers: { origin: ORIGIN },
    });
    expect(board.statusCode).toBe(200);
    expect(board.json().entries).toEqual([]);

    const scores = await app.inject({
      method: 'POST',
      url: '/api/v1/scores',
      headers: {
        cookie: `suite_sid=${cookie}`,
        origin: ORIGIN,
        'content-type': 'application/json',
        'x-csrf-token': body.csrfToken,
      },
      payload: { score: 100 },
    });
    expect(scores.statusCode).toBe(501);

    const profile = await app.inject({
      method: 'GET',
      url: `/api/v1/profiles/${body.publicId}`,
      headers: { origin: ORIGIN },
    });
    expect(profile.statusCode).toBe(200);
    expect(profile.json().nickname).toBe('Explorer Two');
  });

  it('rejects oversized payload', async () => {
    const huge = 'x'.repeat(config.bodyLimitBytes + 100);
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/session/guest',
      headers: { origin: ORIGIN, 'content-type': 'application/json' },
      payload: { nickname: huge },
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('expires session when idle_expires_at is past', async () => {
    const guest = await app.inject({
      method: 'POST',
      url: '/api/v1/session/guest',
      headers: { origin: ORIGIN, 'content-type': 'application/json' },
      payload: { nickname: 'Idle User' },
    });
    const cookie = parseSetCookie(guest.headers['set-cookie'])!;
    const tokenHash = hashToken(cookie, config.sessionSecret);
    await db.query(
      `UPDATE sessions SET idle_expires_at = now() - interval '1 minute' WHERE token_hash = $1`,
      [tokenHash],
    );
    const me = await app.inject({
      method: 'GET',
      url: '/api/v1/session/me',
      headers: { cookie: `suite_sid=${cookie}`, origin: ORIGIN },
    });
    expect(me.statusCode).toBe(401);
  });

  it('websocket requires ticket and rejects bad version', async () => {
    const guest = await app.inject({
      method: 'POST',
      url: '/api/v1/session/guest',
      headers: { origin: ORIGIN, 'content-type': 'application/json' },
      payload: { nickname: 'Wire User' },
    });
    const cookie = parseSetCookie(guest.headers['set-cookie'])!;
    const ticketRes = await app.inject({
      method: 'GET',
      url: '/api/v1/ws-ticket',
      headers: { cookie: `suite_sid=${cookie}`, origin: ORIGIN },
    });
    expect(ticketRes.statusCode).toBe(200);
    const ticket = ticketRes.json().ticket as string;

    await new Promise<void>((resolve, reject) => {
      const socket = ioClient(baseUrl, {
        path: '/socket.io',
        auth: { ticket },
        transports: ['websocket'],
        extraHeaders: { origin: ORIGIN },
      });
      const timer = setTimeout(() => {
        socket.close();
        reject(new Error('ws timeout'));
      }, 10_000);
      socket.on('connect', () => {
        socket.emit('game_event', {
          protocolVersion: '0.0.0',
          gameVersion: '1.0.0',
          contentVersion: '1.0.0',
          gameKey: 'spectrum',
          type: 'noop',
        });
      });
      socket.on('error_event', (payload: { error: string }) => {
        clearTimeout(timer);
        expect(payload.error).toBe('version_mismatch');
        socket.close();
        resolve();
      });
      socket.on('connect_error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });

    await new Promise<void>((resolve, reject) => {
      const socket = ioClient(baseUrl, {
        path: '/socket.io',
        auth: { ticket: 'bogus' },
        transports: ['websocket'],
        extraHeaders: { origin: ORIGIN },
      });
      socket.on('connect', () => {
        socket.close();
        reject(new Error('should not connect'));
      });
      socket.on('connect_error', () => {
        socket.close();
        resolve();
      });
    });
  });
});
