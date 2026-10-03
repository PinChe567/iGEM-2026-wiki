import { ADVENTURE_ODOR_VECTORS, SCAN_REVEAL_RANGE } from './constants';
import { canUnlockScanWall, canRevealDecayBarrier, hasModule } from './progression';
import { emptyFeedback } from './combat';
import type { AdventureSession, Vec2 } from './types';

export type ScentMarker = {
  id: string;
  tile: Vec2;
  odorId?: string;
  /** Illustrative virtual-receptor pattern; never experimental AeroSense data. */
  vector?: readonly number[];
  intensity: number;
  falseSignal: boolean;
  classified: boolean;
};

export function illustrativeOdorVector(odorId: string): readonly number[] | undefined {
  return ADVENTURE_ODOR_VECTORS[odorId];
}

export function canDetectOdors(session: AdventureSession): boolean {
  return hasModule(session, 'receptor-cartridge');
}

export function canSeeTrailIntensity(session: AdventureSession): boolean {
  return hasModule(session, 'optical-reader');
}

export function canRejectNoise(session: AdventureSession): boolean {
  return hasModule(session, 'signal-filter');
}

export function canClassifyPatterns(session: AdventureSession): boolean {
  return hasModule(session, 'pattern-decoder');
}

/**
 * Environmental scent overlays for later UI. Receptor required to detect
 * real samples; optical-reader adds trail intensity; signal-filter strips
 * wisp / noisy-field false markers; scan tags remaining fakes.
 */
export function visibleScentMarkers(session: AdventureSession): ScentMarker[] {
  if (!canDetectOdors(session)) return [];

  const filterOn = canRejectNoise(session);
  const optical = canSeeTrailIntensity(session);
  const classify = canClassifyPatterns(session);
  const scanning = session.player.scan.active;
  const out: ScentMarker[] = [];

  for (const item of session.interactables) {
    if (item.kind === 'odorSample' && item.odorId) {
      out.push({
        id: `scent-${item.id}`,
        tile: item.tile,
        odorId: item.odorId,
        vector: illustrativeOdorVector(item.odorId),
        intensity: 1,
        falseSignal: false,
        classified: classify && session.player.learnedOdorIds.includes(item.odorId),
      });
    }
    if (item.kind === 'coffeePile') {
      const highlighted = session.player.highlightedIds.includes(item.id);
      if (scanning || highlighted) {
        out.push({
          id: `pile-${item.id}`,
          tile: item.tile,
          odorId: 'coffee',
          vector: illustrativeOdorVector('coffee'),
          intensity: item.trueTarget ? 1 : 0.45,
          falseSignal: false,
          classified: classify || highlighted,
        });
      }
    }
    if (item.kind === 'scentTrail' && (optical || session.player.highlightedIds.includes(item.id))) {
      out.push({
        id: `trail-${item.id}`,
        tile: item.tile,
        odorId: item.odorId,
        vector: item.odorId ? illustrativeOdorVector(item.odorId) : undefined,
        intensity: item.trailIntensity ?? 0.5,
        falseSignal: false,
        classified: classify,
      });
    }
    if (item.kind === 'noisyField' && !filterOn) {
      out.push({
        id: `noise-${item.id}`,
        tile: item.tile,
        intensity: scanning ? 0.35 : 0.55,
        falseSignal: true,
        classified: scanning,
      });
    }
  }

  for (const enemy of session.enemies) {
    if (enemy.kind !== 'noiseWisp' || enemy.defeated || filterOn) continue;
    for (const [i, tile] of enemy.falseMarkerTiles.entries()) {
      out.push({
        id: `wisp-false-${enemy.id}-${i}`,
        tile,
        intensity: 0.4,
        falseSignal: true,
        classified: scanning || enemy.revealed,
      });
    }
    if (scanning || enemy.revealed) {
      out.push({
        id: `wisp-core-${enemy.id}`,
        tile: { x: Math.floor(enemy.position.x), y: Math.floor(enemy.position.y) },
        intensity: 0.9,
        falseSignal: false,
        classified: true,
      });
    }
  }

  return out;
}

function distTo(session: AdventureSession, tile: Vec2): number {
  return Math.hypot(session.player.position.x - (tile.x + 0.5), session.player.position.y - (tile.y + 0.5));
}

/**
 * Q Scan compares the environment against the active learned profile.
 * Matching coffee piles, trails, and shifted thorn/wood panels highlight;
 * this is pattern comparison, not a magic power.
 */
export function applyActiveProfileScan(
  session: AdventureSession,
  opts: { silent?: boolean } = {},
): AdventureSession {
  if (!session.player.scan.active) return session;
  const profile = session.player.activeScentProfileId;
  const hits: string[] = [];
  let next = session;
  let unlockedPassageId: string | null = null;
  let message: string | null = session.lastFeedback.message;

  for (const item of session.interactables) {
    if (distTo(next, item.tile) > SCAN_REVEAL_RANGE) continue;

    if (item.kind === 'coffeePile' && profile === 'coffee') {
      hits.push(item.id);
    }
    if (item.kind === 'scentTrail' && profile && item.odorId === profile) {
      hits.push(item.id);
    }
    if (
      (item.kind === 'hiddenPassage' || item.kind === 'hiddenChest' || item.kind === 'thornWall') &&
      !next.unlockedPassageIds.includes(item.id) &&
      canUnlockScanWall(item, next.player, true, profile)
    ) {
      hits.push(item.id);
      next = {
        ...next,
        unlockedPassageIds: [...next.unlockedPassageIds, item.id],
        player: {
          ...next.player,
          discoveredSecretIds: item.secretId
            ? next.player.discoveredSecretIds.includes(item.secretId)
              ? next.player.discoveredSecretIds
              : [...next.player.discoveredSecretIds, item.secretId]
            : next.player.discoveredSecretIds,
        },
      };
      unlockedPassageId = item.id;
      message = item.kind === 'thornWall' ? 'thorn-open' : 'secret-found';
    }
    if (
      item.kind === 'decayBarrier' &&
      !next.player.revealedBarrierIds.includes(item.id) &&
      profile === 'lemon' &&
      canRevealDecayBarrier(item, next.player, true)
    ) {
      hits.push(item.id);
      next = {
        ...next,
        player: {
          ...next.player,
          revealedBarrierIds: [...next.player.revealedBarrierIds, item.id],
        },
      };
      message = 'decay-reveal';
    }
  }

  const nearbyCoffee = session.interactables.some(
    (item) => item.kind === 'coffeePile' && distTo(session, item.tile) <= SCAN_REVEAL_RANGE,
  );
  if (nearbyCoffee && profile !== 'coffee' && hits.length === 0) {
    message = 'coffee-profile-required';
  }
  const nearbyThorn = session.interactables.some(
    (item) => item.kind === 'thornWall' && distTo(session, item.tile) <= SCAN_REVEAL_RANGE,
  );
  if (nearbyThorn && profile !== 'rose' && !unlockedPassageId) {
    message = message ?? 'rose-profile-required';
  }

  if (opts.silent && !unlockedPassageId && message !== 'decay-reveal') {
    return {
      ...next,
      player: { ...next.player, highlightedIds: hits },
    };
  }

  return {
    ...next,
    player: { ...next.player, highlightedIds: hits },
    lastFeedback: {
      ...emptyFeedback(),
      unlockedPassageId,
      message: message ?? (hits.length > 0 ? 'scan' : 'no-matching-pattern'),
    },
  };
}
