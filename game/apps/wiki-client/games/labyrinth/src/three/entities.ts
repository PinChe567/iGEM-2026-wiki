import * as THREE from 'three';
import type { AdventureSession } from '@suite/core/labyrinth';
import { deathProgress, slashActive, type MazeFxState } from '../fx';
import { mazePointLit } from '../flashlight';
import type { MazeRenderOpts } from '../render-maze';
import { CORAL, CREAM, LIME, PURPLE } from '../art';
import type { AssetKit } from './assets';

const PLAYER_SCALE = 1.68;
const ENEMY_SCALE = 1.58;

type EnemyState = AdventureSession['enemies'][number];

type EnemyVisual = {
  id: string;
  root: THREE.Group;
  kind: EnemyState['kind'];
  mats: THREE.MeshLambertMaterial[];
};

export type EntityLayer = {
  playerPos: THREE.Vector3;
  sync: (session: AdventureSession, opts: MazeRenderOpts, fx: MazeFxState | undefined, dt: number, now: number) => void;
  dispose: () => void;
};

export function createEntities(scene: THREE.Scene, assets: AssetKit): EntityLayer {
  const player = buildPlayer(assets);
  scene.add(player.root);
  const visual = new THREE.Vector3(12, 0, 8);
  const pool: EnemyVisual[] = [];

  const syncPlayer = (session: AdventureSession, opts: MazeRenderOpts, fx: MazeFxState | undefined, dt: number, now: number) => {
    const px = session.player.position.x + (fx && now < fx.knockUntil ? fx.knockX : 0);
    const pz = session.player.position.y + (fx && now < fx.knockUntil ? fx.knockY : 0);
    const walking =
      Math.hypot(
        session.player.position.x - session.player.prevPosition.x,
        session.player.position.y - session.player.prevPosition.y,
      ) > 0.002;
    if (opts.reducedMotion || !walking) {
      visual.set(px, 0, pz);
    } else {
      const k = 1 - Math.exp(-dt * 28);
      visual.x += (px - visual.x) * k;
      visual.z += (pz - visual.z) * k;
    }
    player.root.position.set(visual.x, 0, visual.z);
    player.root.rotation.y = -session.player.facing;
    const t = now / 1000;
    const bob = opts.reducedMotion || !walking ? 0 : Math.sin(t * 11) * 0.018;
    player.body.position.y = 0.42 + bob;
    const stride = opts.reducedMotion || !walking ? 0 : Math.sin(t * 11) * 0.42;
    player.leftLeg.rotation.x = stride;
    player.rightLeg.rotation.x = -stride;
    player.leftArm.rotation.x = walking ? -stride * 0.55 : Math.sin(t * 2.3) * 0.06;
    const attacking = Boolean(fx && slashActive(fx, now));
    player.rightArm.rotation.x = attacking ? -1.15 : walking ? stride * 0.55 : 0.08;
    player.slash.visible = attacking;
    if (attacking && fx) {
      const age = 1 - (fx.slashUntil - now) / 220;
      player.slash.rotation.y = -0.4 + age * 1.4;
      player.slashMat.opacity = opts.reducedMotion ? 0.45 : 0.75 * (1 - age);
    }
    const hit = Boolean(fx && now < fx.hitFlashUntil);
    const invuln = session.player.invulnerableUntilMs > session.elapsedMs;
    for (const mat of player.mats) {
      mat.emissive.set(hit ? CORAL : invuln ? LIME : '#000000');
      mat.emissiveIntensity = hit ? 0.9 : invuln ? 0.22 : 0;
    }
    player.shadow.scale.setScalar(walking ? 0.92 : 1);
  };

  const acquire = (enemy: EnemyState): EnemyVisual => {
    let vis = pool.find((item) => item.id === enemy.id);
    if (vis) return vis;
    vis = buildEnemy(assets, enemy.kind);
    vis.id = enemy.id;
    vis.kind = enemy.kind;
    scene.add(vis.root);
    pool.push(vis);
    return vis;
  };

  return {
    playerPos: visual,
    sync(session, opts, fx, dt, now) {
      syncPlayer(session, opts, fx, dt, now);
      const seen = new Set<string>();
      for (const enemy of session.enemies) {
        const dying = fx?.deaths.get(enemy.id);
        if (enemy.defeated && !dying) continue;
        const vis = acquire(enemy);
        seen.add(enemy.id);
        vis.root.visible = true;
        const t = now / 1000;
        vis.root.position.set(enemy.position.x, 0, enemy.position.y);
        vis.root.rotation.y = -enemy.facing;
        const bob = opts.reducedMotion ? 0 : Math.sin(t * 3.4 + enemy.position.x) * 0.04;
        vis.root.position.y = enemy.kind === 'noiseWisp' ? 0.28 + bob : 0;
        const lit = mazePointLit(session, enemy.position, opts.lowDarkness);
        if (dying) {
          const p = deathProgress(dying, now, opts.reducedMotion);
          vis.root.scale.setScalar(ENEMY_SCALE * (1 + p * 0.4));
          vis.root.traverse((node: THREE.Object3D) => {
            if (node instanceof THREE.Mesh && node.material instanceof THREE.MeshLambertMaterial) {
              node.material.transparent = true;
              node.material.opacity = 1 - p;
            }
          });
        } else {
          const bloom = enemy.kind === 'noiseBloom' ? 1.15 + (enemy.phase - 1) * 0.2 : 1;
          vis.root.scale.setScalar(ENEMY_SCALE * bloom);
        }
        const flash = session.lastFeedback.hitEnemyIds.includes(enemy.id);
        for (const mat of vis.mats) {
          mat.emissive.set(flash ? CORAL : enemy.revealed ? LIME : '#000000');
          mat.emissiveIntensity = flash ? 0.8 : enemy.revealed && session.player.scan.active ? 0.35 : 0;
        }
        vis.root.visible =
          lit && !(enemy.kind === 'mimicSpore' && enemy.disguised && !session.player.scan.active);
      }
      for (const vis of pool) {
        if (!seen.has(vis.id)) vis.root.visible = false;
      }
    },
    dispose() {
      scene.remove(player.root);
      for (const vis of pool) scene.remove(vis.root);
    },
  };
}

function buildPlayer(assets: AssetKit) {
  const glb = assets.getGlb('player');
  const root = new THREE.Group();
  const mats: THREE.MeshLambertMaterial[] = [];
  const mat = (hex: string) => {
    const m = assets.lambert(hex);
    mats.push(m);
    return m;
  };
  if (glb) {
    const clone = glb.clone(true);
    root.add(clone);
  }
  const body = new THREE.Group();
  const torso = new THREE.Mesh(assets.sharedGeo('p-torso', () => new THREE.BoxGeometry(0.28, 0.38, 0.2)), mat('#2a3040'));
  const vest = new THREE.Mesh(assets.sharedGeo('p-vest', () => new THREE.BoxGeometry(0.3, 0.16, 0.22)), mat(CREAM));
  vest.position.y = -0.04;
  const head = new THREE.Mesh(assets.sharedGeo('p-head', () => new THREE.SphereGeometry(0.12, 10, 8)), mat('#d8d0c0'));
  head.position.y = 0.28;
  const visor = new THREE.Mesh(assets.sharedGeo('p-visor', () => new THREE.BoxGeometry(0.16, 0.05, 0.06)), mat(LIME));
  visor.position.set(0.08, 0.28, 0);
  const leftArm = new THREE.Mesh(assets.sharedGeo('p-arm', () => new THREE.BoxGeometry(0.07, 0.28, 0.07)), mat('#2a3040'));
  const rightArm = leftArm.clone();
  leftArm.position.set(0, -0.02, 0.18);
  rightArm.position.set(0, -0.02, -0.18);
  const leftLeg = new THREE.Mesh(assets.sharedGeo('p-leg', () => new THREE.BoxGeometry(0.08, 0.26, 0.09)), mat('#1c2433'));
  const rightLeg = leftLeg.clone();
  leftLeg.position.set(0, -0.32, 0.07);
  rightLeg.position.set(0, -0.32, -0.07);
  const footL = new THREE.Mesh(assets.sharedGeo('p-foot', () => new THREE.BoxGeometry(0.14, 0.05, 0.1)), mat('#121826'));
  const footR = footL.clone();
  footL.position.set(0.04, -0.14, 0);
  rightLeg.add(footR);
  footR.position.set(0.04, -0.14, 0);
  leftLeg.add(footL);
  body.add(torso, vest, head, visor, leftArm, rightArm);
  body.position.y = 0.42;
  const slashMat = assets.lambert(LIME, { transparent: true, opacity: 0.7, emissive: LIME, emissiveIntensity: 0.4 });
  const slash = new THREE.Mesh(assets.sharedGeo('p-slash', () => new THREE.TorusGeometry(0.42, 0.03, 6, 10, Math.PI * 0.7)), slashMat);
  slash.rotation.x = Math.PI / 2;
  slash.visible = false;
  const shadow = new THREE.Mesh(
    assets.sharedGeo('contact-shadow', () => new THREE.CircleGeometry(0.22, 12)),
    assets.lambert('#05070c', { transparent: true, opacity: 0.38 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  root.add(body, leftLeg, rightLeg, slash, shadow);
  leftLeg.position.y = 0.2;
  rightLeg.position.y = 0.2;
  root.scale.setScalar(PLAYER_SCALE);
  return { root, body, leftArm, rightArm, leftLeg, rightLeg, slash, slashMat, shadow, mats };
}

function buildEnemy(assets: AssetKit, kind: EnemyState['kind']): EnemyVisual {
  const root = new THREE.Group();
  const mats: THREE.MeshLambertMaterial[] = [];
  const mat = (hex: string, opts?: Parameters<AssetKit['lambert']>[1]) => {
    const m = assets.lambert(hex, opts);
    mats.push(m);
    return m;
  };
  const glb = assets.getGlb(kind === 'vineCrawler' ? 'vineCrawler' : kind === 'noiseWisp' ? 'noiseWisp' : kind === 'noiseBloom' ? 'noiseBloom' : kind === 'mimicSpore' ? 'mimicSpore' : 'sporeling');
  if (glb) root.add(glb.clone(true));
  const shadow = new THREE.Mesh(
    assets.sharedGeo('contact-shadow', () => new THREE.CircleGeometry(0.22, 12)),
    assets.lambert('#05070c', { transparent: true, opacity: 0.32 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  if (kind === 'vineCrawler') {
    const body = new THREE.Mesh(assets.sharedGeo('vine-body', () => new THREE.BoxGeometry(0.22, 0.18, 0.48)), mat('#3f6b48'));
    body.position.y = 0.16;
    const head = new THREE.Mesh(assets.sharedGeo('vine-head', () => new THREE.SphereGeometry(0.12, 8, 6)), mat('#2f6b3c'));
    head.position.set(0.16, 0.2, 0);
    root.add(body, head, shadow);
  } else if (kind === 'noiseWisp') {
    const core = new THREE.Mesh(assets.sharedGeo('wisp', () => new THREE.SphereGeometry(0.16, 10, 8)), mat(PURPLE, { transparent: true, opacity: 0.72, emissive: PURPLE, emissiveIntensity: 0.4 }));
    core.position.y = 0.34;
    root.add(core);
  } else if (kind === 'noiseBloom') {
    const core = new THREE.Mesh(assets.sharedGeo('bloom', () => new THREE.SphereGeometry(0.28, 10, 8)), mat('#3a2a58', { emissive: PURPLE, emissiveIntensity: 0.25 }));
    core.position.y = 0.32;
    const petal = new THREE.Mesh(assets.sharedGeo('bloom-petal', () => new THREE.ConeGeometry(0.12, 0.28, 6)), mat('#5a3a78'));
    petal.position.set(0.22, 0.34, 0);
    root.add(core, petal, shadow);
  } else {
    const body = new THREE.Mesh(assets.sharedGeo('spore', () => new THREE.SphereGeometry(0.18, 10, 8)), mat(kind === 'mimicSpore' ? '#6a4a2c' : '#4a5a2c'));
    body.position.y = 0.2;
    const cap = new THREE.Mesh(assets.sharedGeo('spore-cap', () => new THREE.SphereGeometry(0.14, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2)), mat('#6a7c2e'));
    cap.position.y = 0.3;
    root.add(body, cap, shadow);
  }
  return { id: '', root, kind, mats };
}
