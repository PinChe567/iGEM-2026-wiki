import { buildAdventureMinimap, type AdventureSession } from '@suite/core/labyrinth';
import { GOLD, LIME, roundRect } from './art';

function exploredAt(
  explored: readonly boolean[],
  width: number,
  pos: { x: number; y: number } | null,
): boolean {
  if (!pos) return false;
  const x = Math.floor(pos.x);
  const y = Math.floor(pos.y);
  if (x < 0 || y < 0 || x >= width) return false;
  return explored[y * width + x] === true;
}

/** Fog-of-war tile map of explored maze cells. Secrets stay hidden. */
export function paintHubMinimap(
  ctx: CanvasRenderingContext2D,
  session: AdventureSession,
  ox: number,
  oy: number,
  mw: number,
  mh: number,
): void {
  const mini = buildAdventureMinimap(session);
  ctx.save();
  ctx.fillStyle = 'rgba(8, 12, 20, 0.94)';
  roundRect(ctx, ox, oy, mw, mh, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(205, 231, 109, 0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();

  const inner = 8;
  const gw = mw - inner * 2;
  const gh = mh - inner * 2;
  const cell = Math.min(gw / mini.width, gh / mini.height);
  const gx = ox + inner + (gw - cell * mini.width) / 2;
  const gy = oy + inner + (gh - cell * mini.height) / 2;

  for (let y = 0; y < mini.height; y += 1) {
    for (let x = 0; x < mini.width; x += 1) {
      const idx = y * mini.width + x;
      if (!mini.explored[idx]) continue;
      ctx.fillStyle = mini.walls[idx] ? '#4b5c78' : '#e4d9c0';
      ctx.fillRect(gx + x * cell, gy + y * cell, Math.ceil(cell + 0.4), Math.ceil(cell + 0.4));
    }
  }

  const dot = (pos: { x: number; y: number } | null, color: string, radius: number) => {
    if (!pos) return;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(gx + pos.x * cell, gy + pos.y * cell, Math.max(radius, cell * 0.42), 0, Math.PI * 2);
    ctx.fill();
  };

  for (const cp of mini.checkpoints) dot(cp, '#89c4ff', 2);
  if (exploredAt(mini.explored, mini.width, mini.exit)) dot(mini.exit, GOLD, 3.2);
  if (exploredAt(mini.explored, mini.width, mini.objective)) dot(mini.objective, '#5ec4d1', 3.2);

  ctx.fillStyle = LIME;
  ctx.beginPath();
  ctx.arc(gx + mini.player.x * cell, gy + mini.player.y * cell, Math.max(3.4, cell * 0.58), 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0b1018';
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.restore();
}
