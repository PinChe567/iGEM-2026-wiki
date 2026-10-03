/**
 * Grid ray casting for exploration vision (halo + flashlight cone).
 * Pure functions — no canvas. Walls (collision=true) occlude; open floors do not.
 */

import { inBounds, tileIndex } from './movement';
import type { LabyrinthMap } from './types';

/** Local omnidirectional glow radius in tiles. */
export const VISION_HALO_RADIUS = 0.8;
/** Flashlight maximum range in tiles. */
export const VISION_FLASHLIGHT_RANGE = 7;
/** Flashlight full cone width in degrees. */
export const VISION_FLASHLIGHT_FOV_DEG = 64;

export type VisionPoint = { x: number; y: number };

export type RayHit = {
  angle: number;
  distance: number;
  hitX: number;
  hitY: number;
  hitWall: boolean;
};

export type VisionCastOptions = {
  /** Total rays for the flashlight cone (plus separate halo rays). */
  coneRayCount?: number;
  haloRayCount?: number;
  haloRadius?: number;
  coneRange?: number;
  /** Full cone width in radians. */
  coneFovRad?: number;
  /** DDA step in tiles. Larger is cheaper; default keeps test accuracy. */
  rayStep?: number;
};

export type VisionCastResult = {
  coneRays: RayHit[];
  haloRays: RayHit[];
  rayCount: number;
  facing: number;
  origin: VisionPoint;
};

const DEFAULT_CONE_RAYS = 48;
const DEFAULT_HALO_RAYS = 24;

function isOpaque(map: LabyrinthMap, tx: number, ty: number): boolean {
  if (!inBounds(map, tx, ty)) return true;
  return map.collision[tileIndex(map, tx, ty)] === true;
}

/**
 * DDA grid traversal from origin along angle until maxDist or opaque tile.
 * Origin is in continuous tile coordinates (tile centers ≈ *.5).
 */
export function castRay(
  map: LabyrinthMap,
  origin: VisionPoint,
  angle: number,
  maxDist: number,
  step = 0.05,
): RayHit {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let dist = 0;
  let x = origin.x;
  let y = origin.y;

  while (dist < maxDist) {
    x += dx * step;
    y += dy * step;
    dist += step;
    const tx = Math.floor(x);
    const ty = Math.floor(y);
    if (isOpaque(map, tx, ty)) {
      return {
        angle,
        distance: dist,
        hitX: x,
        hitY: y,
        hitWall: true,
      };
    }
  }

  return {
    angle,
    distance: maxDist,
    hitX: origin.x + dx * maxDist,
    hitY: origin.y + dy * maxDist,
    hitWall: false,
  };
}

export function flashlightFovRad(
  deg: number = VISION_FLASHLIGHT_FOV_DEG,
): number {
  return (deg * Math.PI) / 180;
}

/**
 * Cast cone rays (flashlight) + short 360° halo rays. Both stop at walls.
 */
export function castVisibility(
  map: LabyrinthMap,
  origin: VisionPoint,
  facing: number,
  options: VisionCastOptions = {},
): VisionCastResult {
  const coneRayCount = options.coneRayCount ?? DEFAULT_CONE_RAYS;
  const haloRayCount = options.haloRayCount ?? DEFAULT_HALO_RAYS;
  const haloRadius = options.haloRadius ?? VISION_HALO_RADIUS;
  const coneRange = options.coneRange ?? VISION_FLASHLIGHT_RANGE;
  const coneFov = options.coneFovRad ?? flashlightFovRad();
  const step = options.rayStep ?? 0.05;

  const coneRays: RayHit[] = [];
  const half = coneFov / 2;
  for (let i = 0; i < coneRayCount; i += 1) {
    const t = coneRayCount === 1 ? 0.5 : i / (coneRayCount - 1);
    const angle = facing - half + t * coneFov;
    coneRays.push(castRay(map, origin, angle, coneRange, step));
  }

  const haloRays: RayHit[] = [];
  for (let i = 0; i < haloRayCount; i += 1) {
    const angle = (i / haloRayCount) * Math.PI * 2;
    haloRays.push(castRay(map, origin, angle, haloRadius, step));
  }

  return {
    coneRays,
    haloRays,
    rayCount: coneRays.length + haloRays.length,
    facing,
    origin: { ...origin },
  };
}

/** True if point lies inside the union of cone wedge samples and halo disk, with wall occlusion via rays. */
export function isPointLit(
  map: LabyrinthMap,
  origin: VisionPoint,
  facing: number,
  point: VisionPoint,
  options: VisionCastOptions = {},
): boolean {
  const haloRadius = options.haloRadius ?? VISION_HALO_RADIUS;
  const coneRange = options.coneRange ?? VISION_FLASHLIGHT_RANGE;
  const coneFov = options.coneFovRad ?? flashlightFovRad();
  const step = options.rayStep ?? 0.05;

  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  const dist = Math.hypot(dx, dy);
  if (dist > Math.max(haloRadius, coneRange) + 0.02) return false;
  if (dist < 1e-6) return true;

  const angle = Math.atan2(dy, dx);
  const hit = castRay(map, origin, angle, dist + 0.01, step);
  if (hit.hitWall && hit.distance < dist - 0.02) {
    const hitTx = Math.floor(hit.hitX);
    const hitTy = Math.floor(hit.hitY);
    const ptTx = Math.floor(point.x);
    const ptTy = Math.floor(point.y);
    if (hitTx !== ptTx || hitTy !== ptTy) return false;
  }

  if (dist <= haloRadius) return true;

  let delta = angle - facing;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  if (Math.abs(delta) <= coneFov / 2 && dist <= coneRange) return true;

  return false;
}

/**
 * Build a simple visibility polygon from ordered cone + wrap-around halo samples
 * suitable for canvas path filling (origin → ray endpoints → origin).
 */
export function visibilityPolygonFromRays(
  origin: VisionPoint,
  rays: readonly RayHit[],
): VisionPoint[] {
  const points: VisionPoint[] = [{ ...origin }];
  for (const ray of rays) {
    points.push({ x: ray.hitX, y: ray.hitY });
  }
  return points;
}

/** Normalize angle into (-π, π]. */
export function normalizeAngle(angle: number): number {
  let a = angle;
  while (a <= -Math.PI) a += Math.PI * 2;
  while (a > Math.PI) a -= Math.PI * 2;
  return a;
}
