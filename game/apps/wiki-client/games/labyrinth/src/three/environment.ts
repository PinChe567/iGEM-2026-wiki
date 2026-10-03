import * as THREE from 'three';
import { roomIdAt, type AdventureRoomId, type AdventureSession } from '@suite/core/labyrinth';
import type { MazeRenderOpts } from '../render-maze';
import { mazePointLit } from '../flashlight';
import type { AssetKit } from './assets';
import { hash2 } from './assets';
import { doorwayFacing, type WorldLayer } from './world';

export type EnvironmentLayer = {
  rebuild: (session: AdventureSession, occupied: Set<string>) => void;
  sync: (session: AdventureSession, opts: MazeRenderOpts) => void;
  dispose: () => void;
};

export function createEnvironment(scene: THREE.Scene, assets: AssetKit, world: WorldLayer): EnvironmentLayer {
  const group = new THREE.Group();
  group.name = 'environment';
  scene.add(group);
  const props: Array<{ mesh: THREE.Object3D; x: number; y: number }> = [];

  const add = (mesh: THREE.Object3D, x: number, y: number, rotY = 0) => {
    mesh.position.set(x + 0.5, 0, y + 0.5);
    mesh.rotation.y = rotY;
    group.add(mesh);
    props.push({ mesh, x, y });
  };

  return {
    rebuild(session, occupied) {
      for (const prop of props) group.remove(prop.mesh);
      props.length = 0;
      void world;

      const w = session.map.width;
      const h = session.map.height;
      for (let y = 0; y < h; y += 1) {
        for (let x = 0; x < w; x += 1) {
          const idx = y * w + x;
          if (session.map.collision[idx]) continue;
          if (occupied.has(`${x},${y}`)) continue;
          const room = roomIdAt(x, y);
          const n = hash2(x * 1.7, y * 2.1);
          if (openNeighborCount(session, x, y) >= 3) placeRoomProp(assets, room, n, x, y, add);
        }
      }

      for (const item of session.interactables) {
        if (item.kind !== 'scentGate' && item.kind !== 'scentLock') continue;
        const open = session.openDoorIds.includes(item.id) || session.unlockedPassageIds.includes(item.id);
        if (!open && session.map.collision[item.tile.y * session.map.width + item.tile.x]) continue;
        add(makeDoorway(assets, roomIdAt(item.tile.x, item.tile.y), open), item.tile.x, item.tile.y, doorwayFacing(session, item.tile.x, item.tile.y));
      }
    },
    sync(session, opts) {
      for (const prop of props) {
        prop.mesh.visible = mazePointLit(session, { x: prop.x + 0.5, y: prop.y + 0.5 }, opts.lowDarkness);
      }
    },
    dispose() {
      scene.remove(group);
    },
  };
}

function openNeighborCount(session: AdventureSession, x: number, y: number): number {
  const w = session.map.width;
  const open = (tx: number, ty: number) => {
    if (tx < 0 || ty < 0 || tx >= w || ty >= session.map.height) return false;
    return session.map.collision[ty * w + tx] !== true;
  };
  return Number(open(x + 1, y)) + Number(open(x - 1, y)) + Number(open(x, y + 1)) + Number(open(x, y - 1));
}

function placeRoomProp(
  assets: AssetKit,
  room: AdventureRoomId,
  n: number,
  x: number,
  y: number,
  add: (mesh: THREE.Object3D, x: number, y: number, rotY?: number) => void,
): void {
  if (room === 'storage') {
    if (n > 0.86) add(makeCrate(assets), x, y, n * Math.PI);
    else if (n > 0.74) add(makeSack(assets), x, y);
  } else if (room === 'greenhouse') {
    if (n > 0.84) add(makePlant(assets), x, y);
  } else if (room === 'signal') {
    if (n > 0.86) add(makeLab(assets), x, y, n > 0.93 ? Math.PI / 2 : 0);
  } else if (room === 'atrium') {
    if (n > 0.9) add(makePillar(assets, room), x, y);
  }
}

function useGlb(assets: AssetKit, kind: Parameters<AssetKit['getGlb']>[0]): THREE.Object3D | null {
  const src = assets.getGlb(kind);
  return src ? src.clone(true) : null;
}

function makeCrate(assets: AssetKit): THREE.Object3D {
  const glb = useGlb(assets, 'crate');
  if (glb) return glb;
  const g = new THREE.Group();
  const box = new THREE.Mesh(assets.sharedGeo('crate', () => new THREE.BoxGeometry(0.42, 0.38, 0.42)), assets.lambert('#6a4a2c'));
  box.position.y = 0.2;
  const lid = new THREE.Mesh(assets.sharedGeo('crate-lid', () => new THREE.BoxGeometry(0.44, 0.05, 0.44)), assets.lambert('#8a6136'));
  lid.position.y = 0.4;
  g.add(box, lid);
  return g;
}

function makeSack(assets: AssetKit): THREE.Object3D {
  const g = new THREE.Group();
  const bag = new THREE.Mesh(assets.sharedGeo('sack', () => new THREE.SphereGeometry(0.16, 8, 6)), assets.lambert('#8b5a2b'));
  bag.position.y = 0.16;
  bag.scale.set(1, 0.85, 1.1);
  g.add(bag);
  return g;
}

function makePlant(assets: AssetKit): THREE.Object3D {
  const glb = useGlb(assets, 'plant');
  if (glb) return glb;
  const g = new THREE.Group();
  const pot = new THREE.Mesh(assets.sharedGeo('pot', () => new THREE.CylinderGeometry(0.1, 0.12, 0.12, 8)), assets.lambert('#3a2e24'));
  pot.position.y = 0.06;
  const leaf = new THREE.Mesh(assets.sharedGeo('leaf', () => new THREE.ConeGeometry(0.16, 0.42, 6)), assets.lambert('#3f6b48'));
  leaf.position.y = 0.36;
  g.add(pot, leaf);
  return g;
}

function makeLab(assets: AssetKit): THREE.Object3D {
  const glb = useGlb(assets, 'lab');
  if (glb) return glb;
  const g = new THREE.Group();
  const bench = new THREE.Mesh(assets.sharedGeo('lab-bench', () => new THREE.BoxGeometry(0.62, 0.28, 0.36)), assets.lambert('#242c40'));
  bench.position.y = 0.16;
  const scope = new THREE.Mesh(assets.sharedGeo('lab-scope', () => new THREE.CylinderGeometry(0.05, 0.05, 0.28, 8)), assets.lambert('#3a4460', { emissive: '#cde76d', emissiveIntensity: 0.35 }));
  scope.position.set(-0.12, 0.42, 0);
  const vial = new THREE.Mesh(assets.sharedGeo('lab-vial', () => new THREE.CylinderGeometry(0.04, 0.04, 0.16, 8)), assets.lambert('#9b7dff', { emissive: '#7655e8', emissiveIntensity: 0.28 }));
  vial.position.set(0.16, 0.38, 0.04);
  g.add(bench, scope, vial);
  return g;
}

function makePillar(assets: AssetKit, room: AdventureRoomId): THREE.Object3D {
  const glb = useGlb(assets, 'pillar');
  if (glb) return glb;
  const hex = room === 'atrium' ? '#5a6a90' : '#3a4a48';
  const g = new THREE.Group();
  const col = new THREE.Mesh(assets.sharedGeo('pillar', () => new THREE.CylinderGeometry(0.14, 0.16, 1.35, 8)), assets.lambert(hex));
  col.position.y = 0.68;
  const cap = new THREE.Mesh(assets.sharedGeo('pillar-cap', () => new THREE.BoxGeometry(0.38, 0.08, 0.38)), assets.lambert('#cbb79a'));
  cap.position.y = 1.34;
  g.add(col, cap);
  return g;
}

function makeDoorway(assets: AssetKit, room: AdventureRoomId, open: boolean): THREE.Object3D {
  const glb = useGlb(assets, 'doorway');
  if (glb) return glb;
  const pal = room === 'signal' ? '#4a5a78' : '#5a6a90';
  const g = new THREE.Group();
  const postL = new THREE.Mesh(assets.sharedGeo('door-post', () => new THREE.BoxGeometry(0.12, 1.15, 0.12)), assets.lambert(pal));
  const postR = postL.clone();
  postL.position.set(-0.38, 0.58, 0);
  postR.position.set(0.38, 0.58, 0);
  const lintel = new THREE.Mesh(assets.sharedGeo('door-lintel', () => new THREE.BoxGeometry(0.9, 0.12, 0.14)), assets.lambert(open ? '#e6c56a' : pal));
  lintel.position.y = 1.18;
  g.add(postL, postR, lintel);
  return g;
}
