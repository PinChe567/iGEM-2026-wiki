/**
 * Canvas 2D map / lighting / actor renderer with DPR ≤ 2.
 */

import {
  MAP_V1,
  castVisibility,
  isPointLit,
  type ExplorationSession,
  type GateId,
  type LabyrinthOdorId,
  type VisionCastResult,
} from '@suite/core/labyrinth';
import type { LabyrinthMap, MapTile } from '@suite/core/labyrinth';

export const TILE_SIZE = 48;
const MAX_DPR = 2;

export type RenderPrefs = {
  lowDarkness: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  showDevOverlay: boolean;
};

export type CameraState = {
  x: number;
  y: number;
  zoom: number;
};

export type FrameMetrics = {
  fps: number;
  rayCount: number;
  roomId: string | null;
  gatePermission: string;
};

const GATE_SHAPES: Record<GateId, 'circle' | 'square' | 'triangle' | 'diamond' | 'hex' | 'cross'> = {
  A: 'circle',
  B: 'square',
  C: 'triangle',
  D: 'diamond',
  E: 'hex',
  F: 'cross',
};

export function createRenderer(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2d context unavailable');

  let cssWidth = 0;
  let cssHeight = 0;
  let dpr = 1;
  let tileGrid: MapTile[][] = [];

  const rebuildGrid = (map: LabyrinthMap) => {
    tileGrid = Array.from({ length: map.height }, () =>
      Array.from({ length: map.width }, () => undefined as unknown as MapTile),
    );
    for (const tile of map.tiles) {
      tileGrid[tile.y]![tile.x] = tile;
    }
  };
  rebuildGrid(MAP_V1);

  const resize = (cssW: number, cssH: number) => {
    cssWidth = Math.max(1, Math.floor(cssW));
    cssHeight = Math.max(1, Math.floor(cssH));
    dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const worldToScreen = (camera: CameraState, x: number, y: number) => ({
    x: (x - camera.x) * TILE_SIZE * camera.zoom + cssWidth / 2,
    y: (y - camera.y) * TILE_SIZE * camera.zoom + cssHeight / 2,
  });

  const screenToWorld = (camera: CameraState, sx: number, sy: number) => ({
    x: (sx - cssWidth / 2) / (TILE_SIZE * camera.zoom) + camera.x,
    y: (sy - cssHeight / 2) / (TILE_SIZE * camera.zoom) + camera.y,
  });

  const clientToWorld = (
    camera: CameraState,
    clientX: number,
    clientY: number,
  ) => {
    const rect = canvas.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    return screenToWorld(camera, sx, sy);
  };

  const ROOM_FLOOR_TINT: Record<string, string> = {
    room_central: '#2e3a34',
    room_corridor_north: '#2a3038',
    room_review: '#3a2e28',
    room_scanner: '#24383a',
    room_spawn_sw: '#2a3340',
    room_spawn_se: '#2a3340',
    room_task_a: '#2f3a2c',
    room_task_b: '#35322c',
    room_task_c: '#322e3a',
    room_task_d: '#3a2e32',
    room_task_e: '#2c3538',
    room_task_f: '#38302c',
  };

  const shadeHex = (hex: string, delta: number): string => {
    const n = hex.replace('#', '');
    if (n.length !== 6) return hex;
    const clamp = (v: number) => Math.max(0, Math.min(255, v));
    const r = clamp(parseInt(n.slice(0, 2), 16) + delta);
    const g = clamp(parseInt(n.slice(2, 4), 16) + delta);
    const b = clamp(parseInt(n.slice(4, 6), 16) + delta);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  /** Per-room floor pattern so each chamber reads differently under the flashlight. */
  const roomFloorColor = (tile: MapTile): string => {
    const base = ROOM_FLOOR_TINT[tile.roomId ?? ''] ?? '#2a332e';
    const id = tile.roomId ?? '';
    const parity = (tile.x + tile.y) & 1;
    if (id.startsWith('room_task_')) {
      return parity ? base : shadeHex(base, 14);
    }
    if (id === 'room_scanner') {
      return parity ? base : shadeHex(base, 10);
    }
    if (id === 'room_review') {
      return tile.x % 2 === 0 ? base : shadeHex(base, -10);
    }
    if (id === 'room_corridor_north') {
      return tile.y % 2 === 0 ? base : shadeHex(base, 8);
    }
    return base;
  };

  const tileColor = (tile: MapTile, prefs: RenderPrefs): string => {
    if (prefs.highContrast) {
      if (tile.kind === 'wall') return '#000';
      if (tile.kind === 'gate') return '#ff0';
      if (tile.kind === 'door') return '#f80';
      if (tile.kind === 'task') return '#0f0';
      if (tile.kind === 'spawn') return '#0ff';
      if (tile.kind === 'scanner') return '#0af';
      if (tile.kind === 'review') return '#f0f';
      return '#222';
    }
    switch (tile.kind) {
      case 'wall':
        return '#141a17';
      case 'floor':
        return roomFloorColor(tile);
      case 'gate':
        return '#b8923f';
      case 'door':
        return '#8a6238';
      case 'spawn':
        return '#3d5c8a';
      case 'task':
        return '#3f7a55';
      case 'scanner':
        return '#3a7a82';
      case 'review':
        return '#7a4e3d';
      default:
        return '#222';
    }
  };

  const drawGateGlyph = (
    x: number,
    y: number,
    size: number,
    gateId: GateId,
    tMs: number,
    reducedMotion: boolean,
  ) => {
    const pulse = reducedMotion ? 1 : 1 + Math.sin(tMs / 220) * 0.06;
    const s = size * 0.32 * pulse;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#1a1408';
    ctx.strokeStyle = '#f3e2a7';
    ctx.lineWidth = 2;
    const shape = GATE_SHAPES[gateId];
    ctx.beginPath();
    if (shape === 'circle') ctx.arc(0, 0, s, 0, Math.PI * 2);
    else if (shape === 'square') ctx.rect(-s, -s, s * 2, s * 2);
    else if (shape === 'triangle') {
      ctx.moveTo(0, -s);
      ctx.lineTo(s, s);
      ctx.lineTo(-s, s);
      ctx.closePath();
    } else if (shape === 'diamond') {
      ctx.moveTo(0, -s);
      ctx.lineTo(s, 0);
      ctx.lineTo(0, s);
      ctx.lineTo(-s, 0);
      ctx.closePath();
    } else if (shape === 'hex') {
      for (let i = 0; i < 6; i += 1) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        const px = Math.cos(a) * s;
        const py = Math.sin(a) * s;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    } else {
      ctx.moveTo(-s, 0);
      ctx.lineTo(s, 0);
      ctx.moveTo(0, -s);
      ctx.lineTo(0, s);
    }
    if (shape !== 'cross') {
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.stroke();
    }
    ctx.fillStyle = '#fff8d6';
    ctx.font = `bold ${Math.floor(size * 0.28)}px ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(gateId, 0, 0);
    ctx.restore();
  };

  const drawLightingMask = (
    camera: CameraState,
    vision: VisionCastResult,
    prefs: RenderPrefs,
  ) => {
    // Outside cone: dark. Inside cone: destination-out reveals original map colors only.
    const darkness = prefs.lowDarkness ? 0.75 : 0.92;
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${darkness})`;
    ctx.fillRect(0, 0, cssWidth, cssHeight);
    ctx.globalCompositeOperation = 'destination-out';

    const punchSolid = (rays: typeof vision.coneRays) => {
      if (rays.length === 0) return;
      const origin = worldToScreen(camera, vision.origin.x, vision.origin.y);
      ctx.beginPath();
      ctx.moveTo(origin.x, origin.y);
      for (const ray of rays) {
        const p = worldToScreen(camera, ray.hitX, ray.hitY);
        ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.fill();
    };

    // Tiny personal glow at feet only.
    const origin = worldToScreen(camera, vision.origin.x, vision.origin.y);
    const r = 0.42 * TILE_SIZE * camera.zoom;
    const grad = ctx.createRadialGradient(origin.x, origin.y, 0, origin.x, origin.y, r);
    grad.addColorStop(0, 'rgba(0,0,0,1)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(origin.x, origin.y, r, 0, Math.PI * 2);
    ctx.fill();

    punchSolid(vision.coneRays);
    ctx.restore();
  };

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const render = (
    session: ExplorationSession,
    camera: CameraState,
    alpha: number,
    prefs: RenderPrefs,
    metrics: FrameMetrics,
  ): VisionCastResult => {
    const map = session.map;
    const px = lerp(session.player.prevPosition.x, session.player.position.x, alpha);
    const py = lerp(session.player.prevPosition.y, session.player.position.y, alpha);
    const facing = session.player.facing;

    ctx.clearRect(0, 0, cssWidth, cssHeight);
    ctx.fillStyle = '#0b0e0c';
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    const viewTilesX = cssWidth / (TILE_SIZE * camera.zoom) + 2;
    const viewTilesY = cssHeight / (TILE_SIZE * camera.zoom) + 2;
    const minTX = Math.max(0, Math.floor(camera.x - viewTilesX / 2));
    const maxTX = Math.min(map.width - 1, Math.ceil(camera.x + viewTilesX / 2));
    const minTY = Math.max(0, Math.floor(camera.y - viewTilesY / 2));
    const maxTY = Math.min(map.height - 1, Math.ceil(camera.y + viewTilesY / 2));

    for (let ty = minTY; ty <= maxTY; ty += 1) {
      for (let tx = minTX; tx <= maxTX; tx += 1) {
        const tile = tileGrid[ty]?.[tx];
        if (!tile) continue;
        const tl = worldToScreen(camera, tx, ty);
        const size = TILE_SIZE * camera.zoom;
        ctx.fillStyle = tileColor(tile, prefs);
        ctx.fillRect(tl.x, tl.y, size + 0.5, size + 0.5);

        if (tile.kind === 'door') {
          const open = session.doors.get(tile.doorId ?? '') !== false;
          ctx.fillStyle = open ? 'rgba(120,200,120,0.35)' : 'rgba(200,80,60,0.55)';
          ctx.fillRect(tl.x, tl.y, size, size);
        }
        if (tile.kind === 'gate' && tile.gateId) {
          drawGateGlyph(
            tl.x + size / 2,
            tl.y + size / 2,
            size,
            tile.gateId,
            session.simTimeMs,
            prefs.reducedMotion,
          );
        }
      }
    }

    // Room labels (near camera) — keep readable after darkness punch.
    ctx.save();
    ctx.globalAlpha = prefs.highContrast ? 0.95 : 0.55;
    ctx.fillStyle = '#e8efe9';
    ctx.font = `600 ${Math.max(11, 12 * camera.zoom)}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    for (const room of map.rooms) {
      const tiles = map.tiles.filter((t) => t.roomId === room.id && t.kind !== 'wall');
      if (tiles.length === 0) continue;
      const cx = tiles.reduce((s, t) => s + t.x, 0) / tiles.length + 0.5;
      const cy = tiles.reduce((s, t) => s + t.y, 0) / tiles.length + 0.5;
      if (Math.hypot(cx - camera.x, cy - camera.y) > 12) continue;
      const p = worldToScreen(camera, cx, cy);
      ctx.fillText(
        document.documentElement.lang === 'zh-Hant'
          ? room.name['zh-Hant'] || room.name.en
          : room.name.en,
        p.x,
        p.y,
      );
    }
    ctx.restore();

    const vision = castVisibility(map, { x: px, y: py }, facing, {
      coneRayCount: prefs.reducedMotion ? 32 : 56,
      haloRayCount: prefs.reducedMotion ? 12 : 16,
      haloRadius: 0.35,
    });

    drawLightingMask(camera, vision, prefs);

    // Actors above darkness so NPCs stay findable; bright only in flashlight.
    const drawActor = (
      x: number,
      y: number,
      color: string,
      label: string,
      opts?: { aim?: number; always?: boolean; threat?: boolean; phantom?: boolean },
    ) => {
      const lit =
        Boolean(opts?.always) ||
        isPointLit(map, { x: px, y: py }, facing, { x, y }, { haloRadius: 0.45 });
      const p = worldToScreen(camera, x, y);
      const r = 0.3 * TILE_SIZE * camera.zoom;
      if (p.x < -40 || p.y < -40 || p.x > cssWidth + 40 || p.y > cssHeight + 40) {
        return;
      }
      ctx.save();
      if (opts?.threat) {
        ctx.strokeStyle = 'rgba(255,80,80,0.9)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 1.85, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = lit || opts?.always ? 1 : opts?.phantom ? 0.72 : 0.5;
      ctx.fillStyle = lit ? color : opts?.phantom ? '#c45a6a' : '#8a7a88';
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      if (opts?.aim != null) {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#ffe9a8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(
          p.x + Math.cos(opts.aim) * r * 2.2,
          p.y + Math.sin(opts.aim) * r * 2.2,
        );
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff';
      ctx.font = `${Math.max(9, 10 * camera.zoom)}px ui-monospace, monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(label, p.x, p.y - r - 4);
      ctx.restore();
    };

    for (const npc of session.debugActors) {
      // Only reveal "hostile" styling while chasing — never spoil who the phantom is.
      const hunting = Boolean(npc.threat);
      drawActor(npc.x, npc.y, hunting ? '#d16a7a' : '#9b6b8a', npc.label, {
        threat: hunting,
        phantom: hunting,
      });
    }
    drawActor(
      px,
      py,
      '#6ecf8a',
      document.documentElement.lang === 'zh-Hant' ? '\u4f60' : 'YOU',
      { aim: facing, always: true },
    );

    // Objective markers drawn above darkness so the player can navigate.
    const zh = document.documentElement.lang === 'zh-Hant';
    for (const tile of map.tiles) {
      if (tile.kind !== 'scanner' && tile.kind !== 'door' && tile.kind !== 'task') continue;
      const p = worldToScreen(camera, tile.x + 0.5, tile.y + 0.5);
      if (p.x < -20 || p.y < -20 || p.x > cssWidth + 20 || p.y > cssHeight + 20) continue;
      const pulse = prefs.reducedMotion ? 1 : 0.65 + 0.35 * Math.sin(session.simTimeMs / 280);
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.35 * pulse;
      if (tile.kind === 'scanner') {
        ctx.fillStyle = '#5ec4d1';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - 8);
        ctx.lineTo(p.x + 7, p.y);
        ctx.lineTo(p.x, p.y + 8);
        ctx.lineTo(p.x - 7, p.y);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = '#dff8ff';
        ctx.font = `bold ${Math.max(10, 11 * camera.zoom)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(zh ? '\u6383\u63cf' : 'SCAN', p.x, p.y - 12);
      } else if (tile.kind === 'door') {
        ctx.fillStyle = '#e2b36a';
        ctx.fillRect(p.x - 4, p.y - 5, 8, 10);
      } else if (tile.kind === 'task') {
        ctx.fillStyle = '#6ecf8a';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (prefs.showDevOverlay) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(8, 8, 220, 92);
      ctx.fillStyle = '#b8f5c8';
      ctx.font = '12px ui-monospace, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`FPS ${metrics.fps.toFixed(0)}`, 16, 28);
      ctx.fillText(`rays ${metrics.rayCount}`, 16, 44);
      ctx.fillText(`room ${metrics.roomId ?? '—'}`, 16, 60);
      ctx.fillText(`gate ${metrics.gatePermission}`, 16, 76);
      ctx.fillText(`pos ${px.toFixed(2)},${py.toFixed(2)}`, 16, 92);
    }

    return vision;
  };

  return {
    resize,
    render,
    clientToWorld,
    worldToScreen,
    getSize: () => ({ cssWidth, cssHeight, dpr }),
  };
}

export type LabyrinthRenderer = ReturnType<typeof createRenderer>;

export function odorShort(id: LabyrinthOdorId): string {
  return id.slice(0, 3).toUpperCase();
}
