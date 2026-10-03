import { adventureToLabyrinthMap, roomIdAt, roomLabelKey } from './map';
import type { AdventureRoomId, AdventureSession, Vec2 } from './types';

export type AdventureObjective = {
  id: string;
  tile: Vec2;
  labelKey: string;
  wingKey: string;
};

const DIRS: Vec2[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

export function currentWingId(session: AdventureSession): AdventureRoomId {
  return roomIdAt(Math.floor(session.player.position.x), Math.floor(session.player.position.y));
}

export function currentObjective(session: AdventureSession): AdventureObjective {
  const exit = session.interactables.find((item) => item.kind === 'exit');
  const exitTile = exit?.tile ?? session.map.exitTile;
  const modules = session.player.collectedModules;
  const chest = (moduleId: string) =>
    session.interactables.find((item) => item.kind === 'chest' && item.loot?.moduleId === moduleId);
  const at = (item: { tile: Vec2 } | undefined, id: string, labelKey: string, wingKey: string): AdventureObjective => ({
    id,
    tile: item?.tile ?? exitTile,
    labelKey,
    wingKey,
  });

  if (!modules.includes('receptor-cartridge')) {
    return at(chest('receptor-cartridge'), 'cartridge', 'objCartridge', 'wingStorage');
  }

  const lemon = session.interactables.find((item) => item.kind === 'odorSample' && item.odorId === 'lemon');
  const vines = session.interactables.find((item) => item.kind === 'decayBarrier');
  if (lemon && !session.player.learnedOdorIds.includes('lemon')) {
    return at(lemon, 'lemon', 'objLemon', 'wingAtrium');
  }
  if (vines && !session.openDoorIds.includes(vines.id) && !session.player.revealedBarrierIds.includes(vines.id)) {
    return at(vines, 'vines', 'objVines', 'wingAtrium');
  }

  if (!modules.includes('optical-reader')) {
    return at(chest('optical-reader'), 'optical', 'objOptical', 'wingSignal');
  }
  if (!modules.includes('signal-filter')) {
    return at(chest('signal-filter'), 'filter', 'objFilter', 'wingSignal');
  }
  return { id: 'leave', tile: exitTile, labelKey: 'objFindExit', wingKey: 'wingSignal' };
}

export function currentWingLabelKey(session: AdventureSession): string {
  const obj = currentObjective(session);
  return obj.wingKey || roomLabelKey(currentWingId(session));
}

export function compassAngle(session: AdventureSession): number {
  const obj = currentObjective(session);
  return Math.atan2(
    obj.tile.y + 0.5 - session.player.position.y,
    obj.tile.x + 0.5 - session.player.position.x,
  );
}

export function secretCount(session: AdventureSession): { found: number; total: number } {
  const secrets = session.interactables.filter((i) => i.secretId);
  const found = new Set(session.player.discoveredSecretIds).size;
  return { found, total: Math.max(secrets.length, found) };
}

function keyOf(x: number, y: number): string {
  return `${x},${y}`;
}

function nearestWalkable(collision: readonly boolean[], width: number, height: number, tile: Vec2): Vec2 | null {
  const open = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < width && y < height && collision[y * width + x] !== true;
  if (open(tile.x, tile.y)) return tile;
  for (const dir of DIRS) {
    const n = { x: tile.x + dir.x, y: tile.y + dir.y };
    if (open(n.x, n.y)) return n;
  }
  return null;
}

/** Grid BFS from the player tile to a goal, respecting unlocked passages. */
export function shortestAdventurePath(session: AdventureSession, goal: Vec2): Vec2[] {
  const geo = adventureToLabyrinthMap(session.map, session.unlockedPassageIds);
  const start = nearestWalkable(geo.collision, geo.width, geo.height, {
    x: Math.floor(session.player.position.x),
    y: Math.floor(session.player.position.y),
  });
  const end = nearestWalkable(geo.collision, geo.width, geo.height, {
    x: Math.floor(goal.x),
    y: Math.floor(goal.y),
  });
  if (!start || !end) return [];
  if (start.x === end.x && start.y === end.y) return [start];

  const openDoors = new Set(session.openDoorIds);
  const closedDoors = new Set(
    session.interactables
      .filter(
        (item) =>
          (item.kind === 'scentGate' || item.kind === 'decayBarrier' || item.kind === 'scentLock') &&
          !openDoors.has(item.id) &&
          !session.player.revealedBarrierIds.includes(item.id) &&
          !session.player.solvedPuzzleIds.includes(item.id),
      )
      .map((item) => keyOf(item.tile.x, item.tile.y)),
  );

  const queue: Vec2[] = [start];
  const came = new Map<string, string | null>([[keyOf(start.x, start.y), null]]);
  const open = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= geo.width || y >= geo.height) return false;
    if (geo.collision[y * geo.width + x] === true) return false;
    if (closedDoors.has(keyOf(x, y)) && !(x === end.x && y === end.y)) return false;
    return true;
  };

  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const dir of DIRS) {
      const nx = cur.x + dir.x;
      const ny = cur.y + dir.y;
      const k = keyOf(nx, ny);
      if (came.has(k) || !open(nx, ny)) continue;
      came.set(k, keyOf(cur.x, cur.y));
      if (nx === end.x && ny === end.y) {
        const path: Vec2[] = [{ x: nx, y: ny }];
        let prev: string | null = keyOf(cur.x, cur.y);
        while (prev) {
          const [px, py] = prev.split(',').map(Number);
          path.push({ x: px!, y: py! });
          prev = came.get(prev) ?? null;
        }
        path.reverse();
        return path;
      }
      queue.push({ x: nx, y: ny });
    }
  }
  return [];
}
