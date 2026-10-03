import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from './config.js';
import { createPool } from './db/pool.js';
import { migrate } from './db/migrate.js';
import { buildApp } from './app.js';
import { createLogger } from './security/crypto.js';

const here = path.dirname(fileURLToPath(import.meta.url));

/** Load apps/server/.env if present (never commit secrets). */
function loadDotEnv(): void {
  const envPath = path.resolve(here, '../.env');
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

async function main() {
  loadDotEnv();
  const config = loadConfig();
  const log = createLogger(config.logLevel);
  const db = createPool(config);

  await migrate(db);
  log.info('database ready');

  const { app, attachSocket } = await buildApp({ config, db, log });
  await app.listen({ host: config.host, port: config.port });
  attachSocket(app.server);
  log.info('server listening', { host: config.host, port: config.port });
}

main().catch((err) => {
  console.error(JSON.stringify({ lvl: 'error', msg: 'fatal', data: String(err) }));
  process.exit(1);
});
