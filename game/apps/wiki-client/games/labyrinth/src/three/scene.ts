import * as THREE from 'three';
import type { AdventureSession } from '@suite/core/labyrinth';
import { paintAdventureMinimap, type MazeRenderOpts } from '../render-maze';
import { createAssetKit } from './assets';
import { createIsoCamera } from './camera';
import { createEffects } from './effects';
import { createEntities } from './entities';
import { createEnvironment } from './environment';
import { createInteractions } from './interactions';
import { createLighting } from './lighting';
import { createWorld } from './world';

export type ThreeMazeRenderer = {
  resize: (w: number, h: number) => void;
  draw: (session: AdventureSession, opts: MazeRenderOpts) => void;
  dispose: () => void;
};

const MAX_DPR = 1.25;

export function probeWebGL(): boolean {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') ?? probe.getContext('webgl');
    if (!gl) return false;
    const lose = gl.getExtension('WEBGL_lose_context');
    lose?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function tryCreateThreeMazeRenderer(
  canvas: HTMLCanvasElement,
  minimap?: HTMLCanvasElement | null,
): ThreeMazeRenderer | null {
  if (!probeWebGL()) return null;
  try {
    return createThreeMazeRenderer(canvas, minimap);
  } catch {
    return null;
  }
}

export function createThreeMazeRenderer(
  canvas: HTMLCanvasElement,
  minimap?: HTMLCanvasElement | null,
): ThreeMazeRenderer {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    powerPreference: 'high-performance',
    stencil: false,
    depth: true,
    failIfMajorPerformanceCaveat: false,
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setClearColor(0x030508, 1);
  renderer.shadowMap.enabled = false;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x030508, 0.012);

  const assets = createAssetKit();
  const camera = createIsoCamera();
  const lighting = createLighting(scene);
  const world = createWorld(scene, assets);
  const environment = createEnvironment(scene, assets, world);
  const entities = createEntities(scene, assets);
  const interactions = createInteractions(scene, assets);
  const effects = createEffects(scene, assets);

  let cssW = 1;
  let cssH = 1;
  let lastNow = 0;
  let envKey = '';
  let started = false;
  let minimapFrame = 0;
  const minimapCtx = minimap?.getContext('2d') ?? null;

  const resize = (w: number, h: number) => {
    cssW = Math.max(1, Math.floor(w));
    cssH = Math.max(1, Math.floor(h));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
    renderer.setSize(cssW, cssH, false);
    camera.resize(cssW, cssH);
    if (minimap) {
      const mw = 220;
      const mh = 132;
      minimap.width = mw;
      minimap.height = mh;
    }
  };

  return {
    resize,
    draw(session, opts) {
      const now = opts.pulseMs;
      const dt = lastNow ? Math.min(0.05, Math.max(0.001, (now - lastNow) / 1000)) : 0.016;
      lastNow = now;
      if (!started) {
        camera.snap(session.player.position.x, session.player.position.y);
        started = true;
      }
      world.sync(session, opts);
      const nextEnv = `${session.unlockedPassageIds.join(',')}|${session.openDoorIds.join(',')}`;
      if (nextEnv !== envKey) {
        envKey = nextEnv;
        environment.rebuild(session, world.occupied());
      }
      environment.sync(session, opts);
      entities.sync(session, opts, opts.fx, dt, now);
      interactions.sync(session, opts, opts.fx, now);
      effects.sync(session, opts, opts.fx, entities.playerPos, now);
      lighting.sync(session, opts, entities.playerPos, now);
      camera.follow(session, opts, dt, now);

      const scanning = session.player.scan.active;
      const fogDensity = scanning ? (opts.reducedMotion ? 0.016 : 0.02) : opts.lowDarkness ? 0.008 : 0.014;
      if (scene.fog instanceof THREE.FogExp2) scene.fog.density = fogDensity;
      if (scene.fog) scene.fog.color.set('#030508');

      renderer.render(scene, camera.camera);

      minimapFrame += 1;
      if (minimap && minimapCtx && minimapFrame % 4 === 1) {
        minimapCtx.clearRect(0, 0, minimap.width, minimap.height);
        paintAdventureMinimap(minimapCtx, session, minimap.width, minimap.height, false);
      }
    },
    dispose() {
      lighting.dispose();
      world.dispose();
      environment.dispose();
      entities.dispose();
      interactions.dispose();
      effects.dispose();
      assets.dispose();
      renderer.dispose();
    },
  };
}
