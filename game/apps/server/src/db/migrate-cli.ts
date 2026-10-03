import pg from 'pg';
import { loadConfig } from '../config.js';
import { createLogger } from '../security/crypto.js';
import { migrate } from './migrate.js';

async function main() {
  const config = loadConfig();
  const log = createLogger(config.logLevel);
  const pool = new pg.Pool({ connectionString: config.databaseUrl });
  try {
    const applied = await migrate(pool);
    log.info('migrations complete', { applied });
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
