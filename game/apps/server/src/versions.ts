import { CONTENT_VERSION, SPECTRUM_CONTENT_VERSION } from '@suite/content';
import { PIXEL_GAME_VERSION } from '@suite/core/pixel';
import { SPECTRUM_RULE_VERSION } from '@suite/core/spectrum';
import { PROTOCOL_VERSION } from './config.js';

/** Supported wire / game / content versions for this server build. */
export const SUPPORTED = {
  protocolVersion: PROTOCOL_VERSION,
  games: {
    spectrum: {
      gameVersion: SPECTRUM_RULE_VERSION,
      contentVersion: SPECTRUM_CONTENT_VERSION,
    },
    pixel: {
      gameVersion: PIXEL_GAME_VERSION,
      contentVersion: CONTENT_VERSION,
    },
    labyrinth: {
      gameVersion: '1.0.0',
      contentVersion: '1.0.0',
    },
  },
} as const;

export type VersionEnvelope = {
  protocolVersion: string;
  gameVersion: string;
  contentVersion: string;
  challengeId?: string;
  matchId?: string;
};

export type VersionCheckResult =
  | { ok: true }
  | { ok: false; code: 'version_mismatch'; detail: string };

export function assertCompatibleVersions(
  envelope: VersionEnvelope,
  gameKey: keyof typeof SUPPORTED.games,
): VersionCheckResult {
  if (envelope.protocolVersion !== SUPPORTED.protocolVersion) {
    return {
      ok: false,
      code: 'version_mismatch',
      detail: `protocolVersion ${envelope.protocolVersion} !== ${SUPPORTED.protocolVersion}`,
    };
  }
  const expected = SUPPORTED.games[gameKey];
  if (envelope.gameVersion !== expected.gameVersion) {
    return {
      ok: false,
      code: 'version_mismatch',
      detail: `gameVersion ${envelope.gameVersion} !== ${expected.gameVersion}`,
    };
  }
  if (envelope.contentVersion !== expected.contentVersion) {
    return {
      ok: false,
      code: 'version_mismatch',
      detail: `contentVersion ${envelope.contentVersion} !== ${expected.contentVersion}`,
    };
  }
  return { ok: true };
}
