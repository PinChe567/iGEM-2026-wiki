import pg from 'pg';
import type { ServerConfig } from '../config.js';
import type { Queryable } from './test-db.js';

export function createPool(config: ServerConfig): Db {
  return new pg.Pool({
    connectionString: config.databaseUrl,
    max: 10,
    idleTimeoutMillis: 30_000,
  }) as unknown as Db;
}

export type Db = Queryable;
