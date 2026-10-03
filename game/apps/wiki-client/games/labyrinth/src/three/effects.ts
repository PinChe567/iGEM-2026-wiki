import * as THREE from 'three';
import {
  canRejectNoise,
  currentObjective,
  visibleScentMarkers,
  type AdventureSession,
} from '@suite/core/labyrinth';
import { CREAM, CORAL, GOLD, LIME } from '../art';
import type { MazeFxState } from '../fx';
import type { MazeRenderOpts } from '../render-maze';
import { mazePointLit } from '../flashlight';
import { beaconStrength, scanTrailMs, scanTrailStrength } from '../nav-presentation';
import { drawOdorIcon, odorSpriteKey, type AssetKit } from './assets';

const PARTICLE_CAP = 120;

export type EffectLayer = {
  sync: (
    session: AdventureSession,
    opts: MazeRenderOpts,
    fx: MazeFxState | undefined,
    player: THREE.Vector3,
    now: number,
  ) => void;
  dispose: () => void;
};

export function createEffects(scene: THREE.Scene, assets: AssetKit): EffectLayer {
  const group = new THREE.Group();
  group.name = 'effects';
  scene.add(group);

  const ringMat = assets.lambert(LIME, { transparent: true, opacity: 0.7, emissive: LIME, emissiveIntensity: 0.5 });
  const rings: THREE.Mesh[] = [];
  for (let i = 0; i < 4; i += 1) {
    const mesh = new THREE.Mesh(assets.sharedGeo('scan-ring', () => new THREE.RingGeometry(0.92, 1, 48)), ringMat.clone());
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.04;
    mesh.visible = false;
    group.add(mesh);
    rings.push(mesh);
  }

  const positions = new Float32Array(PARTICLE_CAP * 3);
  const colors = new Float32Array(PARTICLE_CAP * 3);
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const pMat = new THREE.PointsMaterial({ size: 0.2, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false });
  const points = new THREE.Points(pGeo, pMat);
  group.add(points);

  const markers = new Map<string, THREE.Sprite>();
  const objective = new THREE.Mesh(
    assets.sharedGeo('obj-ring', () => new THREE.RingGeometry(0.38, 0.46, 24)),
    assets.lambert(GOLD, { transparent: true, opacity: 0.85, emissive: GOLD, emissiveIntensity: 0.4 }),
  );
  objective.rotation.x = -Math.PI / 2;
  objective.position.y = 0.05;
  group.add(objective);

  const beaconMat = assets.lambert(LIME, { transparent: true, opacity: 0.28, emissive: LIME, emissiveIntensity: 0.45 });
  const beacon = new THREE.Mesh(assets.sharedGeo('beacon', () => new THREE.CylinderGeometry(0.05, 0.08, 2.4, 8)), beaconMat);
  beacon.position.y = 1.2;
  beacon.visible = false;
  group.add(beacon);

  let prevScan = false;
  let trailUntil = 0;
  const tint = new THREE.Color();

  const bloomCores: THREE.Mesh[] = [];
  for (let i = 0; i < 8; i += 1) {
    const core = new THREE.Mesh(
      assets.sharedGeo('false-core', () => new THREE.SphereGeometry(0.08, 8, 6)),
      assets.lambert(CORAL, { emissive: CORAL, emissiveIntensity: 0.5, transparent: true, opacity: 0.7 }),
    );
    core.visible = false;
    group.add(core);
    bloomCores.push(core);
  }

  return {
    sync(session, opts, fx, player, now) {
      const scanning = session.player.scan.active;
      for (const mesh of rings) mesh.visible = false;

      const marks = scanning || session.player.highlightedIds.length ? visibleScentMarkers(session) : [];
      const seen = new Set<string>();
      for (const mark of marks) {
        const key = odorSpriteKey(mark.odorId, mark.classified);
        let sprite = markers.get(mark.id);
        if (!sprite) {
          sprite = assets.labelSprite(key, (ctx, size) => drawOdorIcon(ctx, size, mark.odorId, mark.classified));
          group.add(sprite);
          markers.set(mark.id, sprite);
        }
        seen.add(mark.id);
        const markPos = { x: mark.tile.x + 0.5, y: mark.tile.y + 0.5 };
        sprite.visible = mazePointLit(session, markPos, opts.lowDarkness);
        const lift = opts.reducedMotion ? 0.55 : 0.5 + Math.sin(now / 280 + mark.tile.x) * 0.08;
        sprite.position.set(mark.tile.x + 0.5, 0.85 + lift * 0.2, mark.tile.y + 0.5);
        sprite.scale.setScalar(mark.classified ? 0.72 : 0.64);
      }
      for (const [id, sprite] of markers) {
        if (!seen.has(id)) sprite.visible = false;
      }

      let pCount = 0;
      const writeP = (x: number, y: number, z: number, hex: string) => {
        if (pCount >= PARTICLE_CAP) return;
        tint.set(hex);
        const i = pCount * 3;
        positions[i] = x;
        positions[i + 1] = y;
        positions[i + 2] = z;
        colors[i] = tint.r;
        colors[i + 1] = tint.g;
        colors[i + 2] = tint.b;
        pCount += 1;
      };
      if (scanning && !prevScan) trailUntil = now + scanTrailMs(session);
      prevScan = scanning;
      const trailOn = (scanning || now < trailUntil || opts.hintLevel >= 2) && !opts.reducedMotion;
      const trailPower = trailOn ? scanTrailStrength(session, opts.hintLevel) : 0;
      if (trailPower > 0.05) {
        const obj = currentObjective(session);
        const tx = obj.tile.x + 0.5;
        const tz = obj.tile.y + 0.5;
        const sx = player.x + Math.cos(session.player.facing) * 0.55;
        const sz = player.z + Math.sin(session.player.facing) * 0.55;
        const mx = (sx + tx) / 2 + Math.sin(tx + tz) * 1.4;
        const mz = (sz + tz) / 2 + Math.cos(tx) * 1.1;
        const n = Math.round((session.difficulty === 'junior' ? 22 : session.difficulty === 'standard' ? 14 : 8) * trailPower);
        for (let i = 0; i < n; i += 1) {
          const t = (i + 0.5) / n;
          const omt = 1 - t;
          const x = omt * omt * sx + 2 * omt * t * mx + t * t * tx;
          const z = omt * omt * sz + 2 * omt * t * mz + t * t * tz;
          const y = 0.12 + Math.sin(now / 280 + i) * 0.08;
          writeP(x, y, z, i % 2 === 0 ? LIME : CREAM);
        }
      }
      if (scanning && !opts.reducedMotion) {
        for (const mark of marks) {
          const swirl = (now / 400 + mark.tile.x) % (Math.PI * 2);
          writeP(
            mark.tile.x + 0.5 + Math.cos(swirl) * 0.28,
            0.25 + (mark.intensity ?? 1) * 0.2,
            mark.tile.y + 0.5 + Math.sin(swirl) * 0.28,
            mark.classified ? LIME : CREAM,
          );
        }
      }
      if (fx) {
        for (const p of fx.particles) {
          writeP(p.x, 0.2 + (1 - p.life) * 0.5, p.y, p.color);
        }
      }
      pGeo.setDrawRange(0, pCount);
      (pGeo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
      (pGeo.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;
      points.visible = pCount > 0;

      const obj = currentObjective(session);
      const column = beaconStrength(session, opts.hintLevel, scanning);
      beacon.visible = column > 0.04;
      if (beacon.visible) {
        beacon.position.set(obj.tile.x + 0.5, 1.2, obj.tile.y + 0.5);
        beaconMat.opacity = opts.reducedMotion ? column * 0.7 : column * (0.7 + 0.3 * Math.sin(now / 420));
      }
      if (opts.hintLevel >= 3) {
        objective.visible = true;
        objective.position.set(obj.tile.x + 0.5, 0.05, obj.tile.y + 0.5);
      } else {
        objective.visible = false;
      }

      let coreI = 0;
      const scanningNoise = scanning && !canRejectNoise(session);
      for (const enemy of session.enemies) {
        if (enemy.kind !== 'noiseWisp' && enemy.kind !== 'noiseBloom') continue;
        if (!scanningNoise) continue;
        for (const tile of enemy.falseMarkerTiles) {
          const mesh = bloomCores[coreI];
          if (!mesh) break;
          mesh.visible = true;
          mesh.position.set(tile.x + 0.5, 0.12, tile.y + 0.5);
          coreI += 1;
        }
      }
      for (let i = coreI; i < bloomCores.length; i += 1) bloomCores[i]!.visible = false;
    },
    dispose() {
      scene.remove(group);
      pGeo.dispose();
      pMat.dispose();
    },
  };
}
