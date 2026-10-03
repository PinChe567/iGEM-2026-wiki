import { computeReachability } from '../map/reachability';
import { ADVENTURE_MODULE_IDS, ADVENTURE_SEAL_IDS, requiredOdorIds, SCENT_GAMEPLAY_USES } from './constants';
import { adventureToLabyrinthMap, ADVENTURE_MOVE_ACTOR } from './map';
import type {
  AdventureDifficulty,
  AdventureInteractable,
  AdventureMap,
  AdventureModuleId,
  AdventurePlayerState,
  AdventureRequirements,
  AdventureSession,
  Vec2,
} from './types';

export function hasModule(
  session: Pick<AdventureSession, 'player'> | { player: Pick<AdventurePlayerState, 'collectedModules'> },
  id: AdventureModuleId,
): boolean {
  return session.player.collectedModules.includes(id);
}

export function requirementsMet(
  req: AdventureRequirements | undefined,
  player: Pick<AdventurePlayerState, 'learnedOdorIds' | 'collectedModules'>,
  scanActive: boolean,
): boolean {
  if (!req) return true;
  const checks: boolean[] = [];
  if (req.learnedOdorIds && req.learnedOdorIds.length > 0) {
    checks.push(req.learnedOdorIds.every((id) => player.learnedOdorIds.includes(id)));
  }
  if (req.moduleIds && req.moduleIds.length > 0) {
    checks.push(req.moduleIds.every((id) => player.collectedModules.includes(id)));
  }
  if (req.scanRequired) {
    checks.push(scanActive);
  }
  if (checks.length === 0) return true;
  return (req.mode ?? 'all') === 'any' ? checks.some(Boolean) : checks.every(Boolean);
}

/** Scan-gated walls stay open after a successful scan; scan is only the unlock key. */
export function canUnlockScanWall(
  item: AdventureInteractable,
  player: Pick<AdventurePlayerState, 'learnedOdorIds' | 'collectedModules'>,
  scanActive: boolean,
  activeProfile?: string | null,
): boolean {
  if (item.kind !== 'hiddenPassage' && item.kind !== 'hiddenChest' && item.kind !== 'thornWall') {
    return false;
  }
  const rest: AdventureRequirements = {
    ...item.requirements,
    scanRequired: false,
  };
  const needsScan = item.requirements?.scanRequired === true;
  const odor = item.odorId ?? item.requirements?.learnedOdorIds?.[0];
  if (activeProfile !== undefined && odor && activeProfile !== odor) return false;
  return requirementsMet(rest, player, false) && (!needsScan || scanActive);
}

export function canUnlockHiddenPassage(
  item: AdventureInteractable,
  player: Pick<AdventurePlayerState, 'learnedOdorIds' | 'collectedModules'>,
  scanActive: boolean,
): boolean {
  return canUnlockScanWall(item, player, scanActive);
}

export function canRevealDecayBarrier(
  item: AdventureInteractable,
  player: Pick<AdventurePlayerState, 'learnedOdorIds' | 'collectedModules' | 'revealedBarrierIds'>,
  scanActive: boolean,
): boolean {
  if (item.kind !== 'decayBarrier') return false;
  if (player.revealedBarrierIds.includes(item.id)) return true;
  return requirementsMet(item.requirements, player, scanActive);
}

export function computeOpenDoorIds(session: AdventureSession): string[] {
  return session.interactables
    .filter((item) => {
      if (item.kind === 'scentGate') {
        return requirementsMet(item.requirements, session.player, false);
      }
      if (item.kind === 'decayBarrier') {
        return canRevealDecayBarrier(item, session.player, session.player.scan.active);
      }
      if (item.kind === 'scentLock') {
        return session.player.solvedPuzzleIds.includes(item.id);
      }
      return false;
    })
    .map((item) => item.id);
}

export function canUseExit(_session: AdventureSession): boolean {
  return true;
}

export function canRestoreSeal(session: AdventureSession, item: AdventureInteractable): boolean {
  if (item.kind !== 'exitSeal' || !item.sealId) return false;
  if (session.player.restoredSealIds.includes(item.sealId)) return false;
  if (item.sealId === 'storage') return session.player.foundClueIds.includes('storage-coffee');
  if (item.sealId === 'garden') {
    const trueThorn = session.interactables.find((row) => row.kind === 'thornWall' && row.trueTarget);
    return Boolean(trueThorn && session.unlockedPassageIds.includes(trueThorn.id));
  }
  if (item.sealId === 'signal') return session.player.collectedModules.includes('signal-filter');
  return false;
}

export function scentHasGameplayUse(map: AdventureMap, odorId: string): boolean {
  const use = SCENT_GAMEPLAY_USES[odorId];
  if (!use) return false;
  return map.interactables.some((item) => {
    if (use === 'coffee-pile') return item.kind === 'coffeePile' && item.odorId === 'coffee';
    if (use === 'thorn-wall') return item.kind === 'thornWall' && item.odorId === 'rose';
    if (use === 'airflow-trail') return item.kind === 'scentTrail' && item.odorId === 'mint';
    if (use === 'cleaning-trail') {
      return (
        (item.kind === 'scentTrail' && item.odorId === 'lemon') ||
        (item.kind === 'decayBarrier' && item.odorId === 'lemon')
      );
    }
    if (use === 'wood-panel') return item.kind === 'hiddenChest' && item.odorId === 'pine';
    if (use === 'banana-passage') return item.kind === 'hiddenPassage' && item.odorId === 'banana';
    if (use === 'scent-lock') return item.kind === 'scentLock' && item.odorId === 'peach';
    return false;
  });
}

export function grantModule(
  collected: readonly AdventureModuleId[],
  id: AdventureModuleId,
): AdventureModuleId[] {
  if (collected.includes(id)) return [...collected];
  return [...collected, id];
}

function neighbors(tile: Vec2): Vec2[] {
  return [
    { x: tile.x + 1, y: tile.y },
    { x: tile.x - 1, y: tile.y },
    { x: tile.x, y: tile.y + 1 },
    { x: tile.x, y: tile.y - 1 },
  ];
}

function keyOf(pos: Vec2): string {
  return `${pos.x},${pos.y}`;
}

export type ProgressSim = {
  collectedModules: AdventureModuleId[];
  learnedOdorIds: string[];
  openedChestIds: string[];
  unlockedPassageIds: string[];
  restoredSealIds: string[];
  exitReachable: boolean;
  allRequiredOdors: boolean;
  allModules: boolean;
  allSeals: boolean;
};

/**
 * Staged pickup / door-open BFS used to prove the official map cannot soft-lock.
 * Scan-gated hidden tiles unlock when an adjacent floor is reachable.
 */
export function simulateOfficialProgress(
  map: AdventureMap,
  difficulty: AdventureDifficulty,
): ProgressSim {
  const odorsNeeded = requiredOdorIds(difficulty);
  const interactables = map.interactables;

  const collectedModules: AdventureModuleId[] = [];
  const learnedOdorIds: string[] = [];
  const openedChestIds: string[] = [];
  const unlockedPassageIds: string[] = [];
  const revealedBarrierIds: string[] = [];
  const solvedPuzzleIds: string[] = [];
  const foundClueIds: string[] = [];
  const restoredSealIds: string[] = [];

  const playerLike = () => ({
    learnedOdorIds,
    collectedModules,
    revealedBarrierIds,
    solvedPuzzleIds,
  });

  let guard = 0;
  let progress = true;
  while (progress && guard < 64) {
    progress = false;
    guard += 1;
    const geo = adventureToLabyrinthMap(map, unlockedPassageIds);
    const doors = new Map(geo.doors.map((door) => [door.id, false]));
    for (const item of interactables) {
      if (item.kind === 'scentGate') {
        if (requirementsMet(item.requirements, playerLike(), false)) doors.set(item.id, true);
      }
      if (item.kind === 'decayBarrier' && revealedBarrierIds.includes(item.id)) {
        doors.set(item.id, true);
      }
      if (item.kind === 'scentLock' && solvedPuzzleIds.includes(item.id)) {
        doors.set(item.id, true);
      }
    }
    const reach = computeReachability(geo, map.spawn, {
      odorId: ADVENTURE_MOVE_ACTOR.odorId,
      doors,
    });

    for (const item of interactables) {
      const onTile = reach.reachable.has(keyOf(item.tile));
      if (item.kind === 'hiddenPassage' || item.kind === 'hiddenChest' || item.kind === 'thornWall') {
        const adjacent = neighbors(item.tile).some((n) => reach.reachable.has(keyOf(n)));
        if (
          adjacent &&
          !unlockedPassageIds.includes(item.id) &&
          canUnlockScanWall(item, playerLike(), true)
        ) {
          unlockedPassageIds.push(item.id);
          progress = true;
        }
        continue;
      }
      if (item.kind === 'decayBarrier') {
        const adjacent = neighbors(item.tile).some((n) => reach.reachable.has(keyOf(n))) || onTile;
        if (
          adjacent &&
          !revealedBarrierIds.includes(item.id) &&
          requirementsMet({ ...item.requirements, scanRequired: false }, playerLike(), false)
        ) {
          revealedBarrierIds.push(item.id);
          progress = true;
        }
        continue;
      }
      if (item.kind === 'scentLock' && !solvedPuzzleIds.includes(item.id)) {
        const adjacent = neighbors(item.tile).some((n) => reach.reachable.has(keyOf(n))) || onTile;
        if (adjacent && requirementsMet(item.requirements, playerLike(), false)) {
          solvedPuzzleIds.push(item.id);
          progress = true;
        }
        continue;
      }
      if (!onTile) continue;
      if (item.kind === 'chest' || item.kind === 'modulePedestal') {
        if (openedChestIds.includes(item.id)) continue;
        if (!requirementsMet({ ...item.requirements, scanRequired: false }, playerLike(), false)) continue;
        openedChestIds.push(item.id);
        if (item.loot?.moduleId) {
          if (!collectedModules.includes(item.loot.moduleId)) {
            collectedModules.push(item.loot.moduleId);
          }
        }
        progress = true;
      }
      if (item.kind === 'odorSample' && item.odorId) {
        if (learnedOdorIds.includes(item.odorId)) continue;
        if (!requirementsMet(item.requirements, playerLike(), false)) continue;
        learnedOdorIds.push(item.odorId);
        progress = true;
      }
      if (item.kind === 'coffeePile' && item.trueTarget && item.clueId) {
        if (foundClueIds.includes(item.clueId)) continue;
        if (!learnedOdorIds.includes('coffee')) continue;
        foundClueIds.push(item.clueId);
        progress = true;
      }
      if (item.kind === 'exitSeal' && item.sealId && !restoredSealIds.includes(item.sealId)) {
        const fakeSession = {
          player: { foundClueIds, restoredSealIds, collectedModules },
          interactables,
          unlockedPassageIds,
        } as AdventureSession;
        if (canRestoreSeal(fakeSession, item)) {
          restoredSealIds.push(item.sealId);
          progress = true;
        }
      }
    }

    const boss = map.enemies.find((e) => e.kind === 'noiseBloom');
    if (boss && !collectedModules.includes('signal-filter')) {
      const coreReachable = (boss.coreTiles ?? [boss.tile]).some((tile) =>
        reach.reachable.has(keyOf(tile)),
      );
      if (coreReachable) {
        collectedModules.push('signal-filter');
        progress = true;
      }
    }
  }

  const geo = adventureToLabyrinthMap(map, unlockedPassageIds);
  const doors = new Map(geo.doors.map((door) => [door.id, false]));
  for (const item of interactables) {
    if (item.kind === 'scentGate' && requirementsMet(item.requirements, playerLike(), false)) {
      doors.set(item.id, true);
    }
    if (item.kind === 'decayBarrier' && revealedBarrierIds.includes(item.id)) {
      doors.set(item.id, true);
    }
    if (item.kind === 'scentLock' && solvedPuzzleIds.includes(item.id)) {
      doors.set(item.id, true);
    }
  }
  const reach = computeReachability(geo, map.spawn, {
    odorId: ADVENTURE_MOVE_ACTOR.odorId,
    doors,
  });
  const exit = interactables.find((item) => item.kind === 'exit')!;
  const allSeals = ADVENTURE_SEAL_IDS.every((id) => restoredSealIds.includes(id));
  const exitReachable = reach.reachable.has(keyOf(exit.tile));

  return {
    collectedModules,
    learnedOdorIds,
    openedChestIds,
    unlockedPassageIds,
    restoredSealIds,
    exitReachable,
    allRequiredOdors: odorsNeeded.every((id) => learnedOdorIds.includes(id)),
    allModules: ADVENTURE_MODULE_IDS.every((id) => collectedModules.includes(id)),
    allSeals,
  };
}
