import { SPECTRUM_RULES } from './rules';
import type { ChannelVector, SpectrumRuleSet } from './types';

/**
 * 訊號吻合度 (signal fit): fixed normalized RMSE → integer score in [0, 100].
 *
 * rmse = sqrt(mean((a_i - b_i)^2))
 * score = clamp(round(100 * (1 - rmse / rmseScale)), 0, 100)
 *
 * UI copy must call this 「訊號吻合度」— never probability or chemical ID confidence.
 */
export function signalFitScore(
  observed: ChannelVector,
  candidate: ChannelVector,
  rules: SpectrumRuleSet = SPECTRUM_RULES,
): number {
  if (rules.fitMetric.kind !== 'normalizedRmse') {
    throw new Error(`Unsupported fit metric: ${rules.fitMetric.kind}`);
  }
  const n = Math.min(observed.length, candidate.length, rules.channelCount);
  if (n === 0) return 0;

  let sumSq = 0;
  for (let i = 0; i < n; i += 1) {
    const d = (observed[i] ?? 0) - (candidate[i] ?? 0);
    sumSq += d * d;
  }
  const rmse = Math.sqrt(sumSq / n);
  const scale = rules.fitMetric.rmseScale;
  if (!(scale > 0) || !Number.isFinite(rmse)) return 0;

  const raw = 100 * (1 - rmse / scale);
  if (!Number.isFinite(raw)) return 0;
  return Math.max(0, Math.min(100, Math.round(raw)));
}
