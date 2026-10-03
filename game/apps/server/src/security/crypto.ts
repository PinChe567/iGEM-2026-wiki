import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export function hashToken(token: string, secret: string): string {
  return createHash('sha256').update(`${secret}:${token}`).digest('hex');
}

export function tokensEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export function publicIdFromBytes(): string {
  return `u_${randomBytes(9).toString('base64url')}`;
}

/** Redact secrets from log-facing objects. */
export function sanitizeForLog(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    if (value.length > 120) return `${value.slice(0, 24)}…[redacted]`;
    return value;
  }
  if (Array.isArray(value)) return value.map(sanitizeForLog);
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const key = k.toLowerCase();
      if (
        key.includes('cookie') ||
        key.includes('token') ||
        key.includes('secret') ||
        key.includes('authorization') ||
        key.includes('server_truth') ||
        key === 'sid' ||
        key === 'ticket'
      ) {
        out[k] = '[redacted]';
      } else if (key === 'ip' || key === 'remoteaddress') {
        out[k] = '[truncated]';
      } else {
        out[k] = sanitizeForLog(v);
      }
    }
    return out;
  }
  return value;
}

export function createLogger(level: string) {
  const order = ['error', 'warn', 'info', 'debug'] as const;
  const min = order.indexOf(level as (typeof order)[number]);
  const threshold = min === -1 ? 2 : min;
  const emit = (lvl: (typeof order)[number], msg: string, extra?: unknown) => {
    if (order.indexOf(lvl) > threshold) return;
    const line = {
      lvl,
      msg,
      ...(extra !== undefined ? { data: sanitizeForLog(extra) } : {}),
      t: new Date().toISOString(),
    };
    // eslint-disable-next-line no-console
    console[lvl === 'debug' ? 'log' : lvl](JSON.stringify(line));
  };
  return {
    error: (msg: string, extra?: unknown) => emit('error', msg, extra),
    warn: (msg: string, extra?: unknown) => emit('warn', msg, extra),
    info: (msg: string, extra?: unknown) => emit('info', msg, extra),
    debug: (msg: string, extra?: unknown) => emit('debug', msg, extra),
  };
}
