import * as THREE from 'three';
import {
  ADVENTURE_SEAL_IDS,
  canRejectNoise,
  canSeeTrailIntensity,
  findInteractionTarget,
  type AdventureSession,
} from '@suite/core/labyrinth';
import { chestProgress, dissolveProgress, type MazeFxState } from '../fx';
import { mazePointLit } from '../flashlight';
import { CREAM, CORAL, GOLD, LIME, PURPLE } from '../art';
import type { MazeRenderOpts } from '../render-maze';
import type { AssetKit } from './assets';

type Interactable = AdventureSession['interactables'][number];

export type InteractionLayer = {
  sync: (session: AdventureSession, opts: MazeRenderOpts, fx: MazeFxState | undefined, now: number) => void;
  dispose: () => void;
};

type ItemVisual = {
  id: string;
  kind: Interactable['kind'];
  root: THREE.Group;
  glow: THREE.MeshLambertMaterial[];
};

export function createInteractions(scene: THREE.Scene, assets: AssetKit): InteractionLayer {
  const group = new THREE.Group();
  group.name = 'interactables';
  scene.add(group);
  const items = new Map<string, ItemVisual>();
  const makeBadge = (key: string) => {
    const sprite = assets.labelSprite(`key-${key}`, (ctx, size) => {
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = 'rgba(18,24,36,0.9)';
      round(ctx, 4, 18, 56, 28, 8);
      ctx.fill();
      ctx.strokeStyle = LIME;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = CREAM;
      ctx.font = '700 18px ui-sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`[${key}]`, size / 2, size / 2 + 1);
    });
    sprite.scale.set(0.88, 0.56, 0.5);
    scene.add(sprite);
    sprite.visible = false;
    return sprite;
  };
  const badgeE = makeBadge('E');
  const badgeQ = makeBadge('Q');

  const get = (item: Interactable): ItemVisual => {
    const hit = items.get(item.id);
    if (hit) return hit;
    const vis = buildItem(assets, item);
    group.add(vis.root);
    items.set(item.id, vis);
    return vis;
  };

  return {
    sync(session, opts, fx, now) {
      const scanning = session.player.scan.active;
      const seen = new Set<string>();
      for (const item of session.interactables) {
        const vis = get(item);
        seen.add(item.id);
        const center = itemCenter(item);
        const lit = mazePointLit(session, center, opts.lowDarkness);
        vis.root.visible = shouldShow(session, item) && lit;
        vis.root.position.set(item.tile.x + 0.5, 0, item.tile.y + 0.5);
        const highlighted = session.player.highlightedIds.includes(item.id);
        const dissolve = fx?.dissolves.get(item.id);
        const base = itemBaseScale(item.kind);
        if (dissolve) {
          const p = dissolveProgress(dissolve, now, opts.reducedMotion);
          vis.root.scale.setScalar(Math.max(0.05, (1 - p) * base));
        } else {
          vis.root.scale.setScalar(base);
        }
        if ((item.kind === 'chest' || item.kind === 'hiddenChest') && vis.root.userData.lid instanceof THREE.Object3D) {
          const opened = session.player.openedChestIds.includes(item.id);
          const anim = fx?.chests.get(item.id);
          const p = chestProgress(anim, now, opts.reducedMotion);
          const lid = vis.root.userData.lid as THREE.Object3D;
          lid.rotation.x = opened || p > 0.18 ? -1.1 * (opened ? 1 : Math.min(1, (p - 0.18) / 0.3)) : 0;
          if (anim?.phase === 'shake' && !opts.reducedMotion) vis.root.position.x += Math.sin(now / 18) * 0.04;
        }
        if (item.kind === 'exit') {
          const slots = vis.root.userData.seals as THREE.MeshLambertMaterial[] | undefined;
          if (slots) {
            ADVENTURE_SEAL_IDS.forEach((id, i) => {
              const on = session.player.restoredSealIds.includes(id);
              const mat = slots[i];
              if (!mat) return;
              mat.emissive.set(on ? LIME : '#1a2218');
              mat.emissiveIntensity = on ? 0.85 : 0.04;
              mat.color.set(on ? LIME : '#2a3040');
            });
          }
        }
        if (item.kind === 'exitSeal') {
          const restored = session.player.restoredSealIds.includes(item.sealId ?? 'storage');
          for (const mat of vis.glow) {
            mat.emissive.set(restored ? GOLD : '#445');
            mat.emissiveIntensity = restored ? 0.45 : 0.05;
          }
        }
        if (item.kind === 'coffeePile') {
          for (const mat of vis.glow) {
            mat.color.set(highlighted ? (item.trueTarget ? LIME : '#8b5a2b') : '#6a4420');
          }
        }
        const outline = highlighted || (scanning && (item.kind === 'odorSample' || item.kind === 'decayBarrier' || item.kind === 'thornWall' || item.kind === 'noisyField'));
        for (const mat of vis.glow) {
          if (item.kind === 'noisyField' && scanning && !canRejectNoise(session)) {
            mat.emissive.set(CORAL);
            mat.emissiveIntensity = 0.45;
          } else if (outline) {
            mat.emissive.set(item.kind === 'noisyField' ? CORAL : LIME);
            mat.emissiveIntensity = opts.highContrast ? 0.7 : 0.42;
          } else if (item.kind !== 'exitSeal') {
            mat.emissiveIntensity = item.kind === 'modulePedestal' ? 0.28 : 0;
          }
        }
        if (item.kind === 'scentTrail' && canSeeTrailIntensity(session) && scanning) {
          for (const mat of vis.glow) {
            mat.emissive.set(LIME);
            mat.emissiveIntensity = item.trailIntensity ?? 0.55;
          }
        }
      }
      for (const [id, vis] of items) {
        if (!seen.has(id)) vis.root.visible = false;
      }
      const affordance = findInteractionTarget(session);
      badgeE.visible = false;
      badgeQ.visible = false;
      if (affordance.input !== 'none') {
        const tile = affordance.item ? itemCenter(affordance.item) : session.player.position;
        const badge = affordance.input === 'Q' ? badgeQ : badgeE;
        badge.visible = true;
        badge.position.set(tile.x, 1.25, tile.y);
      }
    },
    dispose() {
      scene.remove(group, badgeE, badgeQ);
    },
  };
}

function itemCenter(item: Interactable) {
  return { x: item.tile.x + 0.5, y: item.tile.y + 0.5 };
}

function itemBaseScale(kind: Interactable['kind']): number {
  if (kind === 'exit') return 1.18;
  if (kind === 'chest' || kind === 'hiddenChest') return 1.78;
  if (kind === 'odorSample') return 1.95;
  if (kind === 'scentTrail') return 2.2;
  if (kind === 'modulePedestal' || kind === 'exitSeal') return 1.72;
  return 1.55;
}

function shouldShow(session: AdventureSession, item: Interactable): boolean {
  if (item.kind === 'hiddenChest' || item.kind === 'hiddenPassage') {
    return session.unlockedPassageIds.includes(item.id) || session.player.scan.active;
  }
  if (item.kind === 'thornWall' || item.kind === 'decayBarrier') {
    return !session.unlockedPassageIds.includes(item.id);
  }
  if (item.kind === 'scentGate') return !session.openDoorIds.includes(item.id);
  return true;
}

function buildItem(assets: AssetKit, item: Interactable): ItemVisual {
  const root = new THREE.Group();
  const glow: THREE.MeshLambertMaterial[] = [];
  const mat = (hex: string, opts?: Parameters<AssetKit['lambert']>[1]) => {
    const m = assets.lambert(hex, opts);
    glow.push(m);
    return m;
  };
  if (item.kind === 'chest' || item.kind === 'hiddenChest') {
    const glb = assets.getGlb('chest');
    if (glb) {
      root.add(glb.clone(true));
    } else {
      const box = new THREE.Mesh(assets.sharedGeo('chest-box', () => new THREE.BoxGeometry(0.58, 0.34, 0.42)), mat('#6a4a2c'));
      box.position.y = 0.2;
      const lid = new THREE.Mesh(assets.sharedGeo('chest-lid', () => new THREE.BoxGeometry(0.6, 0.1, 0.44)), mat('#8a6136', { emissive: GOLD, emissiveIntensity: 0.08 }));
      lid.position.set(0, 0.38, -0.02);
      root.userData.lid = lid;
      root.add(box, lid);
    }
  } else if (item.kind === 'exit') {
    const glb = assets.getGlb('exitGate');
    if (glb) root.add(glb.clone(true));
    else {
      const posts = assets.lambert('#243044');
      const lime = assets.lambert(LIME, { emissive: LIME, emissiveIntensity: 0.35 });
      const left = new THREE.Mesh(assets.sharedGeo('exit-post', () => new THREE.BoxGeometry(0.22, 2.35, 0.28)), posts);
      const right = left.clone();
      left.position.set(-0.85, 1.18, 0.12);
      right.position.set(0.85, 1.18, 0.12);
      const lintel = new THREE.Mesh(assets.sharedGeo('exit-lintel', () => new THREE.BoxGeometry(1.95, 0.28, 0.32)), lime);
      lintel.position.set(0, 2.28, 0.12);
      const back = new THREE.Mesh(assets.sharedGeo('exit-back', () => new THREE.BoxGeometry(1.7, 2.05, 0.08)), assets.lambert('#121826', { emissive: '#1a2818', emissiveIntensity: 0.15 }));
      back.position.set(0, 1.05, -0.08);
      const seals: THREE.MeshLambertMaterial[] = [];
      for (let i = 0; i < 3; i += 1) {
        const slotMat = assets.lambert('#2a3040', { emissive: '#1a2218', emissiveIntensity: 0.04 });
        glow.push(slotMat);
        seals.push(slotMat);
        const slot = new THREE.Mesh(assets.sharedGeo('exit-slot', () => new THREE.SphereGeometry(0.11, 10, 8)), slotMat);
        slot.position.set(-0.5 + i * 0.5, 1.72, 0.22);
        root.add(slot);
      }
      root.userData.seals = seals;
      root.add(left, right, lintel, back);
    }
  } else if (item.kind === 'odorSample') {
    const orb = new THREE.Mesh(assets.sharedGeo('sample', () => new THREE.SphereGeometry(0.2, 10, 8)), mat('#7aa0c4', { emissive: LIME, emissiveIntensity: 0.15 }));
    orb.position.y = 0.28;
    root.add(orb);
  } else if (item.kind === 'modulePedestal') {
    const base = new THREE.Mesh(assets.sharedGeo('pedestal', () => new THREE.CylinderGeometry(0.16, 0.2, 0.18, 8)), mat('#2a3040'));
    base.position.y = 0.1;
    const gem = new THREE.Mesh(assets.sharedGeo('pedestal-gem', () => new THREE.SphereGeometry(0.1, 10, 8)), mat(PURPLE, { emissive: PURPLE, emissiveIntensity: 0.35 }));
    gem.position.y = 0.28;
    root.add(base, gem);
  } else if (item.kind === 'checkpoint') {
    const pole = new THREE.Mesh(assets.sharedGeo('flag-pole', () => new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6)), mat('#89a'));
    pole.position.y = 0.26;
    const flag = new THREE.Mesh(assets.sharedGeo('flag', () => new THREE.BoxGeometry(0.2, 0.12, 0.02)), mat(LIME));
    flag.position.set(0.12, 0.42, 0);
    root.add(pole, flag);
  } else if (item.kind === 'coffeePile') {
    const pile = new THREE.Mesh(assets.sharedGeo('pile', () => new THREE.SphereGeometry(0.18, 8, 6)), mat('#6a4420'));
    pile.position.y = 0.12;
    pile.scale.set(1.2, 0.6, 1);
    root.add(pile);
  } else if (item.kind === 'exitSeal') {
    const ring = new THREE.Mesh(assets.sharedGeo('seal', () => new THREE.TorusGeometry(0.16, 0.03, 8, 16)), mat(GOLD, { emissive: GOLD, emissiveIntensity: 0.2 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.08;
    const core = new THREE.Mesh(assets.sharedGeo('seal-core', () => new THREE.SphereGeometry(0.07, 8, 6)), mat(GOLD));
    core.position.y = 0.1;
    root.add(ring, core);
  } else if (item.kind === 'thornWall') {
    const thorn = new THREE.Mesh(assets.sharedGeo('thorn', () => new THREE.ConeGeometry(0.12, 0.7, 5)), mat('#5a3a48'));
    thorn.position.y = 0.36;
    root.add(thorn);
  } else if (item.kind === 'decayBarrier' || item.kind === 'hiddenPassage') {
    const vine = new THREE.Mesh(assets.sharedGeo('barrier', () => new THREE.CylinderGeometry(0.05, 0.05, 1.1, 5)), mat('#3f6b48'));
    vine.position.y = 0.5;
    vine.rotation.z = 0.3;
    root.add(vine);
  } else if (item.kind === 'noisyField') {
    const haze = new THREE.Mesh(assets.sharedGeo('noise-field', () => new THREE.SphereGeometry(0.28, 8, 6)), mat(CORAL, { transparent: true, opacity: 0.22, emissive: CORAL, emissiveIntensity: 0.2 }));
    haze.position.y = 0.2;
    root.add(haze);
  } else if (item.kind === 'scentTrail') {
    const ribbon = new THREE.Mesh(assets.sharedGeo('trail', () => new THREE.SphereGeometry(0.18, 8, 6)), mat(LIME, { transparent: true, opacity: 0.5, emissive: LIME, emissiveIntensity: 0.2 }));
    ribbon.position.y = 0.12;
    root.add(ribbon);
  } else {
    const stub = new THREE.Mesh(assets.sharedGeo('item-stub', () => new THREE.BoxGeometry(0.22, 0.22, 0.22)), mat('#3a4460'));
    stub.position.y = 0.14;
    root.add(stub);
  }
  const shadow = new THREE.Mesh(
    assets.sharedGeo('contact-shadow', () => new THREE.CircleGeometry(0.22, 12)),
    assets.lambert('#05070c', { transparent: true, opacity: 0.28 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.015;
  root.add(shadow);
  return { id: item.id, kind: item.kind, root, glow };
}

function round(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
