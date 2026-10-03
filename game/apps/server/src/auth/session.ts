import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Db } from '../db/pool.js';
import type { ServerConfig } from '../config.js';
import { hashToken, publicIdFromBytes, randomToken, tokensEqual } from '../security/crypto.js';
import { defaultGuestNickname, normalizeNickname } from '../nickname.js';

export type AuthUser = {
  id: string;
  publicId: string;
  nickname: string;
  isGuest: boolean;
};

export type AuthSession = {
  id: string;
  user: AuthUser;
  csrfToken: string;
};

declare module 'fastify' {
  interface FastifyRequest {
    auth?: AuthSession;
  }
}

export async function createGuestSession(
  db: Db,
  config: ServerConfig,
  nicknameRaw?: string,
): Promise<{ session: AuthSession; rawToken: string; csrfToken: string }> {
  const nick =
    nicknameRaw !== undefined
      ? normalizeNickname(nicknameRaw)
      : { ok: true as const, nickname: defaultGuestNickname() };
  if (!nick.ok) {
    const err = new Error(nick.code) as Error & { statusCode: number; code: string };
    err.statusCode = 400;
    err.code = nick.code;
    throw err;
  }

  const rawToken = randomToken(32);
  const csrfToken = randomToken(24);
  const tokenHash = hashToken(rawToken, config.sessionSecret);
  const csrfHash = hashToken(csrfToken, config.sessionSecret);
  const publicId = publicIdFromBytes();
  const now = Date.now();
  const expires = new Date(now + config.sessionTtlMs);
  const idle = new Date(now + config.sessionIdleMs);

  const userRes = await db.query<{ id: string }>(
    `INSERT INTO users (public_id, nickname, is_guest)
     VALUES ($1, $2, TRUE)
     RETURNING id`,
    [publicId, nick.nickname],
  );
  const userId = userRes.rows[0]!.id;

  const sessRes = await db.query<{ id: string }>(
    `INSERT INTO sessions (user_id, token_hash, csrf_hash, expires_at, idle_expires_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [userId, tokenHash, csrfHash, expires.toISOString(), idle.toISOString()],
  );

  return {
    rawToken,
    csrfToken,
    session: {
      id: sessRes.rows[0]!.id,
      csrfToken,
      user: {
        id: userId,
        publicId,
        nickname: nick.nickname,
        isGuest: true,
      },
    },
  };
}

export function setSessionCookie(
  reply: FastifyReply,
  config: ServerConfig,
  rawToken: string,
): void {
  reply.setCookie(config.cookieName, rawToken, {
    path: '/',
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'lax',
    maxAge: Math.floor(config.sessionTtlMs / 1000),
  });
}

export function clearSessionCookie(reply: FastifyReply, config: ServerConfig): void {
  reply.clearCookie(config.cookieName, { path: '/' });
}

export async function loadSessionFromRequest(
  db: Db,
  config: ServerConfig,
  request: FastifyRequest,
): Promise<AuthSession | null> {
  const raw = request.cookies[config.cookieName];
  if (!raw) return null;
  const tokenHash = hashToken(raw, config.sessionSecret);

  const res = await db.query<{
    session_id: string;
    csrf_hash: string;
    expires_at: Date;
    idle_expires_at: Date;
    user_id: string;
    public_id: string;
    nickname: string;
    is_guest: boolean;
  }>(
    `SELECT s.id AS session_id, s.csrf_hash, s.expires_at, s.idle_expires_at,
            u.id AS user_id, u.public_id, u.nickname, u.is_guest
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1`,
    [tokenHash],
  );
  const row = res.rows[0];
  if (!row) return null;

  const now = Date.now();
  if (new Date(row.expires_at).getTime() < now || new Date(row.idle_expires_at).getTime() < now) {
    await db.query('DELETE FROM sessions WHERE id = $1', [row.session_id]);
    return null;
  }

  // Sliding idle window
  const newIdle = new Date(now + config.sessionIdleMs);
  await db.query(
    `UPDATE sessions SET last_seen_at = now(), idle_expires_at = $2 WHERE id = $1`,
    [row.session_id, newIdle.toISOString()],
  );

  // CSRF raw token is only known to client; we store hash. Client sends raw in header.
  return {
    id: row.session_id,
    csrfToken: '', // filled by verifyCsrf from header match against hash
    user: {
      id: row.user_id,
      publicId: row.public_id,
      nickname: row.nickname,
      isGuest: row.is_guest,
    },
  };
}

export async function verifyCsrf(
  db: Db,
  config: ServerConfig,
  sessionId: string,
  csrfHeader: string | undefined,
): Promise<boolean> {
  if (!csrfHeader) return false;
  const res = await db.query<{ csrf_hash: string }>(
    'SELECT csrf_hash FROM sessions WHERE id = $1',
    [sessionId],
  );
  const row = res.rows[0];
  if (!row) return false;
  const presented = hashToken(csrfHeader, config.sessionSecret);
  return tokensEqual(presented, row.csrf_hash);
}

export async function destroySession(db: Db, sessionId: string): Promise<void> {
  await db.query('DELETE FROM sessions WHERE id = $1', [sessionId]);
}

export async function issueWsTicket(
  db: Db,
  config: ServerConfig,
  userId: string,
): Promise<string> {
  const ticket = randomToken(24);
  const ticketHash = hashToken(ticket, config.sessionSecret);
  const expires = new Date(Date.now() + config.wsTicketTtlMs);
  await db.query(
    `INSERT INTO ws_tickets (ticket_hash, user_id, expires_at) VALUES ($1, $2, $3)`,
    [ticketHash, userId, expires.toISOString()],
  );
  return ticket;
}

export async function consumeWsTicket(
  db: Db,
  config: ServerConfig,
  ticket: string,
): Promise<string | null> {
  const ticketHash = hashToken(ticket, config.sessionSecret);
  const res = await db.query<{ user_id: string; expires_at: Date; used_at: Date | null }>(
    `SELECT user_id, expires_at, used_at FROM ws_tickets WHERE ticket_hash = $1`,
    [ticketHash],
  );
  const row = res.rows[0];
  if (!row || row.used_at || new Date(row.expires_at).getTime() < Date.now()) {
    return null;
  }
  await db.query(`UPDATE ws_tickets SET used_at = now() WHERE ticket_hash = $1`, [ticketHash]);
  return row.user_id;
}
