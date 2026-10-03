import { z } from 'zod';

function readEnv(source: NodeJS.ProcessEnv, name: string, fallback?: string): string {
  const v = source[name] ?? fallback;
  if (v === undefined || v === '') {
    throw new Error(`Missing required env: ${name}`);
  }
  return v;
}

const boolFromEnv = (source: NodeJS.ProcessEnv, name: string, fallback: boolean): boolean => {
  const raw = source[name];
  if (raw === undefined) return fallback;
  return raw === '1' || raw.toLowerCase() === 'true';
};

export const PROTOCOL_VERSION = '1.0.0';
export const ONLINE_API_VERSION = '1';

export type ServerConfig = {
  nodeEnv: string;
  host: string;
  port: number;
  databaseUrl: string;
  sessionSecret: string;
  /** HMAC key for UTC daily challenge private seeds (server-only). */
  challengeSecret: string;
  originAllowlist: string[];
  cookieSecure: boolean;
  cookieName: string;
  bodyLimitBytes: number;
  rateLimitMax: number;
  rateLimitWindowMs: number;
  sessionTtlMs: number;
  sessionIdleMs: number;
  wsTicketTtlMs: number;
  wsIdleTimeoutMs: number;
  logLevel: string;
};

export function loadConfig(envSource: NodeJS.ProcessEnv = process.env): ServerConfig {
  const secret = readEnv(envSource, 'SESSION_SECRET', 'dev-only-change-me-32chars-minimum!!');
  if (secret.length < 24) {
    throw new Error('SESSION_SECRET must be at least 24 characters');
  }
  const allow = readEnv(
    envSource,
    'ORIGIN_ALLOWLIST',
    'http://127.0.0.1:5180,http://localhost:5180',
  )
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const challengeSecret = readEnv(
    envSource,
    'CHALLENGE_SECRET',
    `${secret}:challenge-dev-only`,
  );
  if (challengeSecret.length < 24) {
    throw new Error('CHALLENGE_SECRET must be at least 24 characters');
  }

  return {
    nodeEnv: readEnv(envSource, 'NODE_ENV', 'development'),
    host: readEnv(envSource, 'HOST', '127.0.0.1'),
    port: Number(readEnv(envSource, 'PORT', '8787')),
    databaseUrl: readEnv(
      envSource,
      'DATABASE_URL',
      'postgres://suite:suite_dev_only@127.0.0.1:5433/suite_online',
    ),
    sessionSecret: secret,
    challengeSecret,
    originAllowlist: allow,
    cookieSecure: boolFromEnv(
      envSource,
      'COOKIE_SECURE',
      readEnv(envSource, 'NODE_ENV', 'development') === 'production',
    ),
    cookieName: readEnv(envSource, 'COOKIE_NAME', 'suite_sid'),
    bodyLimitBytes: Number(readEnv(envSource, 'BODY_LIMIT_BYTES', '32768')),
    rateLimitMax: Number(readEnv(envSource, 'RATE_LIMIT_MAX', '60')),
    rateLimitWindowMs: Number(readEnv(envSource, 'RATE_LIMIT_WINDOW_MS', '60000')),
    sessionTtlMs: Number(readEnv(envSource, 'SESSION_TTL_MS', String(30 * 24 * 60 * 60 * 1000))),
    sessionIdleMs: Number(readEnv(envSource, 'SESSION_IDLE_MS', String(7 * 24 * 60 * 60 * 1000))),
    wsTicketTtlMs: Number(readEnv(envSource, 'WS_TICKET_TTL_MS', '60000')),
    wsIdleTimeoutMs: Number(readEnv(envSource, 'WS_IDLE_TIMEOUT_MS', '45000')),
    logLevel: readEnv(envSource, 'LOG_LEVEL', 'info'),
  };
}

/** Reject client attempts to set privileged fields via unknown keys. */
export const GuestCreateBody = z
  .object({
    nickname: z.string().optional(),
  })
  .strict();

export const ProfilePatchBody = z
  .object({
    nickname: z.string().min(1).max(64),
  })
  .strict();
