import { computeSignals } from './signal';
import { signalFitScore } from './fit';
import { mixtureKey, validateMixture } from './mixture';
import { getPreset } from './presets';
import type { CanonicalMixture, DifficultyId, SignatureLookup } from './types';

/** Odors that still appear in at least one surviving legal mixture. */
export function hintPossibleOdorIds(surviving: readonly CanonicalMixture[]): string[] {
  const ids = new Set<string>();
  for (const mix of surviving) {
    for (const c of mix.components) ids.add(c.odorId);
  }
  return [...ids].sort();
}

/**
 * Hint 2: reveal one odor that is still legal (present in surviving candidates).
 * Prefers an odor in *every* surviving mix; otherwise the most frequent.
 */
export function hintRevealComponent(
  surviving: readonly CanonicalMixture[],
): { odorId: string; inAll: boolean } | null {
  if (surviving.length === 0) return null;
  const counts = new Map<string, number>();
  for (const mix of surviving) {
    for (const c of mix.components) {
      counts.set(c.odorId, (counts.get(c.odorId) ?? 0) + 1);
    }
  }
  let best: string | null = null;
  let bestCount = -1;
  for (const [id, n] of counts) {
    if (n > bestCount || (n === bestCount && (best === null || id < best))) {
      best = id;
      bestCount = n;
    }
  }
  if (!best) return null;
  return { odorId: best, inAll: bestCount === surviving.length };
}

/**
 * Hint 3: closest surviving legal mixtures by signal fit.
 * Never invents candidates outside `surviving`.
 */
export function hintClosestCandidates(args: {
  surviving: readonly CanonicalMixture[];
  observedSignal: readonly number[];
  signatures: SignatureLookup;
  difficulty: DifficultyId;
  seed: string;
  limit?: number;
}): CanonicalMixture[] {
  const limit = args.limit ?? 3;
  if (args.surviving.length === 0) return [];
  const preset = getPreset(args.difficulty);
  const allowed = new Set(args.surviving.map(mixtureKey));
  const ranked = args.surviving
    .map((mix) => {
      const observed = computeSignals(
        mix,
        args.signatures,
        preset.mixingModel,
        args.seed,
      ).observed;
      return {
        mix,
        fit: signalFitScore(args.observedSignal, observed),
        key: mixtureKey(mix),
      };
    })
    .filter((row) => allowed.has(row.key))
    .sort((a, b) => b.fit - a.fit || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  return ranked.slice(0, limit).map((row) => row.mix);
}

/** Autofill payload: components already sum to 100 when the mixture is legal. */
export function hintAutofillMixture(
  mix: CanonicalMixture,
  difficulty: DifficultyId,
): CanonicalMixture | null {
  const preset = getPreset(difficulty);
  const validated = validateMixture(mix.components, {
    minPercent: preset.minPercent,
    percentStep: preset.percentStep,
    componentCountMin: preset.componentCountMin,
    componentCountMax: preset.componentCountMax,
  });
  return validated.ok ? validated.canonical : null;
}
