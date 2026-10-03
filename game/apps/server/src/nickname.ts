/**
 * Nickname normalization for guest-first Online companion.
 * No free chat in v1 — nicknames are display-only.
 */

const SYSTEM_LABELS = new Set(
  [
    'admin',
    'administrator',
    'mod',
    'moderator',
    'system',
    'official',
    'support',
    'staff',
    'null',
    'undefined',
    'suite',
    'igem',
    'server',
  ].map((s) => s.toLowerCase()),
);

export type NicknameResult =
  | { ok: true; nickname: string }
  | { ok: false; code: 'empty' | 'too_long' | 'invalid' | 'reserved' };

const MAX_LEN = 24;
const MIN_LEN = 2;

export function normalizeNickname(raw: string): NicknameResult {
  if (typeof raw !== 'string') return { ok: false, code: 'invalid' };

  // Unicode NFC
  let s = raw.normalize('NFC');
  // Strip controls + bidi overrides + zero-widths
  s = s.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, '');
  // Collapse whitespace
  s = s.replace(/\s+/g, ' ').trim();

  if (s.length < MIN_LEN) return { ok: false, code: 'empty' };
  if (s.length > MAX_LEN) return { ok: false, code: 'too_long' };

  // Disallow spoofing with @/# prefixes that look like system tags
  if (/^[@#/\\]/.test(s)) return { ok: false, code: 'invalid' };

  const compact = s.replace(/\s+/g, '').toLowerCase();
  if (SYSTEM_LABELS.has(compact) || SYSTEM_LABELS.has(s.toLowerCase())) {
    return { ok: false, code: 'reserved' };
  }
  // Ban "[system]" style wrappers
  if (/^\s*\[.*(admin|mod|system|official).*\]\s*$/i.test(s)) {
    return { ok: false, code: 'reserved' };
  }

  return { ok: true, nickname: s };
}

export function defaultGuestNickname(): string {
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `Guest ${n}`;
}
