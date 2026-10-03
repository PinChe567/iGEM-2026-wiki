import * as THREE from 'three';
import type { AdventureSession } from '@suite/core/labyrinth';
import type { MazeRenderOpts } from '../render-maze';

export type LightingRig = {
  hemi: THREE.HemisphereLight;
  key: THREE.DirectionalLight;
  fill: THREE.PointLight;
  scan: THREE.PointLight;
  sync: (session: AdventureSession, opts: MazeRenderOpts, player: THREE.Vector3, now: number) => void;
  dispose: () => void;
};

export function createLighting(scene: THREE.Scene): LightingRig {
  const hemi = new THREE.HemisphereLight(0xf0e6c8, 0x08080c, 0.04);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xf7f2e4, 0.04);
  key.position.set(2.4, 20, 11);
  key.castShadow = false;
  scene.add(key);

  const fill = new THREE.PointLight(0xfff1c8, 2.2, 1.7, 1.8);
  fill.castShadow = false;
  scene.add(fill);

  const scan = new THREE.PointLight(0x9b7dff, 0, 3.2, 1.8);
  scan.castShadow = false;
  scene.add(scan);

  return {
    hemi,
    key,
    fill,
    scan,
    sync(session, opts, player, now) {
      const scanning = session.player.scan.active;
      const open = opts.lowDarkness;
      hemi.intensity = open ? 0.42 : 0.03;
      key.intensity = open ? 0.22 : 0.02;
      fill.position.set(player.x, 1.2, player.z);
      fill.intensity = open ? 3.4 : 1.8;
      fill.distance = open ? 5.2 : 1.6;
      scan.position.set(player.x, 0.55, player.z);
      scan.intensity = scanning ? (opts.reducedMotion ? 0.35 : 0.7) : 0;
      void now;
    },
    dispose() {
      scene.remove(hemi, key, fill, scan);
    },
  };
}
