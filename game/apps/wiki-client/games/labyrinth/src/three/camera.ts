import * as THREE from 'three';
import type { AdventureSession } from '@suite/core/labyrinth';
import type { MazeRenderOpts } from '../render-maze';

/**
 * High, axis-aligned camera from the south.
 * Screen up = W, down = S, left = A, right = D.
 * Locked to the player so the view does not drift or pan.
 */
const OFFSET = new THREE.Vector3(0, 12.4, 2.35);
const BASE_VIEW = 3.45;

export type IsoCamera = {
  camera: THREE.OrthographicCamera;
  snap: (x: number, z: number) => void;
  resize: (w: number, h: number) => void;
  follow: (session: AdventureSession, opts: MazeRenderOpts, dt: number, now: number) => void;
};

export function createIsoCamera(): IsoCamera {
  const camera = new THREE.OrthographicCamera(-8, 8, 8, -8, 0.1, 80);
  camera.up.set(0, 1, 0);

  const look = new THREE.Vector3(12, 0, 8);
  let aspect = 1;

  const apply = () => {
    camera.left = -BASE_VIEW * aspect;
    camera.right = BASE_VIEW * aspect;
    camera.top = BASE_VIEW;
    camera.bottom = -BASE_VIEW;
    camera.position.set(look.x + OFFSET.x, look.y + OFFSET.y, look.z + OFFSET.z);
    camera.lookAt(look);
    camera.updateProjectionMatrix();
  };

  return {
    camera,
    snap(x, z) {
      look.set(x, 0, z);
      apply();
    },
    resize(w, h) {
      aspect = Math.max(0.5, w / Math.max(1, h));
      apply();
    },
    follow(session, _opts, _dt, _now) {
      look.set(session.player.position.x, 0, session.player.position.y);
      apply();
    },
  };
}
