import {
  MAP_V1,
  validateMap,
  computeReachability,
  LABYRINTH_ODOR_IDS,
  type LabyrinthOdorId,
} from '@suite/core/labyrinth';
import type { Locale } from '../../../src/i18n/locale';

const CELL = 22;

type OverlayMode = 'none' | 'rooms' | 'gates' | 'reach';

const copy = {
  'zh-Hant': {
    title: '暗域嗅蹤 · 地圖驗證（開發用）',
    lead: '僅用於檢查 tile / room / gate / 可達性。非正式遊戲畫面。',
    validation: '驗證結果',
    overlay: '疊加層',
    role: '可達性角色',
    spawn: '起點 spawn',
    none: '無',
    rooms: '房間',
    gates: 'Gate',
    reach: '可達性',
    pass: '通過',
    fail: '失敗',
  },
  en: {
    title: 'Scentbound Labyrinth · Map validator (dev)',
    lead: 'Inspect tiles, rooms, gates, and reachability. Not the playable client.',
    validation: 'Validation',
    overlay: 'Overlay',
    role: 'Reachability role',
    spawn: 'Spawn origin',
    none: 'None',
    rooms: 'Rooms',
    gates: 'Gates',
    reach: 'Reachability',
    pass: 'PASS',
    fail: 'FAIL',
  },
} as const;

const ROOM_COLORS: Record<string, string> = {
  room_central: '#3d5a4c',
  room_corridor_north: '#4a6741',
  room_review: '#6b4f3a',
  room_scanner: '#3a556b',
  room_spawn_sw: '#5a4a6b',
  room_spawn_se: '#5a4a6b',
  room_task_a: '#7a5a2a',
  room_task_b: '#7a5a2a',
  room_task_c: '#7a5a2a',
  room_task_d: '#7a5a2a',
  room_task_e: '#7a5a2a',
  room_task_f: '#7a5a2a',
};

function tileFill(kind: string): string {
  switch (kind) {
    case 'wall':
      return '#1a1f1c';
    case 'floor':
      return '#2c3530';
    case 'gate':
      return '#c4a35a';
    case 'door':
      return '#8b6b4a';
    case 'spawn':
      return '#5b8def';
    case 'task':
      return '#6ecf8a';
    case 'scanner':
      return '#5ec4d1';
    case 'review':
      return '#d17a5e';
    default:
      return '#333';
  }
}

export function paintValidator(root: HTMLElement, locale: Locale): void {
  const t = copy[locale];
  const result = validateMap(MAP_V1);

  root.innerHTML = `
    <section class="lv-intro">
      <p class="lv-dev-badge">DEV ONLY</p>
      <h1>${t.title}</h1>
      <p>${t.lead}</p>
      <p class="lv-version">mapVersion ${MAP_V1.mapVersion} · ${MAP_V1.width}×${MAP_V1.height}</p>
    </section>
    <section class="lv-controls" aria-label="${t.overlay}">
      <label>
        ${t.overlay}
        <select data-overlay>
          <option value="none">${t.none}</option>
          <option value="rooms">${t.rooms}</option>
          <option value="gates">${t.gates}</option>
          <option value="reach">${t.reach}</option>
        </select>
      </label>
      <label>
        ${t.role}
        <select data-role>
          ${LABYRINTH_ODOR_IDS.map((id) => `<option value="${id}">${id}</option>`).join('')}
        </select>
      </label>
      <label>
        ${t.spawn}
        <select data-spawn>
          ${MAP_V1.spawns.map((s) => `<option value="${s.id}">${s.id} (${s.x},${s.y})</option>`).join('')}
        </select>
      </label>
    </section>
    <section class="lv-stage">
      <canvas data-map width="${MAP_V1.width * CELL}" height="${MAP_V1.height * CELL}"></canvas>
      <aside class="lv-panel">
        <h2>${t.validation}</h2>
        <p class="${result.ok ? 'lv-pass' : 'lv-fail'}">${result.ok ? t.pass : t.fail} (${result.issues.length})</p>
        <ul data-issues>
          ${
            result.issues.length === 0
              ? '<li>—</li>'
              : result.issues
                  .map((issue) => `<li><code>${issue.code}</code> ${issue.message}</li>`)
                  .join('')
          }
        </ul>
        <h2>Rooms</h2>
        <ul>
          ${MAP_V1.rooms
            .map(
              (room) =>
                `<li><code>${room.id}</code> ${room.name[locale] ?? room.name.en} (${room.kind})</li>`,
            )
            .join('')}
        </ul>
        <h2>Gates</h2>
        <ul>
          ${MAP_V1.gates
            .map((gate) => `<li><code>${gate.id}</code> → ${gate.toRoomId}</li>`)
            .join('')}
        </ul>
      </aside>
    </section>
  `;

  const canvas = root.querySelector<HTMLCanvasElement>('canvas[data-map]')!;
  const overlaySelect = root.querySelector<HTMLSelectElement>('select[data-overlay]')!;
  const roleSelect = root.querySelector<HTMLSelectElement>('select[data-role]')!;
  const spawnSelect = root.querySelector<HTMLSelectElement>('select[data-spawn]')!;

  const redraw = () => {
    drawMap(canvas, {
      overlay: overlaySelect.value as OverlayMode,
      odorId: roleSelect.value as LabyrinthOdorId,
      spawnId: spawnSelect.value,
    });
  };

  overlaySelect.addEventListener('change', redraw);
  roleSelect.addEventListener('change', redraw);
  spawnSelect.addEventListener('change', redraw);
  redraw();
}

function drawMap(
  canvas: HTMLCanvasElement,
  opts: { overlay: OverlayMode; odorId: LabyrinthOdorId; spawnId: string },
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const spawn = MAP_V1.spawns.find((s) => s.id === opts.spawnId) ?? MAP_V1.spawns[0]!;
  const reach =
    opts.overlay === 'reach'
      ? computeReachability(MAP_V1, { x: spawn.x, y: spawn.y }, { odorId: opts.odorId })
      : null;

  for (const tile of MAP_V1.tiles) {
    const x = tile.x * CELL;
    const y = tile.y * CELL;
    if (opts.overlay === 'rooms') {
      ctx.fillStyle = ROOM_COLORS[tile.roomId] ?? '#445';
    } else {
      ctx.fillStyle = tileFill(tile.kind);
    }
    ctx.fillRect(x, y, CELL, CELL);

    if (reach?.reachable.has(`${tile.x},${tile.y}`)) {
      ctx.fillStyle = 'rgba(110, 207, 138, 0.35)';
      ctx.fillRect(x, y, CELL, CELL);
    }

    if (opts.overlay === 'gates' && tile.kind === 'gate') {
      ctx.fillStyle = '#f0d78c';
      ctx.fillRect(x, y, CELL, CELL);
    }

    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.strokeRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1);

    if (tile.kind === 'gate' && tile.gateId) {
      ctx.fillStyle = '#111';
      ctx.font = 'bold 12px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tile.gateId, x + CELL / 2, y + CELL / 2);
    }
  }

  // Spawn markers
  for (const s of MAP_V1.spawns) {
    ctx.strokeStyle = s.id === spawn.id ? '#fff' : '#5b8def';
    ctx.lineWidth = 2;
    ctx.strokeRect(s.x * CELL + 2, s.y * CELL + 2, CELL - 4, CELL - 4);
  }
}
