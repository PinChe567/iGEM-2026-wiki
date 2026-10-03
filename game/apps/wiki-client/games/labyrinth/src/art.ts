import type { AdventureRoomId } from '@suite/core/labyrinth';
import crateRaw from '../assets/crate.svg?raw';
import sackRaw from '../assets/sack.svg?raw';
import vineRaw from '../assets/vine.svg?raw';
import panelRaw from '../assets/panel.svg?raw';
import chestClosedRaw from '../assets/chest-closed.svg?raw';
import chestOpenRaw from '../assets/chest-open.svg?raw';
import sporelingRaw from '../assets/sporeling.svg?raw';
import playerRaw from '../assets/player.svg?raw';

export const LIME = '#cde76d';
export const PURPLE = '#9b7dff';
export const CORAL = '#ee7b66';
export const GOLD = '#e6c56a';
export const CREAM = '#f4efe0';
export const INK = '#211c2b';
export const NAVY = '#121826';

export type WingPalette = {
  floorA: string;
  floorB: string;
  wall: string;
  wallEdge: string;
  moss: string;
  accent: string;
};

export const WING: Record<AdventureRoomId, WingPalette> = {
  storage: {
    floorA: '#1a1410',
    floorB: '#221810',
    wall: '#c4a078',
    wallEdge: '#ead4b4',
    moss: '#4a5a2c',
    accent: '#8a6136',
  },
  greenhouse: {
    floorA: '#101810',
    floorB: '#162016',
    wall: '#c8d0a8',
    wallEdge: '#e8f0c8',
    moss: '#2f6b3c',
    accent: '#4a8a52',
  },
  signal: {
    floorA: '#10141c',
    floorB: '#161c28',
    wall: '#b8c0d4',
    wallEdge: '#e0e8f4',
    moss: '#3a4460',
    accent: '#7655e8',
  },
  atrium: {
    floorA: '#16120e',
    floorB: '#1e1812',
    wall: '#d8c4a0',
    wallEdge: '#f4ead4',
    moss: '#3a4a48',
    accent: '#e6c56a',
  },
  corridor: {
    floorA: '#14120e',
    floorB: '#1c1812',
    wall: '#d2c09a',
    wallEdge: '#f0e2c4',
    moss: '#3a4a40',
    accent: '#9b7dff',
  },
};

const images: Record<string, HTMLImageElement> = {};

function dataUrl(raw: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(raw)}`;
}

function load(url: string): HTMLImageElement {
  let img = images[url];
  if (!img) {
    img = new Image();
    img.src = url;
    images[url] = img;
  }
  return img;
}

export function stamp(ctx: CanvasRenderingContext2D, url: string, x: number, y: number, s: number, alpha = 1): void {
  const img = load(url);
  if (!img.complete || img.naturalWidth === 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, x - s / 2, y - s / 2, s, s);
  ctx.restore();
}

export const PROP_URL = {
  crate: dataUrl(crateRaw),
  sack: dataUrl(sackRaw),
  vine: dataUrl(vineRaw),
  panel: dataUrl(panelRaw),
  chestClosed: dataUrl(chestClosedRaw),
  chestOpen: dataUrl(chestOpenRaw),
  sporeling: dataUrl(sporelingRaw),
  player: dataUrl(playerRaw),
};

export function hash2(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

export function glow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  a: number,
): void {
  const g = ctx.createRadialGradient(x, y, 1, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = a;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

export function drawShadow(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, a = 0.35): void {
  ctx.fillStyle = `rgba(8,10,16,${a})`;
  ctx.beginPath();
  ctx.ellipse(x, y + ry * 0.9, rx, ry * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function shadeColor(hex: string, shade: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * shade);
  const g = Math.round(((n >> 8) & 255) * shade);
  const b = Math.round((n & 255) * shade);
  return `rgb(${r},${g},${b})`;
}

export function drawFloorTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ts: number,
  room: AdventureRoomId,
  tx: number,
  ty: number,
  shade: number,
  contrast: boolean,
): void {
  const pal = WING[room];
  const checker = (tx + ty) % 2 === 0;
  ctx.fillStyle = contrast ? (checker ? '#1a1410' : '#24180e') : shadeColor(checker ? pal.floorA : pal.floorB, 0.12 + shade * 0.88);
  ctx.fillRect(x, y, ts, ts);
  ctx.strokeStyle = `rgba(70,90,120,${0.1 * shade})`;
  ctx.strokeRect(x + 0.5, y + 0.5, ts - 1, ts - 1);
  const n = hash2(tx, ty);
  ctx.fillStyle = pal.moss;
  ctx.globalAlpha = 0.18 * shade;
  for (let i = 0; i < 4; i += 1) {
    const px = x + ((n * (11 + i * 7)) % 1) * ts;
    const py = y + ((n * (19 + i * 5)) % 1) * ts;
    ctx.beginPath();
    ctx.arc(px, py, ts * 0.04, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  if (room === 'storage' && n > 0.72) {
    ctx.fillStyle = '#5a3a18';
    ctx.globalAlpha = 0.55 * shade;
    ctx.beginPath();
    ctx.ellipse(x + ts * 0.3, y + ts * 0.62, ts * 0.05, ts * 0.03, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (room === 'greenhouse' && n > 0.65) {
    ctx.strokeStyle = pal.moss;
    ctx.globalAlpha = 0.35 * shade;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x + ts * 0.1, y + ts);
    ctx.quadraticCurveTo(x + ts * 0.4, y + ts * 0.4, x + ts * 0.7, y + ts * 0.85);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (room === 'signal' && n > 0.8) {
    ctx.fillStyle = PURPLE;
    ctx.globalAlpha = 0.22 * shade;
    ctx.fillRect(x, y + ts * 0.45, ts, 2);
    ctx.globalAlpha = 1;
  }
}

export function drawWallTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ts: number,
  room: AdventureRoomId,
  tx: number,
  ty: number,
  shade: number,
  contrast: boolean,
  neighbors: { n: boolean; e: boolean; s: boolean; w: boolean },
): void {
  const pal = WING[room];
  ctx.fillStyle = contrast ? shadeColor(pal.wall, 0.15 + shade * 0.95) : shadeColor(pal.wall, 0.12 + shade * 0.88);
  roundRect(ctx, x + 1, y + 1, ts - 2, ts - 2, 5);
  ctx.fill();
  ctx.strokeStyle = shadeColor(pal.wallEdge, shade);
  ctx.lineWidth = 1.2;
  ctx.stroke();
  if (!neighbors.n) {
    ctx.fillStyle = `rgba(244,239,224,${0.08 * shade})`;
    ctx.fillRect(x + 4, y + 3, ts - 8, 3);
  }
  if (room === 'greenhouse') {
    ctx.strokeStyle = pal.moss;
    ctx.globalAlpha = 0.55 * shade;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + ts * 0.2, y + ts - 2);
    ctx.quadraticCurveTo(x + ts * 0.5, y + ts * 0.2, x + ts * 0.85, y + ts * 0.7);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (room === 'signal' && hash2(tx, ty) > 0.55) {
    ctx.fillStyle = LIME;
    ctx.globalAlpha = 0.25 + 0.2 * Math.sin(tx + ty);
    ctx.fillRect(x + 3, y + ts * 0.3, ts - 6, 2);
    ctx.globalAlpha = 1;
  }
  if (room === 'storage' && hash2(tx + 3, ty) > 0.7) {
    ctx.fillStyle = pal.accent;
    ctx.globalAlpha = 0.35 * shade;
    ctx.fillRect(x + ts * 0.2, y + ts * 0.35, ts * 0.6, ts * 0.18);
    ctx.globalAlpha = 1;
  }
}

export function drawWingProps(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ts: number,
  room: AdventureRoomId,
  tx: number,
  ty: number,
  shade: number,
  occupied: boolean,
): void {
  if (occupied) return;
  const n = hash2(tx * 1.7, ty * 2.1);
  if (room === 'storage') {
    if (n > 0.82) stamp(ctx, PROP_URL.crate, x + ts * 0.5, y + ts * 0.55, ts * 0.55, 0.55 * shade);
    else if (n > 0.7) stamp(ctx, PROP_URL.sack, x + ts * 0.55, y + ts * 0.6, ts * 0.5, 0.5 * shade);
  }
  if (room === 'greenhouse' && n > 0.78) {
    stamp(ctx, PROP_URL.vine, x + ts * 0.5, y + ts * 0.5, ts * 0.7, 0.45 * shade);
    if (n > 0.9) {
      ctx.fillStyle = CORAL;
      ctx.globalAlpha = 0.5 * shade;
      ctx.beginPath();
      ctx.arc(x + ts * 0.62, y + ts * 0.32, ts * 0.06, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
  if (room === 'signal' && n > 0.8) {
    stamp(ctx, PROP_URL.panel, x + ts * 0.5, y + ts * 0.5, ts * 0.58, 0.45 * shade);
  }
}

export function drawOdorGlyph(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ts: number,
  odorId: string | undefined,
  classified: boolean,
  falseSignal = false,
): void {
  ctx.save();
  ctx.translate(x, y);
  const s = ts * 0.16;
  if (falseSignal) {
    ctx.strokeStyle = CORAL;
    ctx.lineWidth = 1.6;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(-s, -s);
    ctx.lineTo(s, s);
    ctx.moveTo(s, -s);
    ctx.lineTo(-s, s);
    ctx.stroke();
    ctx.restore();
    return;
  }
  if (!classified || !odorId) {
    ctx.strokeStyle = PURPLE;
    ctx.lineWidth = 1.8;
    ctx.globalAlpha = 0.8;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(0, s * 0.2 - i * s * 0.55, s * (0.45 + i * 0.22), Math.PI * 0.15, Math.PI * 0.85, true);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }
  ctx.strokeStyle = CREAM;
  ctx.fillStyle = LIME;
  ctx.lineWidth = 1.6;
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
    ctx.fill();
  } else if (odorId === 'banana') {
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, s, 0.2, 2.6);
    ctx.stroke();
  } else {
    ctx.fillStyle = CORAL;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawPlayerArt(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ts: number,
  facing: number,
  t: number,
  walking: boolean,
  invuln: boolean,
  hitFlash: boolean,
  reduced: boolean,
): void {
  const bob = reduced ? 0 : Math.sin(t / (walking ? 90 : 420)) * (walking ? 2.2 : 1.1);
  ctx.save();
  ctx.translate(x, y + bob);
  if (Math.cos(facing) < 0) ctx.scale(-1, 1);
  if (invuln) ctx.globalAlpha = 0.45 + 0.35 * Math.abs(Math.sin(t / 70));
  drawShadow(ctx, 0, ts * 0.12, ts * 0.16, ts * 0.1, 0.4);
  ctx.fillStyle = hitFlash ? '#fff' : CREAM;
  roundRect(ctx, -ts * 0.14, -ts * 0.18, ts * 0.28, ts * 0.3, 6);
  ctx.fill();
  ctx.fillStyle = PURPLE;
  roundRect(ctx, -ts * 0.1, -ts * 0.04, ts * 0.2, ts * 0.14, 4);
  ctx.fill();
  ctx.fillStyle = LIME;
  ctx.beginPath();
  ctx.arc(ts * 0.02, 0.02 * ts, ts * 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.fillRect(-ts * 0.12, ts * 0.1, ts * 0.08, ts * 0.1);
  ctx.fillRect(ts * 0.04, ts * 0.1, ts * 0.08, ts * 0.1);
  ctx.fillStyle = LIME;
  ctx.beginPath();
  ctx.moveTo(ts * 0.18, 0);
  ctx.lineTo(ts * 0.08, -5);
  ctx.lineTo(ts * 0.08, 5);
  ctx.fill();
  stamp(ctx, PROP_URL.player, 0, -ts * 0.02, ts * 1.12, hitFlash ? 0.35 : 0.92);
  ctx.restore();
}

export function drawSlash(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ts: number,
  facing: number,
  age: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  if (Math.cos(facing) < 0) ctx.scale(-1, 1);
  ctx.strokeStyle = `rgba(205,231,109,${0.9 * (1 - age)})`;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, ts * (0.28 + age * 0.18), -0.9, 0.9);
  ctx.stroke();
  ctx.strokeStyle = `rgba(244,239,224,${0.7 * (1 - age)})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, ts * (0.22 + age * 0.12), -0.7, 0.7);
  ctx.stroke();
  ctx.restore();
}

export function drawChestArt(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ts: number,
  opened: boolean,
  contrast: boolean,
  shake = 0,
  lid = 0,
  rewardY = 0,
): void {
  ctx.save();
  ctx.translate(x + shake, y);
  drawShadow(ctx, 0, ts * 0.12, ts * 0.18, ts * 0.08, 0.4);
  ctx.fillStyle = opened ? '#6d5a32' : GOLD;
  roundRect(ctx, -ts * 0.18, -ts * 0.02, ts * 0.36, ts * 0.18, 4);
  ctx.fill();
  ctx.strokeStyle = contrast ? '#fff' : '#3b2d12';
  ctx.stroke();
  ctx.save();
  ctx.translate(0, -ts * 0.02);
  ctx.rotate(-lid * 1.1);
  ctx.fillStyle = opened && lid <= 0 ? '#8a6a22' : '#e6c56a';
  roundRect(ctx, -ts * 0.18, -ts * 0.16, ts * 0.36, ts * 0.14, 4);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#3b2d12';
  ctx.fillRect(-3, -2, 6, 8);
  stamp(ctx, opened || lid > 0.4 ? PROP_URL.chestOpen : PROP_URL.chestClosed, 0, 0, ts * 0.95, 0.95);
  if (rewardY > 0) {
    glow(ctx, 0, -ts * 0.2 - rewardY, ts * 0.22, GOLD, 0.55);
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(0, -ts * 0.18 - rewardY, ts * 0.07, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawSporeling(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ts: number,
  t: number,
  hit: boolean,
  reduced: boolean,
): void {
  const squash = reduced ? 1 : 1 + Math.sin(t / 180) * 0.08;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1 + (1 - squash) * 0.4, squash);
  drawShadow(ctx, 0, ts * 0.1, ts * 0.16, ts * 0.08, 0.4);
  ctx.fillStyle = hit ? '#fff' : CORAL;
  ctx.beginPath();
  ctx.ellipse(0, 0, ts * 0.18, ts * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(-ts * 0.06, -ts * 0.03, ts * 0.04, 0, Math.PI * 2);
  ctx.arc(ts * 0.06, -ts * 0.03, ts * 0.04, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = CREAM;
  ctx.beginPath();
  ctx.arc(-ts * 0.05, -ts * 0.045, ts * 0.015, 0, Math.PI * 2);
  ctx.arc(ts * 0.07, -ts * 0.045, ts * 0.015, 0, Math.PI * 2);
  ctx.fill();
  stamp(ctx, PROP_URL.sporeling, 0, 0, ts * 0.72, hit ? 0.4 : 0.95);
  ctx.restore();
}

export function drawVineCrawler(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ts: number,
  t: number,
  revealed: boolean,
  reduced: boolean,
): void {
  const emerge = revealed ? (reduced ? 1 : 0.55 + 0.45 * Math.min(1, (Math.sin(t / 220) + 1) / 2)) : 0.22;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, emerge);
  drawShadow(ctx, 0, ts * 0.08, ts * 0.18, ts * 0.07, 0.35);
  ctx.strokeStyle = revealed ? CORAL : '#2c4a38';
  ctx.lineWidth = ts * 0.07;
  ctx.beginPath();
  ctx.moveTo(-ts * 0.18, ts * 0.1);
  ctx.quadraticCurveTo(0, -ts * 0.22 * emerge, ts * 0.18, ts * 0.1);
  ctx.stroke();
  ctx.fillStyle = revealed ? CORAL : '#2c4a38';
  ctx.beginPath();
  ctx.ellipse(0, -ts * 0.04, ts * 0.1, ts * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
  if (revealed) {
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(-4, -ts * 0.05, 2.2, 0, Math.PI * 2);
    ctx.arc(4, -ts * 0.05, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawNoiseWisp(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ts: number,
  t: number,
  revealed: boolean,
  reduced: boolean,
): void {
  const flick = reduced ? 0.7 : 0.45 + 0.55 * ((Math.sin(t / 70) + 1) / 2);
  glow(ctx, x, y, ts * 0.32, revealed ? LIME : CORAL, 0.35 * flick);
  ctx.fillStyle = revealed ? CREAM : CORAL;
  ctx.globalAlpha = 0.5 + 0.5 * flick;
  ctx.beginPath();
  ctx.arc(x, y, ts * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  if (!reduced) {
    for (let i = 0; i < 5; i += 1) {
      const a = t / 180 + i;
      ctx.fillStyle = revealed ? LIME : CORAL;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * ts * 0.18, y + Math.sin(a * 1.4) * ts * 0.14, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

export function drawNoiseBloomCore(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ts: number,
  t: number,
  trueCore: boolean,
  _scanning: boolean,
  phase: number,
  reduced: boolean,
): void {
  const pulse = reduced ? 1 : 1 + Math.sin(t / 160 + phase) * 0.12;
  const shown = trueCore;
  ctx.strokeStyle = shown ? LIME : CORAL;
  ctx.lineWidth = shown ? 4 : 3;
  ctx.beginPath();
  ctx.arc(x, y, ts * 0.2 * pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = shown ? LIME : 'rgba(238,123,102,0.4)';
  ctx.beginPath();
  ctx.arc(x, y, ts * 0.09 * pulse, 0, Math.PI * 2);
  ctx.fill();
}

export function drawHiddenOutline(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ts: number,
  t: number,
  reduced: boolean,
): void {
  const dash = reduced ? 0 : (t / 40) % 16;
  ctx.save();
  ctx.strokeStyle = LIME;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([6, 5]);
  ctx.lineDashOffset = -dash;
  ctx.strokeRect(x - ts * 0.42, y - ts * 0.42, ts * 0.84, ts * 0.84);
  ctx.restore();
}

export function drawDissolveOverlay(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ts: number,
  progress: number,
  kind: 'wall' | 'vine',
): void {
  ctx.save();
  ctx.globalAlpha = 1 - progress;
  ctx.strokeStyle = kind === 'vine' ? LIME : CREAM;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - ts * 0.3, y - ts * 0.1);
  ctx.lineTo(x + ts * 0.05, y + ts * 0.2);
  ctx.lineTo(x + ts * 0.22, y - ts * 0.25);
  ctx.stroke();
  ctx.fillStyle = kind === 'vine' ? '#3f6b48' : '#2a3348';
  roundRect(ctx, x - ts * 0.4, y - ts * 0.4, ts * 0.8, ts * 0.8, 6);
  ctx.fill();
  ctx.restore();
}

