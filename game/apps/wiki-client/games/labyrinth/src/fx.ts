import type { AdventureSession } from '@suite/core/labyrinth';

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
  kind: 'dust' | 'spore' | 'spark' | 'scent' | 'gold';
};

export type ChestAnim = {
  started: number;
  phase: 'shake' | 'lid' | 'burst' | 'float' | 'done';
};

export type DissolveAnim = {
  started: number;
  kind: 'wall' | 'vine';
  tileX: number;
  tileY: number;
};

export type DeathAnim = {
  started: number;
  kind: string;
  x: number;
  y: number;
};

export type MazeFxState = {
  particles: Particle[];
  chests: Map<string, ChestAnim>;
  dissolves: Map<string, DissolveAnim>;
  deaths: Map<string, DeathAnim>;
  slashUntil: number;
  slashFacing: number;
  hitFlashUntil: number;
  knockX: number;
  knockY: number;
  knockUntil: number;
  scanTintUntil: number;
  collectUntil: number;
  collectOdor: string | null;
  collectFrom: { x: number; y: number } | null;
  seenOpened: Set<string>;
  seenUnlocked: Set<string>;
  seenRevealed: Set<string>;
  seenDefeated: Set<string>;
  seenLearned: Set<string>;
  mimicUntil: Map<string, number>;
  bloomPhaseUntil: Map<string, number>;
};

const CHEST_MS = 1100;
const DISSOLVE_MS = 900;
const DEATH_MS = 700;

export function createMazeFx(): MazeFxState {
  return {
    particles: [],
    chests: new Map(),
    dissolves: new Map(),
    deaths: new Map(),
    slashUntil: 0,
    slashFacing: 0,
    hitFlashUntil: 0,
    knockX: 0,
    knockY: 0,
    knockUntil: 0,
    scanTintUntil: 0,
    collectUntil: 0,
    collectOdor: null,
    collectFrom: null,
    seenOpened: new Set(),
    seenUnlocked: new Set(),
    seenRevealed: new Set(),
    seenDefeated: new Set(),
    seenLearned: new Set(),
    mimicUntil: new Map(),
    bloomPhaseUntil: new Map(),
  };
}

export function chestProgress(anim: ChestAnim | undefined, now: number, reduced: boolean): number {
  if (!anim) return 1;
  const dur = reduced ? 280 : CHEST_MS;
  return Math.min(1, (now - anim.started) / dur);
}

export function dissolveProgress(anim: DissolveAnim | undefined, now: number, reduced: boolean): number {
  if (!anim) return 1;
  const dur = reduced ? 220 : DISSOLVE_MS;
  return Math.min(1, (now - anim.started) / dur);
}

export function deathProgress(anim: DeathAnim | undefined, now: number, reduced: boolean): number {
  if (!anim) return 1;
  const dur = reduced ? 180 : DEATH_MS;
  return Math.min(1, (now - anim.started) / dur);
}

function burst(
  fx: MazeFxState,
  x: number,
  y: number,
  color: string,
  n: number,
  kind: Particle['kind'],
  reduced: boolean,
): void {
  const count = reduced ? Math.min(4, n) : n;
  for (let i = 0; i < count; i += 1) {
    const a = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const sp = 0.4 + Math.random() * 1.4;
    fx.particles.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - (kind === 'gold' ? 0.6 : 0),
      life: 1,
      max: 0.35 + Math.random() * 0.45,
      color,
      size: kind === 'scent' ? 0.08 : 0.05 + Math.random() * 0.05,
      kind,
    });
  }
}

export function ingestMazeFx(
  fx: MazeFxState,
  session: AdventureSession,
  now: number,
  reduced: boolean,
): void {
  const fb = session.lastFeedback;
  const px = session.player.position.x;
  const py = session.player.position.y;

  if (fb.message === 'scan') {
    fx.scanTintUntil = now + (reduced ? 180 : 520);
  }
  if (fb.learnedOdorId && !fx.seenLearned.has(fb.learnedOdorId + session.elapsedMs)) {
    fx.seenLearned.add(fb.learnedOdorId);
    fx.collectUntil = now + (reduced ? 280 : 900);
    fx.collectOdor = fb.learnedOdorId;
    const sample = session.interactables.find((i) => i.odorId === fb.learnedOdorId && i.kind === 'odorSample');
    fx.collectFrom = sample ? { x: sample.tile.x + 0.5, y: sample.tile.y + 0.5 } : { x: px, y: py };
    burst(fx, fx.collectFrom.x, fx.collectFrom.y, '#9b7dff', 18, 'scent', reduced);
  }
  if (fb.openedId && !fx.seenOpened.has(fb.openedId)) {
    fx.seenOpened.add(fb.openedId);
    fx.chests.set(fb.openedId, { started: now, phase: 'shake' });
    const item = session.interactables.find((i) => i.id === fb.openedId);
    if (item) burst(fx, item.tile.x + 0.5, item.tile.y + 0.5, '#e6c56a', 14, 'gold', reduced);
  }
  if (fb.unlockedPassageId && !fx.seenUnlocked.has(fb.unlockedPassageId)) {
    fx.seenUnlocked.add(fb.unlockedPassageId);
    const item = session.interactables.find((i) => i.id === fb.unlockedPassageId);
    if (item) {
      fx.dissolves.set(fb.unlockedPassageId, {
        started: now,
        kind: item.kind === 'thornWall' || item.kind === 'decayBarrier' ? 'vine' : 'wall',
        tileX: item.tile.x,
        tileY: item.tile.y,
      });
      burst(fx, item.tile.x + 0.5, item.tile.y + 0.5, '#cde76d', 16, 'dust', reduced);
    }
  }
  if (fb.message === 'decay-reveal') {
    for (const item of session.interactables) {
      if (item.kind !== 'decayBarrier') continue;
      if (!session.player.revealedBarrierIds.includes(item.id)) continue;
      if (fx.seenRevealed.has(item.id)) continue;
      fx.seenRevealed.add(item.id);
      fx.dissolves.set(item.id, {
        started: now,
        kind: 'vine',
        tileX: item.tile.x,
        tileY: item.tile.y,
      });
      burst(fx, item.tile.x + 0.5, item.tile.y + 0.5, '#3f8a4c', 12, 'dust', reduced);
    }
  }
  if (fb.playerDamaged) {
    fx.hitFlashUntil = now + (reduced ? 80 : 220);
    fx.knockUntil = now + (reduced ? 80 : 180);
    fx.knockX = -Math.cos(session.player.facing) * 0.18;
    fx.knockY = -Math.sin(session.player.facing) * 0.18;
  }
  for (const id of fb.hitEnemyIds) {
    const enemy = session.enemies.find((e) => e.id === id);
    if (!enemy) continue;
    burst(fx, enemy.position.x, enemy.position.y, '#ee7b66', 8, 'spark', reduced);
  }
  for (const enemy of session.enemies) {
    if (enemy.defeated && !fx.seenDefeated.has(enemy.id)) {
      fx.seenDefeated.add(enemy.id);
      fx.deaths.set(enemy.id, {
        started: now,
        kind: enemy.kind,
        x: enemy.position.x,
        y: enemy.position.y,
      });
      burst(fx, enemy.position.x, enemy.position.y, '#ee7b66', 20, 'spore', reduced);
    }
    if (enemy.kind === 'mimicSpore' && !enemy.disguised && !fx.mimicUntil.has(enemy.id)) {
      fx.mimicUntil.set(enemy.id, now + (reduced ? 160 : 640));
    }
    if (enemy.kind === 'noiseBloom' && enemy.phase >= 2 && !fx.bloomPhaseUntil.has(enemy.id)) {
      fx.bloomPhaseUntil.set(enemy.id, now + (reduced ? 200 : 700));
      burst(fx, enemy.position.x, enemy.position.y, '#9b7dff', 16, 'spark', reduced);
    }
  }

  const dt = reduced ? 0.035 : 0.016;
  fx.particles = fx.particles.filter((p) => p.life > 0);
  for (const p of fx.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += (p.kind === 'gold' ? -0.6 : 0.15) * dt;
    p.life -= dt / p.max;
  }

  if (fx.collectUntil > now && fx.collectFrom) {
    const remain = (fx.collectUntil - now) / 900;
    if (!reduced) {
      burst(fx, fx.collectFrom.x, fx.collectFrom.y, '#9b7dff', 1, 'scent', true);
      const last = fx.particles[fx.particles.length - 1];
      if (last) {
        last.vx = (px - fx.collectFrom.x) * 2.4;
        last.vy = (py - fx.collectFrom.y) * 2.4;
      }
    }
    if (remain < 0) fx.collectFrom = null;
  }

  for (const [id, anim] of fx.chests) {
    const p = chestProgress(anim, now, reduced);
    if (p < 0.18) anim.phase = 'shake';
    else if (p < 0.45) anim.phase = 'lid';
    else if (p < 0.7) anim.phase = 'burst';
    else if (p < 1) anim.phase = 'float';
    else anim.phase = 'done';
    if (p >= 1) fx.chests.delete(id);
  }
  for (const [id, anim] of fx.dissolves) {
    if (dissolveProgress(anim, now, reduced) >= 1) fx.dissolves.delete(id);
  }
  for (const [id, anim] of fx.deaths) {
    if (deathProgress(anim, now, reduced) >= 1) fx.deaths.delete(id);
  }
}

export function triggerSlash(fx: MazeFxState, facing: number, now: number, reduced: boolean): void {
  fx.slashUntil = now + (reduced ? 90 : 220);
  fx.slashFacing = facing;
}

export function slashActive(fx: MazeFxState, now: number): boolean {
  return now < fx.slashUntil;
}
