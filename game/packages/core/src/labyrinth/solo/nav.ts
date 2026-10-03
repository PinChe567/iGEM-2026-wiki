/**
 * Tile nav graph for NPC pathfinding. Edges respect role gate permissions
 * (phantom may traverse unauthorized gates only when phaseShiftActive).
 */

import { tryMove, neighbors4 } from '../movement';
import { authorizedGates, type LabyrinthOdorId } from '../role-gates';
import type { ActorPermissions, DoorState, LabyrinthMap, Vec2 } from '../types';

export type NavNodeKey = string;

export function navKey(x: number, y: number): NavNodeKey {
  return `${x},${y}`;
}

export function parseNavKey(key: NavNodeKey): Vec2 {
  const [x, y] = key.split(',').map(Number);
  return { x: x!, y: y! };
}

export function buildWalkableKeys(map: LabyrinthMap): NavNodeKey[] {
  const keys: NavNodeKey[] = [];
  for (const tile of map.tiles) {
    if (tile.kind === 'wall') continue;
    const idx = tile.y * map.width + tile.x;
    if (map.collision[idx]) continue;
    keys.push(navKey(tile.x, tile.y));
  }
  return keys;
}

export function shortestPath(
  map: LabyrinthMap,
  from: Vec2,
  to: Vec2,
  actor: ActorPermissions,
  doors: DoorState,
): Vec2[] | null {
  const start = navKey(from.x, from.y);
  const goal = navKey(to.x, to.y);
  if (start === goal) return [from];

  const queue: NavNodeKey[] = [start];
  const came = new Map<NavNodeKey, NavNodeKey | null>([[start, null]]);

  while (queue.length > 0) {
    const curKey = queue.shift()!;
    const cur = parseNavKey(curKey);
    for (const next of neighbors4(map, cur)) {
      const nk = navKey(next.x, next.y);
      if (came.has(nk)) continue;
      const step = tryMove(map, cur, next, actor, doors);
      if (!step.ok) continue;
      came.set(nk, curKey);
      if (nk === goal) {
        const path: Vec2[] = [];
        let k: NavNodeKey | null = goal;
        while (k) {
          path.push(parseNavKey(k));
          k = came.get(k) ?? null;
        }
        path.reverse();
        return path;
      }
      queue.push(nk);
    }
  }
  return null;
}

export function actorPerms(
  odorId: LabyrinthOdorId,
  isPhantom: boolean,
  phaseShiftActive: boolean,
): ActorPermissions {
  return {
    odorId,
    authorizedGates: authorizedGates(odorId),
    isPhantom,
    phaseShiftActive,
  };
}
