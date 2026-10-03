import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { AdventureRoomId } from '@suite/core/labyrinth';
import { CREAM, CORAL, GOLD, LIME, PURPLE, WING } from '../art';

/** Placeholder kinds that later GLB files can replace without touching game logic. */
export type AssetKind =
  | 'floor'
  | 'wall'
  | 'pillar'
  | 'doorway'
  | 'crate'
  | 'shelf'
  | 'plant'
  | 'vine'
  | 'lab'
  | 'chest'
  | 'exitGate'
  | 'player'
  | 'sporeling'
  | 'vineCrawler'
  | 'noiseWisp'
  | 'mimicSpore'
  | 'noiseBloom';

/**
 * Local GLB URLs. Keep empty until models exist in `games/labyrinth/assets/models/`.
 * Example: player: new URL('../../assets/models/player.glb', import.meta.url).href
 */
export const GLB_URLS: Partial<Record<AssetKind, string>> = {};

export const HEX = {
  cream: CREAM,
  coral: CORAL,
  gold: GOLD,
  lime: LIME,
  purple: PURPLE,
  ink: '#211c2b',
  charcoal: '#121826',
  navy: '#0e141f',
  paper: '#f4efe0',
};

export function color(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

export function wingColors(room: AdventureRoomId) {
  return WING[room];
}

export type AssetKit = {
  getGlb: (kind: AssetKind) => THREE.Object3D | null;
  lambert: (hex: string, opts?: { emissive?: string; emissiveIntensity?: number; transparent?: boolean; opacity?: number }) => THREE.MeshLambertMaterial;
  sharedGeo: (name: string, make: () => THREE.BufferGeometry) => THREE.BufferGeometry;
  labelSprite: (key: string, draw: (ctx: CanvasRenderingContext2D, size: number) => void) => THREE.Sprite;
  dispose: () => void;
};

export function createAssetKit(): AssetKit {
  const loader = new GLTFLoader();
  const glb = new Map<AssetKind, THREE.Object3D>();
  const geos = new Map<string, THREE.BufferGeometry>();
  const mats: THREE.Material[] = [];
  const sprites = new Map<string, THREE.Sprite>();
  const textures: THREE.Texture[] = [];

  for (const [kind, url] of Object.entries(GLB_URLS) as Array<[AssetKind, string]>) {
    if (!url) continue;
    loader.load(
      url,
      (file: { scene: THREE.Object3D }) => {
        file.scene.traverse((node: THREE.Object3D) => {
          node.castShadow = false;
          node.receiveShadow = false;
        });
        glb.set(kind, file.scene);
      },
      undefined,
      () => {
        /* Procedural placeholders remain until a local GLB is present. */
      },
    );
  }

  const lambert: AssetKit['lambert'] = (hex, opts = {}) => {
    const mat = new THREE.MeshLambertMaterial({
      color: hex,
      emissive: opts.emissive ?? '#000000',
      emissiveIntensity: opts.emissiveIntensity ?? 0,
      transparent: opts.transparent ?? false,
      opacity: opts.opacity ?? 1,
      depthWrite: opts.transparent ? false : true,
    });
    mats.push(mat);
    return mat;
  };

  const sharedGeo: AssetKit['sharedGeo'] = (name, make) => {
    const hit = geos.get(name);
    if (hit) return hit;
    const geo = make();
    geos.set(name, geo);
    return geo;
  };

  const labelSprite: AssetKit['labelSprite'] = (key, draw) => {
    const hit = sprites.get(key);
    if (hit) return hit.clone();
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) draw(ctx, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    textures.push(tex);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
    mats.push(mat);
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(0.42, 0.42, 0.42);
    sprites.set(key, sprite);
    return sprite.clone();
  };

  return {
    getGlb: (kind) => glb.get(kind) ?? null,
    lambert,
    sharedGeo,
    labelSprite,
    dispose: () => {
      for (const geo of geos.values()) geo.dispose();
      for (const mat of mats) mat.dispose();
      for (const tex of textures) tex.dispose();
      geos.clear();
      mats.length = 0;
      textures.length = 0;
      sprites.clear();
      glb.clear();
    },
  };
}

export function odorSpriteKey(odorId: string | undefined, classified: boolean): string {
  if (!classified || !odorId) return 'mark-unknown';
  return `mark-${odorId}`;
}

export function drawOdorIcon(ctx: CanvasRenderingContext2D, size: number, odorId: string | undefined, classified: boolean): void {
  ctx.clearRect(0, 0, size, size);
  ctx.translate(size / 2, size / 2);
  if (!classified || !odorId) {
    ctx.fillStyle = CREAM;
    ctx.font = `700 ${Math.round(size * 0.62)}px ui-sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', 0, 2);
    return;
  }
  const s = size * 0.22;
  if (odorId === 'coffee') {
    ctx.fillStyle = '#8b5a2b';
    ctx.beginPath();
    ctx.ellipse(0, 0, s, s * 0.7, 0.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (odorId === 'rose') {
    ctx.fillStyle = CORAL;
    ctx.beginPath();
    ctx.arc(0, 0, s, 0, Math.PI * 2);
    ctx.fill();
  } else if (odorId === 'mint') {
    ctx.strokeStyle = LIME;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.quadraticCurveTo(s, 0, 0, s);
    ctx.quadraticCurveTo(-s, 0, 0, -s);
    ctx.stroke();
  } else if (odorId === 'lemon') {
    ctx.fillStyle = LIME;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.9, s * 1.15, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (odorId === 'pine') {
    ctx.fillStyle = '#3f8a4c';
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s, s);
    ctx.lineTo(-s, s);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillStyle = PURPLE;
    ctx.beginPath();
    ctx.arc(0, 0, s, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function hash2(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export function tileWorld(x: number, y: number, yUp = 0): THREE.Vector3 {
  return new THREE.Vector3(x + 0.5, yUp, y + 0.5);
}
