import { escapeHtml } from './escape';

export type ResultMetric = {
  value: string;
  label: string;
  testId?: string;
};

export function scoreRingHtml(args: { score: string; label: string; angle: number }): string {
  const angle = Math.max(0, Math.min(360, args.angle));
  return `<div class="score-ring" style="--score-angle:${angle}deg"><div><strong>${escapeHtml(args.score)}</strong><span>${escapeHtml(args.label)}</span></div></div>`;
}

export function resultLayoutHtml(args: {
  testId?: string;
  extraAttrs?: string;
  scoreHtml?: string;
  scoreExtraHtml?: string;
  badge?: { text: string; fail?: boolean };
  kicker: string;
  title?: string;
  titleTestId?: string;
  leadHtml?: string;
  metrics?: readonly ResultMetric[];
  discoveredTitle: string;
  discoveredBody: string;
  discoveredTestId?: string;
  extraCopyHtml?: string;
  actionsHtml: string;
  technicalSummary: string;
  technicalHtml: string;
  technicalTestId?: string;
}): string {
  const testId = args.testId ? ` data-testid="${escapeHtml(args.testId)}"` : '';
  const extra = args.extraAttrs ? ` ${args.extraAttrs}` : '';
  const metrics =
    args.metrics && args.metrics.length > 0
      ? `<div class="result-metrics">${args.metrics
          .map((metric) => {
            const id = metric.testId ? ` data-testid="${escapeHtml(metric.testId)}"` : '';
            return `<div${id}><strong>${escapeHtml(metric.value)}</strong><span>${escapeHtml(metric.label)}</span></div>`;
          })
          .join('')}</div>`
      : '';
  const title = args.title
    ? `<h3${args.titleTestId ? ` data-testid="${escapeHtml(args.titleTestId)}"` : ''}>${escapeHtml(args.title)}</h3>`
    : '';
  const discoveredId = args.discoveredTestId ? ` data-testid="${escapeHtml(args.discoveredTestId)}"` : '';
  const techId = args.technicalTestId ? ` data-testid="${escapeHtml(args.technicalTestId)}"` : '';
  const scoreBlock = args.scoreHtml
    ? `<div class="result-score">${args.scoreHtml}${args.scoreExtraHtml ?? ''}${
        args.badge
          ? `<span class="result-badge${args.badge.fail ? ' fail' : ''}">${escapeHtml(args.badge.text)}</span>`
          : ''
      }</div>`
    : '';
  return `<div class="result-state"${testId}${extra}>${scoreBlock}<div class="result-copy"><span class="section-label">${escapeHtml(args.kicker)}</span>${title}${args.leadHtml ?? ''}${metrics}<div class="discovered-card"${discoveredId}><strong>${escapeHtml(args.discoveredTitle)}</strong><p>${escapeHtml(args.discoveredBody)}</p></div>${args.extraCopyHtml ?? ''}<div class="result-actions">${args.actionsHtml}</div><details class="tech-details"${techId}><summary>${escapeHtml(args.technicalSummary)}</summary>${args.technicalHtml}</details></div></div>`;
}
