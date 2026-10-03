/** Canvas helpers for Scent Spectrum (channel index ≠ time). */

export type ChartSeries = {
  values: readonly number[];
  color: string;
  fill?: string;
};

export const CHANNEL_COUNT = 12;
/** Shared plot inset so question / option / result peaks share the same x slots. */
export const CHART_PAD = { l: 40, r: 10, t: 10, b: 28 } as const;

export function channelCenterX(index: number, plotWidth: number, padLeft = CHART_PAD.l): number {
  return padLeft + ((index + 0.5) / CHANNEL_COUNT) * plotWidth;
}

export function channelBarRect(
  index: number,
  plotWidth: number,
  plotHeight: number,
  value: number,
  padLeft = CHART_PAD.l,
): { x: number; y: number; w: number; h: number } {
  const groupW = plotWidth / CHANNEL_COUNT;
  const barW = Math.max(4, groupW * 0.62);
  const v = Math.max(0, Math.min(1, value));
  const bh = Math.max(1, v * plotHeight);
  return {
    x: padLeft + index * groupW + (groupW - barW) / 2,
    y: CHART_PAD.t + plotHeight - bh,
    w: barW,
    h: bh,
  };
}

function setupCanvas(canvas: HTMLCanvasElement): {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
} | null {
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || 640;
  const cssH = canvas.clientHeight || 240;
  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  return { ctx, w: cssW, h: cssH };
}

function drawAxes(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  xLabel: string,
  yLabel: string,
  highContrast: boolean,
  simple = false,
): void {
  const plotW = w - CHART_PAD.l - CHART_PAD.r;
  const plotH = h - CHART_PAD.t - CHART_PAD.b;
  ctx.strokeStyle = highContrast ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.18)';
  ctx.fillStyle = highContrast ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(CHART_PAD.l, CHART_PAD.t);
  ctx.lineTo(CHART_PAD.l, CHART_PAD.t + plotH);
  ctx.lineTo(CHART_PAD.l + plotW, CHART_PAD.t + plotH);
  ctx.stroke();

  ctx.font = simple ? '12px ui-sans-serif, system-ui, sans-serif' : '11px ui-monospace, monospace';
  ctx.textAlign = 'center';
  if (!simple) {
    for (let j = 0; j < CHANNEL_COUNT; j += 1) {
      ctx.fillText(String(j), channelCenterX(j, plotW), h - 10);
    }
  }
  ctx.fillText(xLabel, CHART_PAD.l + plotW / 2, h - (simple ? 10 : 2));

  ctx.save();
  ctx.translate(14, CHART_PAD.t + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();
}

export function drawChannelChart(
  canvas: HTMLCanvasElement,
  options: {
    bars?: ChartSeries;
    curves: ChartSeries[];
    residualAgainst?: { target: readonly number[]; guess: readonly number[]; color: string };
    xLabel: string;
    yLabel: string;
    highContrast?: boolean;
    reducedMotion?: boolean;
    showDots?: boolean;
    /** Junior: shape/pattern only, no dense channel indices. */
    simple?: boolean;
    /** Channel indices to outline as obviously different. */
    emphasizeIndices?: readonly number[];
    emphasizeColor?: string;
  },
): void {
  const setup = setupCanvas(canvas);
  if (!setup) return;
  const { ctx, w, h } = setup;
  const hc = Boolean(options.highContrast);
  const plotW = w - CHART_PAD.l - CHART_PAD.r;
  const plotH = h - CHART_PAD.t - CHART_PAD.b;

  drawAxes(ctx, w, h, options.xLabel, options.yLabel, hc, Boolean(options.simple));

  if (options.bars) {
    ctx.fillStyle = options.bars.color;
    ctx.globalAlpha = 0.35;
    for (let j = 0; j < CHANNEL_COUNT; j += 1) {
      const bar = channelBarRect(j, plotW, plotH, options.bars.values[j] ?? 0);
      ctx.fillRect(bar.x, bar.y, bar.w, bar.h);
    }
    ctx.globalAlpha = 1;
  }

  if (options.emphasizeIndices?.length) {
    ctx.strokeStyle = options.emphasizeColor ?? '#ee7b66';
    ctx.lineWidth = hc ? 3 : 2.4;
    ctx.globalAlpha = 0.95;
    for (const j of options.emphasizeIndices) {
      const bar = channelBarRect(j, plotW, plotH, Math.max(options.bars?.values[j] ?? options.curves[0]?.values[j] ?? 0.15, 0.12));
      ctx.strokeRect(bar.x - 1, bar.y - 2, bar.w + 2, bar.h + 4);
    }
    ctx.globalAlpha = 1;
  }

  if (options.residualAgainst) {
    const { target, guess, color } = options.residualAgainst;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    for (let j = 0; j < CHANNEL_COUNT; j += 1) {
      const x = channelCenterX(j, plotW);
      const y = CHART_PAD.t + plotH - Math.max(0, Math.min(1, target[j] ?? 0)) * plotH;
      if (j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    for (let j = CHANNEL_COUNT - 1; j >= 0; j -= 1) {
      const x = channelCenterX(j, plotW);
      const y = CHART_PAD.t + plotH - Math.max(0, Math.min(1, guess[j] ?? 0)) * plotH;
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  for (const series of options.curves) {
    ctx.strokeStyle = series.color;
    ctx.lineWidth = hc ? 2.5 : 2;
    ctx.beginPath();
    for (let j = 0; j < CHANNEL_COUNT; j += 1) {
      const x = channelCenterX(j, plotW);
      const y = CHART_PAD.t + plotH - Math.max(0, Math.min(1, series.values[j] ?? 0)) * plotH;
      if (j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    if (options.showDots !== false) {
      ctx.fillStyle = series.color;
      for (let j = 0; j < CHANNEL_COUNT; j += 1) {
        const x = channelCenterX(j, plotW);
        const y = CHART_PAD.t + plotH - Math.max(0, Math.min(1, series.values[j] ?? 0)) * plotH;
        ctx.beginPath();
        ctx.arc(x, y, options.reducedMotion ? 2.5 : 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

export function drawSignatureHint(
  canvas: HTMLCanvasElement,
  values: readonly number[],
  highContrast = false,
  labels?: { xLabel: string; yLabel: string; simple?: boolean },
): void {
  drawChannelChart(canvas, {
    bars: { values, color: highContrast ? '#444' : '#5ec4d1' },
    curves: [{ values, color: highContrast ? '#111' : '#c4a35a' }],
    xLabel: labels?.xLabel ?? '',
    yLabel: labels?.yLabel ?? '',
    highContrast,
    simple: labels?.simple ?? true,
  });
}

export function channelSummaryText(
  values: readonly number[],
  locale: 'zh-Hant' | 'en',
  simple = false,
): string {
  if (simple) {
    return locale === 'zh-Hant'
      ? '\u770b\u5716\u6a23\u7684\u5c71\u5cf0\u8207\u8c37\u5e95\u2014\u2014\u9019\u4e9b\u662f\u53d7\u9ad4\u53cd\u61c9\u901a\u9053\uff0c\u4e0d\u662f\u5149\u8b5c\u3002'
      : 'Look at the peaks and valleys. These are receptor-response channels, not a light spectrum.';
  }
  const peaks = values
    .map((v, i) => ({ v, i }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 3)
    .map((p) => `#${p.i}=${p.v.toFixed(2)}`);
  if (locale === 'zh-Hant') {
    return `\u5341\u4e8c\u901a\u9053\u76f8\u5c0d\u53cd\u61c9\uff1b\u8f03\u9ad8\uff1a${peaks.join(', ')}\u3002\u9023\u7dda\u50c5\u70ba\u95b1\u8b80\u8f14\u52a9\uff0c\u4e0d\u662f\u6642\u9593\u6ce2\u3002`;
  }
  return `Twelve-channel relative responses; peaks: ${peaks.join(', ')}. The polyline aids reading — it is not a time wave.`;
}
