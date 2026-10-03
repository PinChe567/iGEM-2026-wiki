import { canPassGate } from './gates';
import type { GateId } from './role-gates';
import type {
  ActorPermissions,
  DoorState,
  LabyrinthMap,
  MapTile,
  MoveResult,
  Vec2,
} from './types';

const CARDINAL: ReadonlyArray<Vec2> = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

export function tileIndex(map: LabyrinthMap, x: number, y: number): number {
  return y * map.width + x;
}

export function inBounds(map: LabyrinthMap, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < map.width && y < map.height;
}

export function getTileAt(map: LabyrinthMap, x: number, y: number): MapTile | undefined {
  if (!inBounds(map, x, y)) return undefined;
  return map.tiles.find((tile) => tile.x === x && tile.y === y);
}

export function isWallCollision(map: LabyrinthMap, x: number, y: number): boolean {
  if (!inBounds(map, x, y)) return true;
  const idx = tileIndex(map, x, y);
  return map.collision[idx] === true;
}

export function defaultDoorState(map: LabyrinthMap): Map<string, boolean> {
  return new Map(map.doors.map((door) => [door.id, door.defaultOpen]));
}

export function isDoorOpen(
  tile: MapTile,
  doors: DoorState,
): boolean {
  if (tile.kind !== 'door' || !tile.doorId) return true;
  const open = doors.get(tile.doorId);
  return open !== false;
}

export function chebyshev(a: Vec2, b: Vec2): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

export function isAdjacent(a: Vec2, b: Vec2): boolean {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return dx + dy === 1;
}

/**
 * Attempt a single cardinal step. Gate / door / wall rules are enforced here so
 * clients cannot bypass permissions by editing UI state alone.
 */
export function tryMove(
  map: LabyrinthMap,
  from: Vec2,
  to: Vec2,
  actor: ActorPermissions,
  doors: DoorState,
): MoveResult {
  if (!inBounds(map, to.x, to.y)) {
    return { ok: false, reason: 'out_of_bounds' };
  }
  if (!isAdjacent(from, to)) {
    return { ok: false, reason: 'not_adjacent' };
  }
  if (isWallCollision(map, to.x, to.y)) {
    return { ok: false, reason: 'blocked_wall' };
  }

  const dest = getTileAt(map, to.x, to.y);
  if (!dest) return { ok: false, reason: 'out_of_bounds' };

  if (dest.kind === 'door') {
    if (!isDoorOpen(dest, doors)) {
      return { ok: false, reason: 'door_closed' };
    }
  }

  if (dest.kind === 'gate' && dest.gateId) {
    const decision = canPassGate(actor, dest.gateId);
    if (!decision.allowed) {
      return { ok: false, reason: decision.reason };
    }
    return {
      ok: true,
      to,
      crossedGateId: dest.gateId,
      usedPhaseShift: decision.usedPhaseShift,
      artifactRequired: decision.artifactRequired,
    };
  }

  return {
    ok: true,
    to,
    usedPhaseShift: false,
    artifactRequired: false,
  };
}

export function neighbors4(map: LabyrinthMap, pos: Vec2): Vec2[] {
  const out: Vec2[] = [];
  for (const d of CARDINAL) {
    const n = { x: pos.x + d.x, y: pos.y + d.y };
    if (inBounds(map, n.x, n.y)) out.push(n);
  }
  return out;
}

export function gateIdAt(map: LabyrinthMap, pos: Vec2): GateId | undefined {
  return getTileAt(map, pos.x, pos.y)?.gateId;
}
