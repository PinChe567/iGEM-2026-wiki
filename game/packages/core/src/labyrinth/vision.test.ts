import { describe, expect, it } from 'vitest';
import { MAP_V1 } from './map/load';
import {
  VISION_FLASHLIGHT_FOV_DEG,
  VISION_FLASHLIGHT_RANGE,
  VISION_HALO_RADIUS,
  castRay,
  castVisibility,
  isPointLit,
  normalizeAngle,
} from './vision';

describe('labyrinth vision geometry', () => {
  it('exports the product vision constants', () => {
    expect(VISION_HALO_RADIUS).toBe(0.8);
    expect(VISION_FLASHLIGHT_RANGE).toBe(7);
    expect(VISION_FLASHLIGHT_FOV_DEG).toBe(64);
  });

  it('stops rays at walls (does not pass through)', () => {
    // Standing in open floor south of gate row; shoot north into wall cluster near gates.
    const origin = { x: 3.5, y: 6.5 };
    const up = castRay(MAP_V1, origin, -Math.PI / 2, 10);
    expect(up.hitWall).toBe(true);
    expect(up.distance).toBeLessThan(6);

    // Ray along open corridor east should travel farther than a blocked north ray.
    const east = castRay(MAP_V1, origin, 0, 10);
    expect(east.distance).toBeGreaterThan(up.distance);
  });

  it('does not light points behind walls even within range', () => {
    // (10,5) is a solid wall between gates B and C — north of that wall is occluded.
    const origin = { x: 10.5, y: 6.5 };
    const behindSolid = { x: 10.5, y: 4.5 };
    expect(isPointLit(MAP_V1, origin, -Math.PI / 2, behindSolid)).toBe(false);

    // Open floor just in front of the player (same corridor) stays lit.
    const ahead = { x: 10.5, y: 6.15 };
    expect(isPointLit(MAP_V1, origin, -Math.PI / 2, ahead)).toBe(true);
  });

  it('halo lights nearby points but not far points outside cone behind player', () => {
    const origin = { x: 10.5, y: 6.5 };
    const facing = 0; // east
    const near = { x: 10.5 + 0.5, y: 6.5 };
    expect(isPointLit(MAP_V1, origin, facing, near)).toBe(true);

    const behindFar = { x: 10.5 - 3, y: 6.5 };
    expect(isPointLit(MAP_V1, origin, facing, behindFar)).toBe(false);
  });

  it('lights the wall face the flashlight hits', () => {
    const origin = { x: 3.5, y: 6.5 };
    const facing = -Math.PI / 2;
    const wallHit = castRay(MAP_V1, origin, facing, 10);
    expect(wallHit.hitWall).toBe(true);
    const wallPoint = { x: Math.floor(wallHit.hitX) + 0.5, y: Math.floor(wallHit.hitY) + 0.5 };
    expect(
      isPointLit(MAP_V1, origin, facing, wallPoint, { haloRadius: 8, coneRange: 10 }),
    ).toBe(true);
  });

  it('castVisibility reports ray counts and cone within FOV', () => {
    const result = castVisibility(MAP_V1, { x: 10.5, y: 6.5 }, 0, {
      coneRayCount: 20,
      haloRayCount: 12,
    });
    expect(result.rayCount).toBe(32);
    expect(result.coneRays).toHaveLength(20);
    const half = ((VISION_FLASHLIGHT_FOV_DEG / 2) * Math.PI) / 180;
    for (const ray of result.coneRays) {
      const delta = Math.abs(normalizeAngle(ray.angle - result.facing));
      expect(delta).toBeLessThanOrEqual(half + 1e-6);
    }
  });
});
