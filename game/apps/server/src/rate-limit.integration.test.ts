import { describe, expect, it } from 'vitest';
import { loadConfig } from './config.js';
import { migrate } from './db/migrate.js';
import { createIntegrationDb } from './db/test-db.js';
import { buildApp } from './app.js';
import { createLogger } from './security/crypto.js';

describe('rate limit', () => {
  it('returns 429 after bursting guest creates', async () => {
    const config = loadConfig({
      NODE_ENV: 'test',
      HOST: '127.0.0.1',
      PORT: '8798',
      COOKIE_SECURE: 'false',
      ORIGIN_ALLOWLIST: 'http://127.0.0.1:5180',
      SESSION_SECRET: 'test-session-secret-32chars-min!!',
      DATABASE_URL: 'postgres://unused',
      RATE_LIMIT_MAX: '5',
      RATE_LIMIT_WINDOW_MS: '60000',
      BODY_LIMIT_BYTES: '8192',
    });
    const { db } = await createIntegrationDb(config.databaseUrl);
    await migrate(db);
    const { app } = await buildApp({ config, db, log: createLogger('error') });
    await app.ready();

    let saw429 = false;
    for (let i = 0; i < 30; i += 1) {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/session/guest',
        headers: {
          origin: 'http://127.0.0.1:5180',
          'content-type': 'application/json',
        },
        payload: {},
      });
      if (res.statusCode === 429) {
        saw429 = true;
        break;
      }
    }
    expect(saw429).toBe(true);
    await app.close();
    await db.end();
  });
});
