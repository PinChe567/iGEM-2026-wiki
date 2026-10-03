/**
 * Continuous exploration movement that still enforces gate/door/wall rules
 * via the same permission model as tryMove / canPassGate.
 */

import { canPassGate } from './gates';
import {
  getTileAt,
  inBounds,
  isDoorOpen,
  isWallCollision,
  tileIndex,
} from './movement';
import { authorizedGates, type LabyrinthOdorId } from './role-gates';
import type {
  ActorPermissions,
  DoorState,
  LabyrinthMap,
  MoveFailureReason,
} from './types';
import type { GateId } from './role-gates';

export const ACTOR_RADIUS = 0.28;
export const DEFAULT_MOVE_SPEED = 3.2; // tiles / second

export type WorldPos = { x: number; y: number };

export type ExplorationIntent = {
  /** Desired move in world axes, typically -1..1. */
  moveX: number;
  moveY: number;
  /** Aim direction in radians (0 = +x / east). */
  aimAngle: number;
  interactPressed: boolean;
};

export type ContinuousMoveResult =
  | {
      ok: true;
      position: WorldPos;
      crossedGateId?: GateId;
      usedPhaseShift: boolean;
      artifactRequired: boolean;
    }
  | { ok: false; reason: MoveFailureReason; position: WorldPos };

function sampleBlocked(
  map: LabyrinthMap,
  x: number,
  y: number,
  doors: DoorState,
  actor: ActorPermissions,
):
  | { blocked: false; gateId?: GateId; usedPhaseShift: boolean; artifactRequired: boolean }
  | { blocked: true; reason: MoveFailureReason } {
  const tiles = overlappingTiles(map, x, y, ACTOR_RADIUS);
  let gateId: GateId | undefined;
  let usedPhaseShift = false;
  let artifactRequired = false;

  for (const { tx, ty } of tiles) {
    if (!inBounds(map, tx, ty) || isWallCollision(map, tx, ty)) {
      return { blocked: true, reason: 'blocked_wall' };
    }
    const tile = getTileAt(map, tx, ty);
    if (!tile) return { blocked: true, reason: 'out_of_bounds' };

    if (tile.kind === 'door') {
      if (!isDoorOpen(tile, doors)) {
        return { blocked: true, reason: 'door_closed' };
      }
    }

    if (tile.kind === 'gate' && tile.gateId) {
      const decision = canPassGate(actor, tile.gateId);
      if (!decision.allowed) {
        return { blocked: true, reason: decision.reason };
      }
      gateId = tile.gateId;
      usedPhaseShift = decision.usedPhaseShift;
      artifactRequired = decision.artifactRequired;
    }
  }

  return { blocked: false, gateId, usedPhaseShift, artifactRequired };
}

export function overlappingTiles(
  map: LabyrinthMap,
  x: number,
  y: number,
  radius: number,
): Array<{ tx: number; ty: number }> {
  const minX = Math.floor(x - radius);
  const maxX = Math.floor(x + radius);
  const minY = Math.floor(y - radius);
  const maxY = Math.floor(y + radius);
  const out: Array<{ tx: number; ty: number }> = [];
  for (let ty = minY; ty <= maxY; ty += 1) {
    for (let tx = minX; tx <= maxX; tx += 1) {
      if (inBounds(map, tx, ty)) out.push({ tx, ty });
    }
  }
  // Always include center tile even if somehow empty
  if (out.length === 0 && inBounds(map, Math.floor(x), Math.floor(y))) {
    out.push({ tx: Math.floor(x), ty: Math.floor(y) });
  }
  void map;
  return out;
}

/**
 * Axis-separated continuous move. UI must not write position — only call this.
 */
export function tryContinuousMove(
  map: LabyrinthMap,
  from: WorldPos,
  delta: WorldPos,
  actor: ActorPermissions,
  doors: DoorState,
): ContinuousMoveResult {
  let x = from.x;
  let y = from.y;
  let crossedGateId: GateId | undefined;
  let usedPhaseShift = false;
  let artifactRequired = false;

  if (delta.x !== 0) {
    const nx = x + delta.x;
    const probe = sampleBlocked(map, nx, y, doors, actor);
    if (!probe.blocked) {
      x = nx;
      if (probe.gateId) {
        crossedGateId = probe.gateId;
        usedPhaseShift = probe.usedPhaseShift;
        artifactRequired = probe.artifactRequired;
      }
    } else if (delta.y === 0) {
      return { ok: false, reason: probe.reason, position: { x, y } };
    }
  }

  if (delta.y !== 0) {
    const ny = y + delta.y;
    const probe = sampleBlocked(map, x, ny, doors, actor);
    if (!probe.blocked) {
      y = ny;
      if (probe.gateId) {
        crossedGateId = probe.gateId;
        usedPhaseShift = probe.usedPhaseShift;
        artifactRequired = probe.artifactRequired;
      }
    } else if (delta.x === 0) {
      return { ok: false, reason: probe.reason, position: { x, y } };
    }
  }

  return {
    ok: true,
    position: { x, y },
    crossedGateId,
    usedPhaseShift,
    artifactRequired,
  };
}

export type DebugActor = {
  id: string;
  label: string;
  x: number;
  y: number;
  odorId: LabyrinthOdorId;
  /** Optional render hints from campaign. */
  isPhantom?: boolean;
  threat?: boolean;
};

export type InteractableKind = 'door' | 'task' | 'gate' | 'scanner' | 'review';

export type NearbyInteractable = {
  kind: InteractableKind;
  id: string;
  tileX: number;
  tileY: number;
  gateId?: GateId;
  doorId?: string;
  taskId?: string;
  /** Distance from actor center to tile center. */
  distance: number;
};

export function findNearbyInteractables(
  map: LabyrinthMap,
  pos: WorldPos,
  maxDist = 1.15,
): NearbyInteractable[] {
  const found: NearbyInteractable[] = [];
  for (const tile of map.tiles) {
    if (
      tile.kind !== 'door' &&
      tile.kind !== 'task' &&
      tile.kind !== 'gate' &&
      tile.kind !== 'scanner' &&
      tile.kind !== 'review'
    ) {
      continue;
    }
    const cx = tile.x + 0.5;
    const cy = tile.y + 0.5;
    const distance = Math.hypot(pos.x - cx, pos.y - cy);
    if (distance > maxDist) continue;
    found.push({
      kind: tile.kind,
      id: tile.id,
      tileX: tile.x,
      tileY: tile.y,
      gateId: tile.gateId,
      doorId: tile.doorId,
      taskId: tile.taskId,
      distance,
    });
  }
  found.sort((a, b) => a.distance - b.distance);
  return found;
}

export type ExplorationActorState = {
  id: string;
  position: WorldPos;
  /** Previous sim position for render interpolation. */
  prevPosition: WorldPos;
  facing: number;
  odorId: LabyrinthOdorId;
  isPhantom: boolean;
  phaseShiftActive: boolean;
};

export type ExplorationSession = {
  map: LabyrinthMap;
  doors: Map<string, boolean>;
  player: ExplorationActorState;
  debugActors: DebugActor[];
  paused: boolean;
  simTimeMs: number;
  lastGateBlockReason: MoveFailureReason | null;
  lastCrossedGateId: GateId | null;
  interactFlashId: string | null;
};

export function permissionsFor(
  actor: Pick<ExplorationActorState, 'odorId' | 'isPhantom' | 'phaseShiftActive'>,
): ActorPermissions {
  return {
    odorId: actor.odorId,
    authorizedGates: authorizedGates(actor.odorId),
    isPhantom: actor.isPhantom,
    phaseShiftActive: actor.phaseShiftActive,
  };
}

export function createExplorationSession(
  map: LabyrinthMap,
  opts?: {
    odorId?: LabyrinthOdorId;
    spawnIndex?: number;
    isPhantom?: boolean;
  },
): ExplorationSession {
  const spawn = map.spawns[opts?.spawnIndex ?? 0] ?? map.spawns[0]!;
  const pos = { x: spawn.x + 0.5, y: spawn.y + 0.5 };
  const odorId = opts?.odorId ?? 'banana';

  const debugActors: DebugActor[] = [
    { id: 'dbg_lemon', label: 'NPC-L', x: 8.5, y: 6.5, odorId: 'lemon' },
    { id: 'dbg_rose', label: 'NPC-R', x: 18.5, y: 7.5, odorId: 'rose' },
    { id: 'dbg_mint', label: 'NPC-M', x: 12.5, y: 1.5, odorId: 'mint' },
  ];

  return {
    map,
    doors: new Map(map.doors.map((d) => [d.id, d.defaultOpen])),
    player: {
      id: 'player',
      position: { ...pos },
      prevPosition: { ...pos },
      facing: 0,
      odorId,
      isPhantom: Boolean(opts?.isPhantom),
      phaseShiftActive: false,
    },
    debugActors,
    paused: false,
    simTimeMs: 0,
    lastGateBlockReason: null,
    lastCrossedGateId: null,
    interactFlashId: null,
  };
}

export function tickExploration(
  session: ExplorationSession,
  intent: ExplorationIntent,
  dtSec: number,
  moveSpeed: number = DEFAULT_MOVE_SPEED,
): ExplorationSession {
  if (session.paused || dtSec <= 0) {
    return {
      ...session,
      player: {
        ...session.player,
        prevPosition: { ...session.player.position },
      },
    };
  }

  const player = { ...session.player, prevPosition: { ...session.player.position } };
  player.facing = intent.aimAngle;

  const len = Math.hypot(intent.moveX, intent.moveY);
  let next = session;
  if (len > 1e-3) {
    const nx = intent.moveX / len;
    const ny = intent.moveY / len;
    const delta = {
      x: nx * moveSpeed * dtSec,
      y: ny * moveSpeed * dtSec,
    };
    const result = tryContinuousMove(
      session.map,
      player.position,
      delta,
      permissionsFor(player),
      session.doors,
    );
    player.position = result.position;
    if (result.ok) {
      next = {
        ...session,
        lastGateBlockReason: null,
        lastCrossedGateId: result.crossedGateId ?? session.lastCrossedGateId,
      };
    } else {
      next = {
        ...session,
        lastGateBlockReason: result.reason,
      };
    }
  }

  let doors = next.doors;
  let interactFlashId: string | null = null;
  if (intent.interactPressed) {
    const nearby = findNearbyInteractables(next.map, player.position)[0];
    if (nearby?.kind === 'door' && nearby.doorId) {
      doors = new Map(doors);
      doors.set(nearby.doorId, !(doors.get(nearby.doorId) !== false));
      interactFlashId = nearby.id;
    } else if (nearby) {
      interactFlashId = nearby.id;
    }
  }

  return {
    ...next,
    doors,
    player,
    simTimeMs: session.simTimeMs + dtSec * 1000,
    interactFlashId,
  };
}

export function currentRoomId(session: ExplorationSession): string | null {
  const tx = Math.floor(session.player.position.x);
  const ty = Math.floor(session.player.position.y);
  return getTileAt(session.map, tx, ty)?.roomId ?? null;
}

export function tileCenter(tx: number, ty: number): WorldPos {
  return { x: tx + 0.5, y: ty + 0.5 };
}

/** Expose collision sample for overlays. */
export function collisionAt(map: LabyrinthMap, tx: number, ty: number): boolean {
  if (!inBounds(map, tx, ty)) return true;
  return map.collision[tileIndex(map, tx, ty)] === true;
}
