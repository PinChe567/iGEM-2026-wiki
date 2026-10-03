import { tryContinuousMove } from '../exploration';
import { ADVENTURE_PRESETS, MOVE_SPEED, SCAN_DURATION_MS } from './constants';
import { applyContactDamage, applyMeleeAttack, emptyFeedback } from './combat';
import { spawnEnemies, tickEnemies } from './enemies';
import { canSpendScan, consumeScanCharge, createInventory } from './inventory';
import {
  findNearbyAdventure,
  interactAdventure,
  setActiveScentProfile,
} from './interaction';
import { ADVENTURE_MOVE_ACTOR, adventureToLabyrinthMap, pickAdventureMap, tileCenterOf } from './map';
import { markExplored } from './minimap';
import { canUseExit, computeOpenDoorIds } from './progression';
import { tickSkillCheckPuzzle } from './puzzles';
import { applyActiveProfileScan } from './scent';
import type {
  AdventureDifficulty,
  AdventureIntent,
  AdventureMap,
  AdventureSession,
} from './types';

export type CreateAdventureOptions = {
  seed: string;
  difficulty?: AdventureDifficulty;
  map?: AdventureMap;
};

export { findNearbyAdventure, interactAdventure, setActiveScentProfile };

export function emptyAdventureIntent(): AdventureIntent {
  return {
    moveX: 0,
    moveY: 0,
    attackPressed: false,
    scanPressed: false,
    interactPressed: false,
    pausePressed: false,
    selectScentId: null,
    selectScentIndex: null,
  };
}

export function createAdventureSession(opts: CreateAdventureOptions): AdventureSession {
  const difficulty = opts.difficulty ?? 'standard';
  const preset = ADVENTURE_PRESETS[difficulty];
  const map = opts.map ?? pickAdventureMap(opts.seed);
  const spawn = tileCenterOf(map.spawn);
  const firstCheckpoint = map.interactables.find((item) => item.kind === 'checkpoint');
  const explored = Array.from({ length: map.width * map.height }, () => false);
  const spawnIdx = map.spawn.y * map.width + map.spawn.x;
  explored[spawnIdx] = true;

  const session: AdventureSession = {
    seed: opts.seed,
    difficulty,
    map,
    player: {
      position: { ...spawn },
      prevPosition: { ...spawn },
      facing: 0,
      maxHealth: preset.maxHealth,
      health: preset.maxHealth,
      currentCheckpointId: firstCheckpoint?.id ?? 'spawn',
      learnedOdorIds: [],
      collectedModules: [],
      openedChestIds: [],
      defeatedEnemyIds: [],
      discoveredSecretIds: [],
      solvedPuzzleIds: [],
      revealedBarrierIds: [],
      restoredSealIds: [],
      activeScentProfileId: null,
      highlightedIds: [],
      searchedPileIds: [],
      foundClueIds: [],
      discoveredCheckpointIds: firstCheckpoint ? [firstCheckpoint.id] : [],
      explored,
      inspectedExit: false,
      exitPatternSolved: false,
      inventory: createInventory(preset.startingScanCharges),
      scan: { active: false, remainingMs: 0, cooldownRemainingMs: 0 },
      invulnerableUntilMs: 0,
      attackCooldownUntilMs: 0,
    },
    enemies: spawnEnemies(map, opts.seed, difficulty),
    interactables: map.interactables,
    openDoorIds: [],
    unlockedPassageIds: [],
    elapsedMs: 0,
    phase: 'playing',
    activePuzzle: null,
    lastFeedback: emptyFeedback(),
  };
  return markExplored(session, 2.2);
}

export function geometryFor(session: AdventureSession) {
  return adventureToLabyrinthMap(session.map, session.unlockedPassageIds);
}

function tickScan(session: AdventureSession, dtMs: number): AdventureSession {
  const scan = { ...session.player.scan };
  if (scan.active) {
    scan.remainingMs = Math.max(0, scan.remainingMs - dtMs);
    if (scan.remainingMs <= 0) {
      scan.active = false;
      scan.remainingMs = 0;
      scan.cooldownRemainingMs = ADVENTURE_PRESETS[session.difficulty].scanCooldownMs;
    }
  } else if (scan.cooldownRemainingMs > 0) {
    scan.cooldownRemainingMs = Math.max(0, scan.cooldownRemainingMs - dtMs);
  }
  return {
    ...session,
    player: { ...session.player, scan },
  };
}

function tryStartScan(session: AdventureSession): AdventureSession {
  if (session.player.scan.active || session.player.scan.cooldownRemainingMs > 0) return session;
  if (!canSpendScan(session.player.inventory)) {
    return { ...session, lastFeedback: { ...emptyFeedback(), message: 'no-scan-charge' } };
  }
  const inventory = consumeScanCharge(session.player.inventory);
  if (!inventory) return session;
  const started: AdventureSession = {
    ...session,
    player: {
      ...session.player,
      inventory,
      scan: { active: true, remainingMs: SCAN_DURATION_MS, cooldownRemainingMs: 0 },
    },
    lastFeedback: { ...emptyFeedback(), message: 'scan' },
  };
  return applyActiveProfileScan(started);
}

function standOnTile(pos: { x: number; y: number }, tile: { x: number; y: number }): boolean {
  return Math.floor(pos.x) === tile.x && Math.floor(pos.y) === tile.y;
}

function autoCheckpoints(session: AdventureSession): AdventureSession {
  const here = session.interactables.find(
    (item) => item.kind === 'checkpoint' && standOnTile(session.player.position, item.tile),
  );
  if (!here) return session;
  const discovered = session.player.discoveredCheckpointIds.includes(here.id)
    ? session.player.discoveredCheckpointIds
    : [...session.player.discoveredCheckpointIds, here.id];
  if (here.id === session.player.currentCheckpointId && discovered === session.player.discoveredCheckpointIds) {
    return session;
  }
  return {
    ...session,
    player: {
      ...session.player,
      currentCheckpointId: here.id,
      discoveredCheckpointIds: discovered,
    },
  };
}

function tryAutoExit(session: AdventureSession): AdventureSession {
  const exit = session.interactables.find((item) => item.kind === 'exit');
  if (!exit) return session;
  if (!standOnTile(session.player.position, exit.tile)) return session;
  if (!canUseExit(session)) return session;
  return { ...session, phase: 'victory', lastFeedback: { ...emptyFeedback(), message: 'exit' } };
}

function applyScentSelect(session: AdventureSession, intent: AdventureIntent): AdventureSession {
  if (intent.selectScentId) return setActiveScentProfile(session, intent.selectScentId);
  if (intent.selectScentIndex != null && intent.selectScentIndex >= 0) {
    const id = session.player.learnedOdorIds[intent.selectScentIndex] ?? null;
    return setActiveScentProfile(session, id);
  }
  return session;
}

export function tickAdventure(
  session: AdventureSession,
  intent: AdventureIntent,
  dtMs: number,
): AdventureSession {
  if (session.phase === 'puzzle') {
    if (intent.pausePressed) {
      return { ...session, phase: 'playing', activePuzzle: null };
    }
    const next: AdventureSession = { ...session, elapsedMs: session.elapsedMs + dtMs };
    if (next.activePuzzle?.kind === 'skillCheck') {
      return tickSkillCheckPuzzle(next, intent, dtMs);
    }
    return next;
  }
  if (intent.pausePressed && session.phase !== 'victory') {
    return {
      ...session,
      phase: session.phase === 'paused' ? 'playing' : 'paused',
      player: { ...session.player, prevPosition: { ...session.player.position } },
    };
  }
  if (session.phase !== 'playing' || dtMs <= 0) {
    return {
      ...session,
      player: { ...session.player, prevPosition: { ...session.player.position } },
    };
  }

  let next: AdventureSession = {
    ...session,
    elapsedMs: session.elapsedMs + dtMs,
    lastFeedback: emptyFeedback(),
    player: { ...session.player, prevPosition: { ...session.player.position } },
  };

  next = applyScentSelect(next, intent);
  if (intent.scanPressed) next = tryStartScan(next);
  next = tickScan(next, dtMs);

  const len = Math.hypot(intent.moveX, intent.moveY);
  if (len > 1e-3) {
    const nx = intent.moveX / len;
    const ny = intent.moveY / len;
    const facing =
      Math.abs(nx) >= Math.abs(ny) && Math.abs(nx) > 0.2 ? (nx > 0 ? 0 : Math.PI) : next.player.facing;
    next = {
      ...next,
      player: {
        ...next.player,
        facing,
      },
    };
    const geo = geometryFor(next);
    const doors = new Map(geo.doors.map((door) => [door.id, next.openDoorIds.includes(door.id)]));
    const moved = tryContinuousMove(
      geo,
      next.player.position,
      { x: nx * MOVE_SPEED * (dtMs / 1000), y: ny * MOVE_SPEED * (dtMs / 1000) },
      ADVENTURE_MOVE_ACTOR,
      doors,
    );
    next = {
      ...next,
      player: { ...next.player, position: moved.position },
    };
    if (next.player.scan.active) next = applyActiveProfileScan(next, { silent: true });
  }

  next = markExplored(next);
  next = { ...next, openDoorIds: computeOpenDoorIds(next) };
  next = autoCheckpoints(next);

  if (intent.attackPressed) {
    next = applyMeleeAttack(next, ADVENTURE_PRESETS[next.difficulty].attackOmni);
  }
  if (intent.interactPressed) {
    next = interactAdventure(next);
  }

  next = tickEnemies(next, dtMs / 1000);
  next = applyContactDamage(next);
  next = { ...next, openDoorIds: computeOpenDoorIds(next) };
  next = tryAutoExit(next);
  return next;
}
