import {
  SPECTRUM_CONTENT_VERSION,
  SPECTRUM_ODOR_IDS,
  signatureMap,
  spectrumContentCatalog,
} from '@suite/content';
import {
  SPECTRUM_RULE_VERSION,
  SPECTRUM_RULES,
  buildPuzzle,
  computeSignals,
  enumerateLegalMixtures,
  filterCandidates,
  getPreset,
  mixtureKey,
  mixturesEqual,
  scoreAB,
  signalFitScore,
  parseDifficultyId,
  type CanonicalMixture,
  type DifficultyId,
  type FeedbackEntry,
} from '@suite/core/spectrum';
import type { Locale } from '../../../src/i18n/locale';

const SIGS = signatureMap();
const ALL_IDS = [...SPECTRUM_ODOR_IDS];

const copy = {
  'zh-Hant': {
    title: '混香解碼局 · 訊號檢視（開發用）',
    lead: '檢視 12 channel bars、連線 curve、linear／saturation 差異與 candidate 數量。非正式玩家介面。',
    disclaimer: spectrumContentCatalog.modelDisclaimer['zh-Hant'],
    seed: 'Seed',
    difficulty: '模式',
    rebuild: '重建謎題',
    truth: 'Truth',
    truthPick: '選擇 Truth',
    truthFromSeed: '依 seed 自動選 Truth',
    candidates: '候選數量',
    legal: '合法 mixture 總數',
    fit: '訊號吻合度（對 truth 重算）',
    bars: '12 channel bars（observed）',
    curve: '連線 curve（channel index → response）',
    axisNote: 'X 軸為 channel index（0–11），不是時間或頻率。',
    linear: 'Linear',
    saturated: 'Saturated',
    observed: 'Observed',
    probe: '試猜（篩選候選）',
    applyProbe: '套用 A/B 回饋',
    resetHistory: '清除回饋',
    history: '回饋歷程',
    easy: '簡單',
    hard: '困難',
    junior: '兒童',
    standard: '標準',
    challenge: '挑戰',
  },
  en: {
    title: 'Scent Spectrum · Signal visualizer (dev)',
    lead: 'Inspect 12 channel bars, polyline curve, linear vs saturation, and candidate count. Not the player UI.',
    disclaimer: spectrumContentCatalog.modelDisclaimer.en,
    seed: 'Seed',
    difficulty: 'Mode',
    rebuild: 'Rebuild puzzle',
    truth: 'Truth',
    truthPick: 'Select truth',
    truthFromSeed: 'Auto truth from seed',
    candidates: 'Candidate count',
    legal: 'Legal mixtures',
    fit: 'Signal fit (recomputed truth)',
    bars: '12 channel bars (observed)',
    curve: 'Polyline curve (channel index → response)',
    axisNote: 'X-axis is channel index (0–11), not time or frequency.',
    linear: 'Linear',
    saturated: 'Saturated',
    observed: 'Observed',
    probe: 'Probe guess (filter candidates)',
    applyProbe: 'Apply A/B feedback',
    resetHistory: 'Clear feedback',
    history: 'Feedback history',
    easy: 'Easy',
    hard: 'Hard',
    junior: 'Junior',
    standard: 'Standard',
    challenge: 'Challenge',
  },
} as const;

type State = {
  seed: string;
  difficulty: DifficultyId;
  /** null ⇒ use seed-picked truth; otherwise override from legal list. */
  truthKey: string | null;
  history: FeedbackEntry[];
};

function formatMixture(m: CanonicalMixture): string {
  return m.components.map((c) => `${c.odorId} ${c.percent}%`).join(' + ');
}

function drawBars(
  canvas: HTMLCanvasElement,
  series: Array<{ label: string; values: readonly number[]; color: string }>,
): void {
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || 640;
  const cssH = canvas.clientHeight || 220;
  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);

  const pad = { l: 36, r: 12, t: 16, b: 28 };
  const plotW = cssW - pad.l - pad.r;
  const plotH = cssH - pad.t - pad.b;
  const n = 12;
  const groupW = plotW / n;
  const barW = Math.max(4, (groupW - 8) / series.length);

  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  ctx.moveTo(pad.l, pad.t);
  ctx.lineTo(pad.l, pad.t + plotH);
  ctx.lineTo(pad.l + plotW, pad.t + plotH);
  ctx.stroke();

  for (let j = 0; j < n; j += 1) {
    const x0 = pad.l + j * groupW + 4;
    series.forEach((s, si) => {
      const v = s.values[j] ?? 0;
      const h = Math.max(0, Math.min(1, v)) * plotH;
      ctx.fillStyle = s.color;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(x0 + si * barW, pad.t + plotH - h, barW - 1, h);
      ctx.globalAlpha = 1;
    });
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '11px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(String(j), x0 + (series.length * barW) / 2, cssH - 8);
  }
}

function drawCurve(
  canvas: HTMLCanvasElement,
  series: Array<{ values: readonly number[]; color: string }>,
): void {
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || 640;
  const cssH = canvas.clientHeight || 200;
  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);

  const pad = { l: 36, r: 12, t: 16, b: 28 };
  const plotW = cssW - pad.l - pad.r;
  const plotH = cssH - pad.t - pad.b;
  const n = 12;

  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  ctx.moveTo(pad.l, pad.t);
  ctx.lineTo(pad.l, pad.t + plotH);
  ctx.lineTo(pad.l + plotW, pad.t + plotH);
  ctx.stroke();

  for (const s of series) {
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let j = 0; j < n; j += 1) {
      const x = pad.l + (j / (n - 1)) * plotW;
      const y = pad.t + plotH - Math.max(0, Math.min(1, s.values[j] ?? 0)) * plotH;
      if (j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '11px ui-monospace, monospace';
  ctx.textAlign = 'center';
  for (let j = 0; j < n; j += 1) {
    const x = pad.l + (j / (n - 1)) * plotW;
    ctx.fillText(String(j), x, cssH - 8);
  }
}

export function paintVisualizer(root: HTMLElement, locale: Locale): void {
  const t = copy[locale];
  const state: State = {
    seed: 'dev-spectrum-1',
    difficulty: 'easy',
    truthKey: null,
    history: [],
  };

  root.innerHTML = `
    <section class="sv-intro">
      <p class="sv-dev-badge">DEV ONLY</p>
      <h1>${t.title}</h1>
      <p>${t.lead}</p>
      <p class="sv-disclaimer">${t.disclaimer}</p>
      <p class="sv-version">ruleVersion ${SPECTRUM_RULE_VERSION} · contentVersion ${SPECTRUM_CONTENT_VERSION} · k=${SPECTRUM_RULES.saturationK}</p>
    </section>

    <section class="sv-controls" aria-label="controls">
      <label>${t.seed}
        <input data-seed type="text" value="${state.seed}" />
      </label>
      <label>${t.difficulty}
        <select data-difficulty>
          <option value="junior">${t.junior}</option>
          <option value="easy" selected>${t.standard}</option>
          <option value="hard">${t.challenge}</option>
        </select>
      </label>
      <label class="sv-truth-label">${t.truthPick}
        <select data-truth></select>
      </label>
      <button type="button" data-rebuild class="sv-btn">${t.rebuild}</button>
      <button type="button" data-reset class="sv-btn sv-btn-ghost">${t.resetHistory}</button>
    </section>

    <section class="sv-meta" data-meta></section>

    <section class="sv-charts">
      <div>
        <h2>${t.bars}</h2>
        <canvas data-bars class="sv-canvas" width="640" height="220"></canvas>
      </div>
      <div>
        <h2>${t.curve}</h2>
        <p class="sv-axis-note">${t.axisNote}</p>
        <canvas data-curve class="sv-canvas" width="640" height="200"></canvas>
        <ul class="sv-legend">
          <li><span class="sv-swatch" style="background:#6ecf8a"></span>${t.linear}</li>
          <li><span class="sv-swatch" style="background:#5ec4d1"></span>${t.saturated}</li>
          <li><span class="sv-swatch" style="background:#c4a35a"></span>${t.observed}</li>
        </ul>
      </div>
    </section>

    <section class="sv-probe">
      <h2>${t.probe}</h2>
      <p data-probe-hint class="sv-hint"></p>
      <div class="sv-probe-row">
        <select data-probe-pick></select>
        <button type="button" data-apply-probe class="sv-btn">${t.applyProbe}</button>
      </div>
      <div data-history class="sv-history"></div>
    </section>
  `;

  const seedInput = root.querySelector<HTMLInputElement>('[data-seed]')!;
  const diffSelect = root.querySelector<HTMLSelectElement>('[data-difficulty]')!;
  const truthSelect = root.querySelector<HTMLSelectElement>('[data-truth]')!;
  const meta = root.querySelector<HTMLElement>('[data-meta]')!;
  const bars = root.querySelector<HTMLCanvasElement>('[data-bars]')!;
  const curve = root.querySelector<HTMLCanvasElement>('[data-curve]')!;
  const probePick = root.querySelector<HTMLSelectElement>('[data-probe-pick]')!;
  const probeHint = root.querySelector<HTMLElement>('[data-probe-hint]')!;
  const historyEl = root.querySelector<HTMLElement>('[data-history]')!;

  let syncingTruth = false;

  function currentTruthAndSignals(): {
    truth: CanonicalMixture;
    linear: readonly number[];
    saturated: readonly number[] | null;
    observed: readonly number[];
    legal: CanonicalMixture[];
    legalCount: number;
    model: string;
  } {
    state.seed = seedInput.value.trim() || 'dev-spectrum-1';
    state.difficulty = parseDifficultyId(diffSelect.value);
    const preset = getPreset(state.difficulty);
    const legal = enumerateLegalMixtures({ odorIds: ALL_IDS, preset });
    const seeded = buildPuzzle({
      seed: state.seed,
      difficulty: state.difficulty,
      signatures: SIGS,
      odorIds: ALL_IDS,
      contentVersion: SPECTRUM_CONTENT_VERSION,
    });

    let truth = seeded.truth;
    if (state.truthKey) {
      const override = legal.find((m) => mixtureKey(m) === state.truthKey);
      if (override) truth = override;
      else state.truthKey = null;
    }

    const signals = state.truthKey
      ? computeSignals(truth, SIGS, preset.mixingModel, state.seed)
      : {
          linear: [...seeded.linearSignal],
          saturated: seeded.saturatedSignal ? [...seeded.saturatedSignal] : null,
          observed: [...seeded.observedSignal],
        };

    return {
      truth,
      linear: signals.linear,
      saturated: signals.saturated,
      observed: signals.observed,
      legal,
      legalCount: legal.length,
      model: preset.mixingModel,
    };
  }

  function refresh(): void {
    const snap = currentTruthAndSignals();
    const poolIds = ALL_IDS.slice(0, getPreset(state.difficulty).odorCount);
    const candidates = filterCandidates(snap.legal, {
      history: state.history,
      poolIds,
      observedSignal: snap.observed,
      signatures: SIGS,
      difficulty: state.difficulty,
      seed: state.seed,
    });

    const recomputedFit = signalFitScore(
      snap.observed,
      computeSignals(
        snap.truth,
        SIGS,
        getPreset(state.difficulty).mixingModel,
        state.seed,
      ).observed,
    );

    meta.innerHTML = `
      <div><strong>${t.truth}:</strong> ${formatMixture(snap.truth)}</div>
      <div><strong>${t.legal}:</strong> ${snap.legalCount}</div>
      <div><strong>${t.candidates}:</strong> ${candidates.length}</div>
      <div><strong>${t.fit}:</strong> ${recomputedFit}</div>
      <div><strong>model:</strong> ${snap.model}</div>
    `;

    const saturated = snap.saturated ?? snap.linear;
    drawBars(bars, [
      { label: 'linear', values: snap.linear, color: '#6ecf8a' },
      { label: 'saturated', values: saturated, color: '#5ec4d1' },
      { label: 'observed', values: snap.observed, color: '#c4a35a' },
    ]);
    drawCurve(curve, [
      { values: snap.linear, color: '#6ecf8a' },
      { values: saturated, color: '#5ec4d1' },
      { values: snap.observed, color: '#c4a35a' },
    ]);

    const options = snap.legal.slice(0, 120);
    syncingTruth = true;
    truthSelect.innerHTML =
      `<option value="">${t.truthFromSeed}</option>` +
      options
        .map((m) => {
          const key = mixtureKey(m);
          const selected =
            state.truthKey === key ||
            (!state.truthKey && mixturesEqual(m, snap.truth));
          return `<option value="${key}"${selected ? ' selected' : ''}>${formatMixture(m)}</option>`;
        })
        .join('');
    if (!state.truthKey) truthSelect.value = '';
    syncingTruth = false;

    probePick.innerHTML = options
      .map((m) => `<option value="${mixtureKey(m)}">${formatMixture(m)}</option>`)
      .join('');
    probeHint.textContent = `pool=${poolIds.length} · showing first ${options.length} / ${snap.legalCount} legal mixtures`;

    historyEl.innerHTML =
      state.history.length === 0
        ? `<p class="sv-hint">${t.history}: —</p>`
        : `<ol>${state.history
            .map(
              (h) =>
                `<li>${formatMixture(h.guess)} → ${h.ab.a}A${h.ab.b}B</li>`,
            )
            .join('')}</ol>`;
  }

  function resetHistoryAndRefresh(): void {
    state.history = [];
    refresh();
  }

  root.querySelector('[data-rebuild]')!.addEventListener('click', () => {
    state.truthKey = null;
    resetHistoryAndRefresh();
  });
  root.querySelector('[data-reset]')!.addEventListener('click', resetHistoryAndRefresh);
  seedInput.addEventListener('change', () => {
    state.truthKey = null;
    resetHistoryAndRefresh();
  });
  diffSelect.addEventListener('change', () => {
    state.truthKey = null;
    resetHistoryAndRefresh();
  });
  truthSelect.addEventListener('change', () => {
    if (syncingTruth) return;
    state.truthKey = truthSelect.value || null;
    state.history = [];
    refresh();
  });
  root.querySelector('[data-apply-probe]')!.addEventListener('click', () => {
    const key = probePick.value;
    const snap = currentTruthAndSignals();
    const guess = snap.legal.find((m) => mixtureKey(m) === key);
    if (!guess) return;
    state.history = [
      ...state.history,
      {
        guess,
        ab: scoreAB(
          guess,
          snap.truth,
          ALL_IDS.slice(0, getPreset(state.difficulty).odorCount),
        ),
      },
    ];
    refresh();
  });

  refresh();
}
