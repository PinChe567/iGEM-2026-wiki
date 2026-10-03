import { ADVENTURE_SEAL_IDS, INTERACT_RANGE } from './constants';
import { currentObjective } from './guidance';
import { roomIdAt } from './map';
import type { AdventureSealId, AdventureSession, Vec2 } from './types';

export type AdventureMinimap = {
  width: number;
  height: number;
  explored: boolean[];
  walls: boolean[];
  player: Vec2;
  exit: Vec2 | null;
  objective: Vec2 | null;
  checkpoints: Vec2[];
  seals: Array<{ id: AdventureSealId; restored: boolean }>;
};

export function markExplored(session: AdventureSession, radius = INTERACT_RANGE): AdventureSession {
  const explored = session.player.explored.slice();
  const px = session.player.position.x;
  const py = session.player.position.y;
  const w = session.map.width;
  const h = session.map.height;
  let changed = false;
  const minX = Math.max(0, Math.floor(px - radius));
  const maxX = Math.min(w - 1, Math.ceil(px + radius));
  const minY = Math.max(0, Math.floor(py - radius));
  const maxY = Math.min(h - 1, Math.ceil(py + radius));
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      if (Math.hypot(px - (x + 0.5), py - (y + 0.5)) > radius) continue;
      const idx = y * w + x;
      if (!explored[idx]) {
        explored[idx] = true;
        changed = true;
      }
    }
  }
  if (!changed) return session;
  return { ...session, player: { ...session.player, explored } };
}

export function playerRoomId(session: AdventureSession) {
  return roomIdAt(Math.floor(session.player.position.x), Math.floor(session.player.position.y));
}

export function buildAdventureMinimap(session: AdventureSession): AdventureMinimap {
  const geoBlocked = session.map.collision;
  const hiddenLocked = new Set(
    session.interactables
      .filter(
        (item) =>
          (item.kind === 'hiddenPassage' || item.kind === 'hiddenChest' || item.kind === 'thornWall') &&
          !session.unlockedPassageIds.includes(item.id),
      )
      .map((item) => `${item.tile.x},${item.tile.y}`),
  );
  const walls = geoBlocked.map((blocked, idx) => {
    const x = idx % session.map.width;
    const y = Math.floor(idx / session.map.width);
    if (hiddenLocked.has(`${x},${y}`)) return true;
    return blocked;
  });
  const explored = session.player.explored;
  const exitExplored = explored[session.map.exitTile.y * session.map.width + session.map.exitTile.x] === true;
  const obj = currentObjective(session);
  const checkpoints = session.interactables
    .filter((item) => item.kind === 'checkpoint' && session.player.discoveredCheckpointIds.includes(item.id))
    .map((item) => ({ x: item.tile.x + 0.5, y: item.tile.y + 0.5 }));
  return {
    width: session.map.width,
    height: session.map.height,
    explored,
    walls,
    player: { ...session.player.position },
    exit: exitExplored ? { x: session.map.exitTile.x + 0.5, y: session.map.exitTile.y + 0.5 } : null,
    objective: obj ? { x: obj.tile.x + 0.5, y: obj.tile.y + 0.5 } : null,
    checkpoints,
    seals: ADVENTURE_SEAL_IDS.map((id) => ({
      id,
      restored: session.player.restoredSealIds.includes(id),
    })),
  };
}
