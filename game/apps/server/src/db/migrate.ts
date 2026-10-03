import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Queryable } from './test-db.js';

const here = path.dirname(fileURLToPath(import.meta.url));
export const MIGRATIONS_DIR = path.resolve(here, '../../migrations');

export async function migrate(pool: Queryable): Promise<string[]> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const applied: string[] = [];
  for (const file of files) {
    const id = file;
    const exists = await pool.query('SELECT 1 FROM schema_migrations WHERE id = $1', [id]);
    if (exists.rowCount && exists.rowCount > 0) continue;

    let sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    // Allow PGlite / lean runtimes without pgcrypto extension packaging.
    sql = sql.replace(/CREATE EXTENSION IF NOT EXISTS pgcrypto;\s*/gi, '');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [id]);
      await client.query('COMMIT');
      applied.push(id);
    } catch (err) {
      try {
        await client.query('ROLLBACK');
      } catch {
        /* ignore */
      }
      throw err;
    } finally {
      client.release();
    }
  }
  return applied;
}
