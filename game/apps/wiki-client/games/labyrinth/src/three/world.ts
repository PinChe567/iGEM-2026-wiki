import * as THREE from 'three';
import {
  roomIdAt,
  type AdventureRoomId,
  type AdventureSession,
} from '@suite/core/labyrinth';
import type { MazeRenderOpts } from '../render-maze';
import { FLASH_CONE, UNLIT_HEX, mazeCollision, mazeTileLit } from '../flashlight';
import { type AssetKit, wingColors } from './assets';

const dummy = new THREE.Object3D();
const tint = new THREE.Color();
const scanTint = new THREE.Color('#9b7dff');

export type WorldLayer = {
  group: THREE.Group;
  rebuild: (session: AdventureSession) => void;
  sync: (session: AdventureSession, opts: MazeRenderOpts) => void;
  occupied: () => Set<string>;
  dispose: () => void;
};

export function createWorld(scene: THREE.Scene, assets: AssetKit): WorldLayer {
  const group = new THREE.Group();
  group.name = 'world';
  scene.add(group);

  const floorGeo = assets.sharedGeo('floor', () => new THREE.BoxGeometry(1, 0.08, 1));
  const wallGeo = assets.sharedGeo('wall-block', () => new THREE.BoxGeometry(1.02, 1.62, 1.02));
  const mat = new THREE.MeshBasicMaterial({ fog: false });
  const floor = new THREE.InstancedMesh(floorGeo, mat, 400);
  const walls = new THREE.InstancedMesh(wallGeo, mat, 400);
  floor.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  walls.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  floor.frustumCulled = false;
  walls.frustumCulled = false;
  floor.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(400 * 3), 3);
  walls.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(400 * 3), 3);
  group.add(floor, walls);

  const groundMat = new THREE.MeshBasicMaterial({ color: UNLIT_HEX, fog: false });
  const ground = new THREE.Mesh(
    assets.sharedGeo('ground', () => new THREE.PlaneGeometry(48, 36)),
    groundMat,
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(12, -0.06, 8);
  group.add(ground);

  let floorCount = 0;
  let wallCount = 0;
  const floorTiles: Array<{ x: number; y: number; room: AdventureRoomId }> = [];
  const wallTiles: Array<{ x: number; y: number; room: AdventureRoomId }> = [];
  let occupied = new Set<string>();
  let layoutKey = '';
  const floorLitState = new Uint8Array(400).fill(255);
  const wallLitState = new Uint8Array(400).fill(255);
  const unlit = new THREE.Color(UNLIT_HEX);

  const rebuild = (session: AdventureSession) => {
    const geo = mazeCollision(session);
    const nextKey = `${geo.width}x${geo.height}:${session.unlockedPassageIds.join(',')}`;
    if (nextKey === layoutKey && floorCount + wallCount > 0) return;
    layoutKey = nextKey;
    occupied = new Set(session.interactables.map((item) => `${item.tile.x},${item.tile.y}`));
    floorTiles.length = 0;
    wallTiles.length = 0;
    floorCount = 0;
    wallCount = 0;

    for (let y = 0; y < geo.height; y += 1) {
      for (let x = 0; x < geo.width; x += 1) {
        const blocked = geo.collision[y * geo.width + x] === true;
        const room = roomIdAt(x, y);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        if (blocked) {
          dummy.position.set(x + 0.5, 0.81, y + 0.5);
          dummy.updateMatrix();
          walls.setMatrixAt(wallCount, dummy.matrix);
          setInstanceColor(walls, wallCount, wingColors(room).wall);
          wallTiles.push({ x, y, room });
          wallCount += 1;
        } else {
          dummy.position.set(x + 0.5, 0.02, y + 0.5);
          dummy.updateMatrix();
          floor.setMatrixAt(floorCount, dummy.matrix);
          const pal = wingColors(room);
          setInstanceColor(floor, floorCount, (x + y) % 2 === 0 ? pal.floorA : pal.floorB);
          floorTiles.push({ x, y, room });
          floorCount += 1;
        }
      }
    }
    floor.count = floorCount;
    walls.count = wallCount;
    floor.instanceMatrix.needsUpdate = true;
    walls.instanceMatrix.needsUpdate = true;
    floorLitState.fill(255);
    wallLitState.fill(255);
  };

  return {
    group,
    rebuild,
    occupied: () => occupied,
    sync(session, opts) {
      rebuild(session);
      const scanning = session.player.scan.active;
      const px = session.player.position.x;
      const py = session.player.position.y;
      const reach2 = (FLASH_CONE + 0.85) * (FLASH_CONE + 0.85);
      const paint = (
        mesh: THREE.InstancedMesh,
        tiles: Array<{ x: number; y: number; room: AdventureRoomId }>,
        wall: boolean,
        prev: Uint8Array,
      ) => {
        let dirty = false;
        for (let i = 0; i < tiles.length; i += 1) {
          const tile = tiles[i]!;
          const dx = tile.x + 0.5 - px;
          const dy = tile.y + 0.5 - py;
          const nearby = dx * dx + dy * dy <= reach2;
          const lit = nearby && mazeTileLit(session, tile, wall, opts.lowDarkness);
          const flag = lit ? 1 : 0;
          if (prev[i] === flag && !(scanning && lit)) continue;
          prev[i] = flag;
          dirty = true;
          if (!lit && !opts.lowDarkness) {
            if (mesh.instanceColor) mesh.instanceColor.setXYZ(i, unlit.r, unlit.g, unlit.b);
            continue;
          }
          const pal = wingColors(tile.room);
          const hex = wall
            ? pal.wall
            : (tile.x + tile.y) % 2 === 0
              ? pal.floorA
              : pal.floorB;
          const shade = lit ? 1 : 0.38;
          tint.set(hex).multiplyScalar(shade);
          if (scanning && lit) tint.lerp(scanTint, 0.08);
          if (mesh.instanceColor) {
            mesh.instanceColor.setXYZ(i, tint.r, tint.g, tint.b);
          }
        }
        if (dirty && mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      };
      paint(floor, floorTiles, false, floorLitState);
      paint(walls, wallTiles, true, wallLitState);
    },
    dispose() {
      scene.remove(group);
      floor.dispose();
      walls.dispose();
      mat.dispose();
      groundMat.dispose();
    },
  };
}

function setInstanceColor(mesh: THREE.InstancedMesh, index: number, hex: string): void {
  if (!mesh.instanceColor) return;
  tint.set(hex);
  mesh.instanceColor.setXYZ(index, tint.r, tint.g, tint.b);
}

export function doorwayFacing(session: AdventureSession, x: number, y: number): number {
  const geo = mazeCollision(session);
  const open = (tx: number, ty: number) =>
    tx >= 0 && ty >= 0 && tx < geo.width && ty < geo.height && geo.collision[ty * geo.width + tx] !== true;
  const ns = open(x, y - 1) || open(x, y + 1);
  return ns ? 0 : Math.PI / 2;
}
