import type { Pool, QueryResult, QueryResultRow } from 'pg';
import pg from 'pg';
import { PGlite } from '@electric-sql/pglite';

/** Minimal Pool-compatible surface used by migrate + routes. */
export type Queryable = {
  query: <T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ) => Promise<QueryResult<T>>;
  connect: () => Promise<PoolClientLike>;
  end: () => Promise<void>;
};

type PoolClientLike = {
  query: <T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ) => Promise<QueryResult<T>>;
  release: () => void;
};

function normalizeSql(text: string): string {
  return text.replace(/CREATE EXTENSION IF NOT EXISTS pgcrypto;\s*/gi, '');
}

function emptyResult<T extends QueryResultRow>(): QueryResult<T> {
  return {
    rows: [],
    rowCount: 0,
    command: '',
    oid: 0,
    fields: [],
  } as QueryResult<T>;
}

export function wrapPglite(db: PGlite): Queryable {
  const query = async <T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> => {
    const sql = normalizeSql(text).trim();
    const hasParams = Boolean(params && params.length > 0);
    // PGlite prepared statements reject multi-command scripts.
    const stripped = sql.replace(/;\s*$/, '');
    const multi = /;/.test(stripped);

    if (!hasParams && multi) {
      await db.exec(sql);
      return emptyResult<T>();
    }

    if (!hasParams && (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK')) {
      await db.exec(sql);
      return emptyResult<T>();
    }

    const result = await db.query<T>(sql, params ?? []);
    const rowCount = Math.max(result.affectedRows ?? 0, result.rows.length);
    return {
      rows: result.rows,
      rowCount,
      command: '',
      oid: 0,
      fields: [],
    } as QueryResult<T>;
  };

  return {
    query,
    connect: async () => ({
      query,
      release: () => undefined,
    }),
    end: async () => {
      await db.close();
    },
  };
}

export async function createIntegrationDb(
  databaseUrl: string,
): Promise<{ db: Queryable; mode: 'postgres' | 'pglite' }> {
  try {
    const pool = new pg.Pool({ connectionString: databaseUrl, connectionTimeoutMillis: 2000 });
    await pool.query('SELECT 1');
    return { db: pool as unknown as Queryable, mode: 'postgres' };
  } catch {
    const pglite = new PGlite();
    return { db: wrapPglite(pglite), mode: 'pglite' };
  }
}

export type { Pool };
