import {
  ADVENTURE_PRESETS,
  canRejectNoise,
  canSeeTrailIntensity,
  currentObjective,
  findInteractionTarget,
  roomIdAt,
  shortestAdventurePath,
  visibleScentMarkers,
  type AdventureSession,
} from '@suite/core/labyrinth';
import {
  CREAM,
  CORAL,
  GOLD,
  LIME,
  NAVY,
  PURPLE,
  drawChestArt,
  drawDissolveOverlay,
  drawFloorTile,
  drawHiddenOutline,
  drawNoiseBloomCore,
  drawNoiseWisp,
  drawOdorGlyph,
  drawPlayerArt,
  drawShadow,
  drawSlash,
  drawSporeling,
  drawVineCrawler,
  drawWallTile,
  drawWingProps,
  glow,
  roundRect,
} from './art';
import {
  chestProgress,
  deathProgress,
  dissolveProgress,
  slashActive,
  type MazeFxState,
} from './fx';
import { paintHubMinimap } from './hub-minimap';
import { mazeCollision, mazePointLit, mazeTileLit, FLASH_CONE, UNLIT_HEX } from './flashlight';

export const TILE = 46;
const MAX_DPR = 1.25;

export type MazeRenderOpts = {
  lowDarkness: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  hintLevel: number;
  pulseMs: number;
  nudgeScan?: boolean;
  fx?: MazeFxState;
};

export type MazeCamera = { x: number; y: number; zoom: number };

export function createMazeRenderer(canvas: HTMLCanvasElement, minimap?: HTMLCanvasElement | null) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2d context unavailable');
  const miniCtx = minimap?.getContext('2d') ?? null;
  let cssW = 0;
  let cssH = 0;
  let dpr = 1;
  const camera: MazeCamera = { x: 1.5, y: 1.5, zoom: 1 };

  const sizeMinimap = () => {
    if (!minimap || !miniCtx) return;
    const mw = 220;
    const mh = 132;
    const mdpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    minimap.width = Math.floor(mw * mdpr);
    minimap.height = Math.floor(mh * mdpr);
    miniCtx.setTransform(mdpr, 0, 0, mdpr, 0, 0);
  };

  const resize = (w: number, h: number) => {
    cssW = Math.max(1, Math.floor(w));
    cssH = Math.max(1, Math.floor(h));
    dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sizeMinimap();
  };

  const worldToScreen = (x: number, y: number) => ({
    x: (x - camera.x) * TILE * camera.zoom + cssW / 2,
    y: (y - camera.y) * TILE * camera.zoom + cssH / 2,
  });

  const draw = (session: AdventureSession, opts: MazeRenderOpts) => {
    const geo = mazeCollision(session);
    const preset = ADVENTURE_PRESETS[session.difficulty];
    const px = session.player.position.x;
    const py = session.player.position.y;
    const lerp = opts.reducedMotion ? 1 : 0.18;
    camera.x += (px - camera.x) * lerp;
    camera.y += (py - camera.y) * lerp;
    camera.zoom = session.difficulty === 'junior' ? 1.72 : 1.58;
    const t = opts.pulseMs;
    const fx = opts.fx;
    const knock = fx && t < fx.knockUntil && !opts.reducedMotion ? 1 : 0;
    const knockX = (fx?.knockX ?? 0) * knock;
    const knockY = (fx?.knockY ?? 0) * knock;

    ctx.clearRect(0, 0, cssW, cssH);
    ctx.fillStyle = NAVY;
    ctx.fillRect(0, 0, cssW, cssH);

    const scanning = session.player.scan.active;
    const ts = TILE * camera.zoom;
    const propTs = ts * 1.28;
    const occupied = new Set(session.interactables.map((i) => `${i.tile.x},${i.tile.y}`));
    const reach2 = (FLASH_CONE + 0.85) * (FLASH_CONE + 0.85);

    for (let y = 0; y < session.map.height; y += 1) {
      for (let x = 0; x < session.map.width; x += 1) {
        const blocked = geo.collision[y * session.map.width + x] === true;
        const s = worldToScreen(x, y);
        if (s.x + ts < -20 || s.y + ts < -20 || s.x > cssW + 20 || s.y > cssH + 20) continue;
        const dx = x + 0.5 - px;
        const dy = y + 0.5 - py;
        const nearby = dx * dx + dy * dy <= reach2;
        const lit = nearby && mazeTileLit(session, { x, y }, blocked, opts.lowDarkness);
        if (!lit && !opts.lowDarkness) {
          ctx.fillStyle = UNLIT_HEX;
          ctx.fillRect(s.x, s.y, ts + 0.6, ts + 0.6);
          continue;
        }
        const shade = lit ? 1 : 0.38;
        const room = roomIdAt(x, y);
        if (blocked) {
          const n = y > 0 && geo.collision[(y - 1) * session.map.width + x] === true;
          const e = x < session.map.width - 1 && geo.collision[y * session.map.width + x + 1] === true;
          const south = y < session.map.height - 1 && geo.collision[(y + 1) * session.map.width + x] === true;
          const w = x > 0 && geo.collision[y * session.map.width + x - 1] === true;
          drawWallTile(ctx, s.x, s.y, ts, room, x, y, shade, opts.highContrast, { n, e, s: south, w });
        } else {
          drawFloorTile(ctx, s.x, s.y, ts, room, x, y, shade, opts.highContrast);
          drawWingProps(ctx, s.x, s.y, ts, room, x, y, shade, occupied.has(`${x},${y}`));
        }
      }
    }

    const open = new Set(session.openDoorIds);
    for (const item of session.interactables) {
      const center = { x: item.tile.x + 0.5, y: item.tile.y + 0.5 };
      if (!mazePointLit(session, center, opts.lowDarkness)) continue;
      const s = worldToScreen(center.x, center.y);
      const highlighted = session.player.highlightedIds.includes(item.id);
      const shimmer =
        preset.shimmerSecrets &&
        (item.kind === 'hiddenPassage' || item.kind === 'hiddenChest') &&
        !session.unlockedPassageIds.includes(item.id);
      if (item.kind === 'scentTrail' && canSeeTrailIntensity(session) && scanning) {
        glow(ctx, s.x, s.y, propTs * 0.62, LIME, item.trailIntensity ?? 0.6);
      }
      if (item.kind === 'noisyField' && scanning && !canRejectNoise(session)) {
        glow(ctx, s.x, s.y, ts * 0.7, CORAL, 0.35);
      }
      if (item.kind === 'chest' || (item.kind === 'hiddenChest' && session.unlockedPassageIds.includes(item.id))) {
        const opened = session.player.openedChestIds.includes(item.id);
        const anim = fx?.chests.get(item.id);
        const p = chestProgress(anim, t, opts.reducedMotion);
        const shake = anim?.phase === 'shake' && !opts.reducedMotion ? Math.sin(t / 18) * 3 : 0;
        const lid = anim ? Math.min(1, Math.max(0, (p - 0.18) / 0.3)) : opened ? 1 : 0;
        const rewardY = anim && p > 0.45 ? (p - 0.45) * propTs * 0.7 : 0;
        drawChestArt(ctx, s.x, s.y, propTs, opened, opts.highContrast, shake, lid, rewardY);
        if (anim && p > 0.45 && p < 0.85) glow(ctx, s.x, s.y - propTs * 0.1, propTs * 0.4, GOLD, 0.45);
      }
      if (item.kind === 'coffeePile') {
        drawPile(ctx, s.x, s.y, propTs, highlighted, Boolean(item.trueTarget));
      }
      if (item.kind === 'exitSeal') {
        drawSeal(ctx, s.x, s.y, propTs, session.player.restoredSealIds.includes(item.sealId ?? 'storage'), t, opts.reducedMotion);
      }
      if (item.kind === 'thornWall' && !session.unlockedPassageIds.includes(item.id)) {
        drawThorns(ctx, s.x, s.y, propTs, highlighted);
        if (scanning && highlighted) drawHiddenOutline(ctx, s.x, s.y, propTs, t, opts.reducedMotion);
      }
      if (item.kind === 'modulePedestal') drawPedestal(ctx, s.x, s.y, propTs, t, opts.reducedMotion);
      if (item.kind === 'odorSample') drawSample(ctx, s.x, s.y, propTs, scanning, t, opts.reducedMotion);
      if (item.kind === 'checkpoint') drawFlag(ctx, s.x, s.y, propTs, item.id === session.player.currentCheckpointId);
      if (item.kind === 'exit') drawExit(ctx, s.x, s.y, ts, session.player.restoredSealIds.length);
      if (item.kind === 'scentGate' && !open.has(item.id)) {
        drawBarredGate(ctx, s.x, s.y, ts);
      }
      if (item.kind === 'decayBarrier' && !open.has(item.id)) {
        drawVines(ctx, s.x, s.y, ts, scanning);
        if (scanning) drawHiddenOutline(ctx, s.x, s.y, ts, t, opts.reducedMotion);
      }
      if (item.kind === 'scentLock' && !session.player.solvedPuzzleIds.includes(item.id)) {
        drawLock(ctx, s.x, s.y, ts);
      }
      if (item.kind === 'hiddenPassage' && !session.unlockedPassageIds.includes(item.id) && scanning && highlighted) {
        drawHiddenOutline(ctx, s.x, s.y, ts, t, opts.reducedMotion);
      }
      if (shimmer && !opts.reducedMotion) {
        ctx.strokeStyle = GOLD;
        ctx.globalAlpha = 0.45 + (Math.sin(t / 280) + 1) * 0.15;
        ctx.lineWidth = 2;
        ctx.strokeRect(s.x - ts * 0.35, s.y - ts * 0.35, ts * 0.7, ts * 0.7);
        ctx.globalAlpha = 1;
      } else if (shimmer) {
        ctx.strokeStyle = GOLD;
        ctx.globalAlpha = 0.7;
        ctx.strokeRect(s.x - ts * 0.35, s.y - ts * 0.35, ts * 0.7, ts * 0.7);
        ctx.globalAlpha = 1;
      }
      const dissolve = fx?.dissolves.get(item.id);
      if (dissolve) {
        drawDissolveOverlay(ctx, s.x, s.y, ts, dissolveProgress(dissolve, t, opts.reducedMotion), dissolve.kind);
      }
    }

    if (scanning) {
      const markers = visibleScentMarkers(session);
      const age = 1 - session.player.scan.remainingMs / 1800;
      for (const mark of markers) {
        if (mark.falseSignal && canRejectNoise(session)) continue;
        if (mark.id.startsWith('scent-') || mark.id.startsWith('pile-') || mark.id.startsWith('wisp-core-')) {
          continue;
        }
        const center = { x: mark.tile.x + 0.5, y: mark.tile.y + 0.5 };
        if (!mazePointLit(session, center, opts.lowDarkness)) continue;
        const s = worldToScreen(center.x, center.y);
        const appear = opts.reducedMotion ? 1 : Math.min(1, Math.max(0, age * 1.4 - 0.1));
        glow(ctx, s.x, s.y, propTs * 0.5, mark.falseSignal ? CORAL : PURPLE, (mark.falseSignal ? 0.3 : 0.55) * appear);
        ctx.globalAlpha = appear;
        drawOdorGlyph(
          ctx,
          s.x,
          s.y,
          propTs,
          mark.odorId,
          Boolean(mark.classified && mark.odorId),
          mark.falseSignal,
        );
        ctx.globalAlpha = 1;
      }
    }

    for (const enemy of session.enemies) {
      if (enemy.defeated) continue;
      if (!mazePointLit(session, enemy.position, opts.lowDarkness)) continue;
      const s = worldToScreen(enemy.position.x, enemy.position.y);
      const hit = Boolean(fx && session.lastFeedback.hitEnemyIds.includes(enemy.id));
      if (enemy.kind === 'mimicSpore' && enemy.disguised) {
        drawChestArt(ctx, s.x, s.y, propTs, false, opts.highContrast);
        if (scanning) {
          ctx.strokeStyle = CORAL;
          ctx.setLineDash([4, 4]);
          ctx.lineDashOffset = opts.reducedMotion ? 0 : -t / 30;
          ctx.strokeRect(s.x - 14, s.y - 14, 28, 28);
          ctx.setLineDash([]);
        }
        continue;
      }
      if (enemy.kind === 'mimicSpore') {
        const revealLeft = fx?.mimicUntil.get(enemy.id) ?? 0;
        const morph = revealLeft > t && !opts.reducedMotion ? (revealLeft - t) / 640 : 0;
        if (morph > 0.4) drawChestArt(ctx, s.x, s.y, propTs, false, opts.highContrast, Math.sin(t / 20) * 2);
        else drawSporeling(ctx, s.x, s.y, propTs, t, hit, opts.reducedMotion);
        continue;
      }
      if (enemy.kind === 'noiseBloom') {
        const junior = session.difficulty === 'junior';
        const identified = junior || enemy.revealed || scanning;
        for (const [i, tile] of enemy.coreTiles.entries()) {
          const cs = worldToScreen(tile.x + 0.5, tile.y + 0.5);
          drawNoiseBloomCore(
            ctx,
            cs.x,
            cs.y,
            propTs,
            t,
            identified && (junior || i === enemy.trueCoreIndex),
            scanning,
            enemy.phase,
            opts.reducedMotion,
          );
        }
        continue;
      }
      if (enemy.kind === 'vineCrawler') {
        drawVineCrawler(ctx, s.x, s.y, propTs, t, enemy.revealed || scanning, opts.reducedMotion);
      } else if (enemy.kind === 'noiseWisp') {
        drawNoiseWisp(ctx, s.x, s.y, propTs, t, scanning && enemy.revealed, opts.reducedMotion);
        if (!canRejectNoise(session) || !scanning) {
          for (const tile of enemy.falseMarkerTiles) {
            const gs = worldToScreen(tile.x + 0.5, tile.y + 0.5);
            ctx.globalAlpha = opts.reducedMotion ? 0.35 : 0.22 + 0.18 * Math.sin(t / 90 + tile.x);
            glow(ctx, gs.x, gs.y, ts * 0.2, CORAL, 0.4);
            ctx.fillStyle = CORAL;
            ctx.beginPath();
            ctx.arc(gs.x, gs.y, ts * 0.07, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }
      } else {
        drawSporeling(ctx, s.x, s.y, propTs, t, hit, opts.reducedMotion);
      }
    }

    if (fx) {
      for (const death of fx.deaths.values()) {
        const p = deathProgress(death, t, opts.reducedMotion);
        const s = worldToScreen(death.x, death.y);
        ctx.globalAlpha = 1 - p;
        if (death.kind === 'sporeling' || death.kind === 'mimicSpore') {
          drawSporeling(ctx, s.x, s.y, propTs * (1 + p * 0.4), t, true, true);
        }
        ctx.globalAlpha = 1;
      }
      for (const p of fx.particles) {
        const s = worldToScreen(p.x, p.y);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, Math.max(1.2, p.size * ts * 4), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    const ps = worldToScreen(px + knockX, py + knockY);
    const walking = Math.hypot(px - session.player.prevPosition.x, py - session.player.prevPosition.y) > 0.002;
    const invuln = session.player.invulnerableUntilMs > session.elapsedMs;
    drawPlayerArt(
      ctx,
      ps.x,
      ps.y,
      propTs,
      session.player.facing,
      t,
      walking,
      invuln,
      Boolean(fx && t < fx.hitFlashUntil),
      opts.reducedMotion,
    );
    if (fx && slashActive(fx, t)) {
      const age = 1 - (fx.slashUntil - t) / 220;
      drawSlash(ctx, ps.x, ps.y, ts, fx.slashFacing, opts.reducedMotion ? 0.4 : age);
    }

    const affordance = findInteractionTarget(session);
    if (affordance.input !== 'none') {
      const badgeTile = affordance.item
        ? { x: affordance.item.tile.x + 0.5, y: affordance.item.tile.y + 0.5 }
        : { x: px, y: py };
      const bs = worldToScreen(badgeTile.x, badgeTile.y);
      drawKeyBadge(ctx, bs.x, bs.y - ts * 0.42, affordance.input, ts);
    }

    if (fx && t < fx.scanTintUntil && scanning) {
      const a = opts.reducedMotion ? 0.08 : 0.12;
      ctx.fillStyle = `rgba(155,125,255,${a})`;
      ctx.fillRect(0, 0, cssW, cssH);
      if (!opts.reducedMotion) {
        ctx.fillStyle = 'rgba(205,231,109,0.04)';
        ctx.fillRect(2, 0, cssW, cssH);
      }
    }

    const fog = ctx.createRadialGradient(cssW / 2, cssH / 2, cssH * 0.12, cssW / 2, cssH / 2, cssH * 0.62);
    fog.addColorStop(0, 'rgba(3,5,8,0)');
    fog.addColorStop(1, opts.lowDarkness ? 'rgba(3,5,8,0.22)' : 'rgba(3,5,8,0.78)');
    ctx.fillStyle = fog;
    ctx.fillRect(0, 0, cssW, cssH);

    if (opts.hintLevel >= 2) {
      drawHintRoute(
        ctx,
        shortestAdventurePath(session, currentObjective(session).tile),
        worldToScreen,
        ts,
        t,
        opts.reducedMotion,
        opts.hintLevel >= 3,
      );
    }

    if (session.difficulty === 'junior') {
      if (miniCtx && minimap) {
        minimap.hidden = false;
        miniCtx.clearRect(0, 0, 220, 132);
        paintAdventureMinimap(miniCtx, session, 220, 132, false);
      } else {
        paintAdventureMinimap(ctx, session, cssW, cssH);
      }
    } else if (minimap) {
      minimap.hidden = true;
    }
  };

  return { resize, draw, camera, worldToScreen };
}

function drawPedestal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ts: number,
  t: number,
  reduced: boolean,
) {
  drawShadow(ctx, x, y + 6, ts * 0.16, ts * 0.08, 0.4);
  ctx.fillStyle = '#2a3040';
  roundRect(ctx, x - ts * 0.14, y, ts * 0.28, ts * 0.12, 3);
  ctx.fill();
  ctx.fillStyle = PURPLE;
  ctx.beginPath();
  ctx.arc(x, y - ts * 0.04, ts * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.stroke();
  if (!reduced) glow(ctx, x, y - ts * 0.04, ts * 0.22, PURPLE, 0.25 + 0.1 * Math.sin(t / 260));
}

function drawSample(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ts: number,
  scan: boolean,
  t: number,
  reduced: boolean,
) {
  drawShadow(ctx, x, y + 4, ts * 0.12, ts * 0.06, 0.35);
  ctx.fillStyle = scan ? LIME : '#7aa0c4';
  ctx.beginPath();
  ctx.arc(x, y, ts * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = CREAM;
  ctx.globalAlpha = 0.5;
  ctx.stroke();
  ctx.globalAlpha = 1;
  if (scan && !reduced) glow(ctx, x, y, ts * 0.28, PURPLE, 0.4 + 0.15 * Math.sin(t / 140));
}

function drawFlag(ctx: CanvasRenderingContext2D, x: number, y: number, ts: number, current: boolean) {
  const pole = ts * 0.18;
  ctx.strokeStyle = current ? LIME : '#89a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - pole * 0.4, y + pole);
  ctx.lineTo(x - pole * 0.4, y - pole);
  ctx.lineTo(x + pole, y - pole * 0.4);
  ctx.lineTo(x - pole * 0.4, y);
  ctx.stroke();
}

function drawExit(ctx: CanvasRenderingContext2D, x: number, y: number, ts: number, seals = 0) {
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  roundRect(ctx, x - ts * 0.28, y - ts * 0.28, ts * 0.56, ts * 0.56, 8);
  ctx.stroke();
  ctx.fillStyle = 'rgba(230,197,106,0.12)';
  ctx.fill();
  ctx.fillStyle = GOLD;
  ctx.font = `700 ${Math.round(ts * 0.18)}px ui-sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('X', x, y - 2);
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = i < seals ? GOLD : 'rgba(244,239,224,0.28)';
    ctx.beginPath();
    ctx.arc(x - ts * 0.16 + i * ts * 0.16, y + ts * 0.18, ts * 0.045, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ts: number,
  highlighted: boolean,
  altered: boolean,
) {
  drawShadow(ctx, x, y + 6, ts * 0.18, ts * 0.08, 0.35);
  ctx.fillStyle = highlighted ? (altered ? LIME : '#8b5a2b') : '#6a4420';
  ctx.beginPath();
  ctx.ellipse(x, y + 4, ts * 0.18, ts * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3b2d12';
  ctx.beginPath();
  ctx.ellipse(x - 4, y + 2, 3, 2, 0.4, 0, Math.PI * 2);
  ctx.ellipse(x + 5, y + 5, 2.5, 1.6, -0.3, 0, Math.PI * 2);
  ctx.fill();
  if (highlighted) {
    ctx.strokeStyle = altered ? LIME : PURPLE;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawSeal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ts: number,
  restored: boolean,
  t: number,
  reduced: boolean,
) {
  drawShadow(ctx, x, y + 6, ts * 0.14, ts * 0.07, 0.35);
  ctx.strokeStyle = restored ? GOLD : '#89a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, ts * 0.16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = restored ? GOLD : 'transparent';
  ctx.beginPath();
  ctx.arc(x, y, ts * 0.07, 0, Math.PI * 2);
  ctx.fill();
  if (restored && !reduced) glow(ctx, x, y, ts * 0.28, GOLD, 0.3 + 0.1 * Math.sin(t / 240));
}

function drawThorns(ctx: CanvasRenderingContext2D, x: number, y: number, ts: number, highlighted: boolean) {
  ctx.strokeStyle = highlighted ? LIME : '#5a3a48';
  ctx.lineWidth = Math.max(2, ts * 0.07);
  ctx.beginPath();
  ctx.moveTo(x - ts * 0.2, y + ts * 0.18);
  ctx.lineTo(x, y - ts * 0.2);
  ctx.lineTo(x + ts * 0.2, y + ts * 0.18);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - ts * 0.08, y);
  ctx.lineTo(x - ts * 0.18, y - ts * 0.08);
  ctx.moveTo(x + ts * 0.08, y);
  ctx.lineTo(x + ts * 0.2, y - ts * 0.06);
  ctx.stroke();
}

function drawHintRoute(
  ctx: CanvasRenderingContext2D,
  path: Array<{ x: number; y: number }>,
  worldToScreen: (x: number, y: number) => { x: number; y: number },
  ts: number,
  t: number,
  reduced: boolean,
  showAction: boolean,
): void {
  if (path.length === 0) return;
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = LIME;
  ctx.shadowColor = LIME;
  ctx.shadowBlur = reduced ? 0 : 14;
  ctx.lineWidth = Math.max(4, ts * 0.16);
  ctx.globalAlpha = 0.88;
  ctx.beginPath();
  const first = worldToScreen(path[0]!.x + 0.5, path[0]!.y + 0.5);
  ctx.moveTo(first.x, first.y);
  for (let i = 1; i < path.length; i += 1) {
    const tile = path[i]!;
    const s = worldToScreen(tile.x + 0.5, tile.y + 0.5);
    ctx.lineTo(s.x, s.y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
  for (let i = 1; i < path.length; i += 1) {
    const tile = path[i]!;
    const s = worldToScreen(tile.x + 0.5, tile.y + 0.5);
    const pulse = reduced ? 0.7 : 0.5 + 0.5 * Math.sin(t / 160 + i * 0.55);
    glow(ctx, s.x, s.y, ts * 0.22, LIME, 0.35 + 0.35 * pulse);
    ctx.fillStyle = LIME;
    ctx.globalAlpha = 0.55 + 0.45 * pulse;
    ctx.beginPath();
    ctx.arc(s.x, s.y, ts * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }
  const last = path[path.length - 1]!;
  const dest = worldToScreen(last.x + 0.5, last.y + 0.5);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(dest.x, dest.y, ts * 0.42, 0, Math.PI * 2);
  ctx.stroke();
  if (showAction) {
    drawKeyBadge(ctx, dest.x, dest.y - ts * 0.55, 'E', ts);
  }
  ctx.restore();
}

function drawKeyBadge(ctx: CanvasRenderingContext2D, x: number, y: number, key: string, ts: number) {
  const w = ts * 0.32;
  const h = ts * 0.22;
  ctx.fillStyle = 'rgba(18,24,36,0.88)';
  roundRect(ctx, x - w / 2, y - h / 2, w, h, 4);
  ctx.fill();
  ctx.strokeStyle = LIME;
  ctx.stroke();
  ctx.fillStyle = CREAM;
  ctx.font = `700 ${Math.round(ts * 0.16)}px ui-sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(key, x, y + 0.5);
  ctx.textBaseline = 'alphabetic';
}

export function paintAdventureMinimap(
  ctx: CanvasRenderingContext2D,
  session: AdventureSession,
  cssW: number,
  cssH: number,
  inset = true,
): void {
  const pad = 12;
  const mw = inset ? Math.min(176, cssW * 0.3) : cssW;
  const mh = inset ? Math.min(148, cssH * 0.28) : cssH;
  const ox = inset ? cssW - mw - pad : 0;
  const oy = inset ? cssH - mh - pad : 0;
  paintHubMinimap(ctx, session, ox, oy, mw, mh);
}

function drawVines(ctx: CanvasRenderingContext2D, x: number, y: number, ts: number, scan: boolean) {
  ctx.fillStyle = scan ? 'rgba(63, 107, 72, 0.55)' : 'rgba(32, 58, 40, 0.9)';
  roundRect(ctx, x - ts * 0.42, y - ts * 0.42, ts * 0.84, ts * 0.84, 5);
  ctx.fill();
  const r = ts * 0.34;
  ctx.strokeStyle = scan ? LIME : '#3f6b48';
  ctx.lineWidth = Math.max(3, ts * 0.07);
  ctx.beginPath();
  ctx.moveTo(x - r, y + r);
  ctx.quadraticCurveTo(x - r * 0.2, y - r, x + r * 0.15, y + r);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - r * 0.15, y + r);
  ctx.quadraticCurveTo(x + r * 0.2, y - r * 0.85, x + r, y + r * 0.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - r * 0.5, y + r * 0.3);
  ctx.quadraticCurveTo(x, y - r * 0.35, x + r * 0.55, y + r * 0.45);
  ctx.stroke();
}

function drawBarredGate(ctx: CanvasRenderingContext2D, x: number, y: number, ts: number) {
  ctx.fillStyle = 'rgba(28, 22, 40, 0.94)';
  roundRect(ctx, x - ts * 0.42, y - ts * 0.42, ts * 0.84, ts * 0.84, 5);
  ctx.fill();
  ctx.strokeStyle = PURPLE;
  ctx.lineWidth = Math.max(2, ts * 0.05);
  ctx.strokeRect(x - ts * 0.38, y - ts * 0.38, ts * 0.76, ts * 0.76);
  ctx.lineWidth = Math.max(2.2, ts * 0.055);
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x + i * ts * 0.12, y - ts * 0.34);
    ctx.lineTo(x + i * ts * 0.12, y + ts * 0.34);
    ctx.stroke();
  }
  drawLock(ctx, x, y + ts * 0.04, ts);
}

function drawLock(ctx: CanvasRenderingContext2D, x: number, y: number, ts: number) {
  const r = ts * 0.13;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = Math.max(2, ts * 0.06);
  ctx.beginPath();
  ctx.arc(x, y - r * 0.6, r, Math.PI, 0);
  ctx.stroke();
  ctx.fillStyle = GOLD;
  roundRect(ctx, x - r * 1.2, y - r * 0.5, r * 2.4, r * 1.6, 3);
  ctx.fill();
}
