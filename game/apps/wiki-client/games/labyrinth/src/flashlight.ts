import {
  adventureToLabyrinthMap,
  isPointLit,
  type AdventureSession,
  type LabyrinthMap,
} from '@suite/core/labyrinth';

/** Tight glow around the player; anything farther must be in the cone and not behind a wall. */
export const FLASH_HALO = 1.22;
export const FLASH_CONE = 5.2;

/** Unlit walls and floors share this so the dark maze reads as one volume. */
export const UNLIT_HEX = '#0b0e14';

let geoCache: LabyrinthMap | null = null;
let geoKey = '';

export function flashlightOpts(lowDarkness: boolean) {
  return {
    haloRadius: lowDarkness ? 2.3 : FLASH_HALO,
    coneRange: lowDarkness ? 7 : FLASH_CONE,
    rayStep: 0.14,
  };
}

export function mazeCollision(session: AdventureSession): LabyrinthMap {
  const key = `${session.map.width}x${session.map.height}:${session.unlockedPassageIds.join(',')}`;
  if (geoCache && key === geoKey) return geoCache;
  geoKey = key;
  geoCache = adventureToLabyrinthMap(session.map, session.unlockedPassageIds);
  return geoCache;
}

export function mazePointLit(
  session: AdventureSession,
  point: { x: number; y: number },
  lowDarkness: boolean,
): boolean {
  if (lowDarkness) return true;
  const origin = session.player.position;
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  if (dx * dx + dy * dy > FLASH_CONE * FLASH_CONE) return false;
  return isPointLit(mazeCollision(session), origin, session.player.facing, point, flashlightOpts(false));
}

export function mazeTileLit(
  session: AdventureSession,
  tile: { x: number; y: number },
  wall: boolean,
  lowDarkness: boolean,
): boolean {
  const px = session.player.position.x;
  const py = session.player.position.y;
  const sample = wall
    ? {
        x: Math.min(tile.x + 0.92, Math.max(tile.x + 0.08, px)),
        y: Math.min(tile.y + 0.92, Math.max(tile.y + 0.08, py)),
      }
    : { x: tile.x + 0.5, y: tile.y + 0.5 };
  return mazePointLit(session, sample, lowDarkness);
}
