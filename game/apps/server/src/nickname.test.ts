import { describe, expect, it } from 'vitest';
import { normalizeNickname, defaultGuestNickname } from './nickname.js';
import { sanitizeForLog, hashToken, tokensEqual } from './security/crypto.js';
import { assertCompatibleVersions, SUPPORTED } from './versions.js';
import { GuestCreateBody, ProfilePatchBody } from './config.js';

describe('nickname', () => {
  it('normalizes NFC and strips controls', () => {
    const r = normalizeNickname('  Café\u0001  ');
    expect(r).toEqual({ ok: true, nickname: 'Café' });
  });

  it('rejects reserved system labels', () => {
    expect(normalizeNickname('Admin').ok).toBe(false);
    expect(normalizeNickname('[mod]').ok).toBe(false);
  });

  it('rejects empty / too long', () => {
    expect(normalizeNickname('a').ok).toBe(false);
    expect(normalizeNickname('x'.repeat(40)).ok).toBe(false);
  });

  it('default guest nickname is safe', () => {
    const n = defaultGuestNickname();
    expect(normalizeNickname(n).ok).toBe(true);
  });
});

describe('sanitizeForLog', () => {
  it('redacts cookies tokens and server_truth', () => {
    const out = sanitizeForLog({
      cookie: 'suite_sid=abc',
      ticket: 'secret',
      server_truth: { answer: 1 },
      route: '/health',
      ip: '1.2.3.4',
    }) as Record<string, unknown>;
    expect(out.cookie).toBe('[redacted]');
    expect(out.ticket).toBe('[redacted]');
    expect(out.server_truth).toBe('[redacted]');
    expect(out.ip).toBe('[truncated]');
    expect(out.route).toBe('/health');
  });
});

describe('crypto', () => {
  it('hashes deterministically and compares safely', () => {
    const a = hashToken('tok', 'secret');
    const b = hashToken('tok', 'secret');
    expect(tokensEqual(a, b)).toBe(true);
    expect(tokensEqual(a, hashToken('other', 'secret'))).toBe(false);
  });
});

describe('versions', () => {
  it('rejects mismatched protocol', () => {
    const r = assertCompatibleVersions(
      {
        protocolVersion: '0.0.1',
        gameVersion: SUPPORTED.games.spectrum.gameVersion,
        contentVersion: SUPPORTED.games.spectrum.contentVersion,
      },
      'spectrum',
    );
    expect(r.ok).toBe(false);
  });

  it('accepts matching spectrum versions', () => {
    const r = assertCompatibleVersions(
      {
        protocolVersion: SUPPORTED.protocolVersion,
        gameVersion: SUPPORTED.games.spectrum.gameVersion,
        contentVersion: SUPPORTED.games.spectrum.contentVersion,
      },
      'spectrum',
    );
    expect(r.ok).toBe(true);
  });
});

describe('body schemas reject privileged fields', () => {
  it('guest body is strict', () => {
    expect(GuestCreateBody.safeParse({ nickname: 'Ada', userId: 'x' }).success).toBe(false);
    expect(GuestCreateBody.safeParse({ score: 99 }).success).toBe(false);
    expect(GuestCreateBody.safeParse({ nickname: 'Ada' }).success).toBe(true);
  });

  it('profile patch is strict', () => {
    expect(ProfilePatchBody.safeParse({ nickname: 'Ada', role: 'admin' }).success).toBe(false);
    expect(ProfilePatchBody.safeParse({ nickname: 'Ada' }).success).toBe(true);
  });
});
