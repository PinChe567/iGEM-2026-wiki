/**
 * Local E2E server: prefers DATABASE_URL Postgres, falls back to in-process PGlite.
 */
import { loadConfig } from './config.js';
import { migrate } from './db/migrate.js';
import { buildApp } from './app.js';
import { createLogger } from './security/crypto.js';
import { createIntegrationDb } from './db/test-db.js';

async function main() {
  const config = loadConfig({
    ...process.env,
    HOST: process.env.HOST ?? '127.0.0.1',
    PORT: process.env.PORT ?? '8787',
    COOKIE_SECURE: process.env.COOKIE_SECURE ?? 'false',
    ORIGIN_ALLOWLIST:
      process.env.ORIGIN_ALLOWLIST ?? 'http://127.0.0.1:5180,http://localhost:5180',
    SESSION_SECRET: process.env.SESSION_SECRET ?? 'e2e-session-secret-32chars-min!!!',
    CHALLENGE_SECRET: process.env.CHALLENGE_SECRET ?? 'e2e-challenge-secret-32chars-min!',
  });
  const log = createLogger('info');
  const created = await createIntegrationDb(config.databaseUrl);
  const db = created.db;
  log.info('e2e database ready', { mode: created.mode });

  await migrate(db);
  const { app, attachSocket } = await buildApp({ config, db, log });
  await app.listen({ host: config.host, port: config.port });
  attachSocket(app.server);
  log.info('e2e server listening', { host: config.host, port: config.port });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
