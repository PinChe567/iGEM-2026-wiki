import { scoreAB } from './ab';
import { signalFitScore } from './fit';
import { mixturesEqual } from './mixture';
import { computeSignals } from './signal';
import { SPECTRUM_RULES } from './rules';
import { getPreset } from './presets';
import type {
  CanonicalMixture,
  DifficultyId,
  FeedbackEntry,
  SignatureLookup,
  SpectrumRuleSet,
} from './types';

export type FilterOptions = {
  /** Prior guesses with exact integer A/B results. */
  history: readonly FeedbackEntry[];
  /** Odor pool used for A/B (same as the puzzle). */
  poolIds: readonly string[];
  /**
   * Optional extra constraint: keep candidates whose model signal scores
   * `signalFit(observedSignal, candidateObserved) >= 100 - fitTolerance`.
   *
   * A/B filtering is always exact (integers). Fit filtering is opt-in and uses the
   * same seeded pipeline as the puzzle so the true mixture always scores 100 and
   * is never dropped by floating-point drift when recomputed with the same seed.
   */
  fitTolerance?: number;
  observedSignal?: readonly number[];
  signatures?: SignatureLookup;
  difficulty?: DifficultyId;
  seed?: string;
  rules?: SpectrumRuleSet;
};

/**
 * Keep mixtures that would reproduce every historical A/B result against the same guesses.
 */
export function filterCandidates(
  candidates: readonly CanonicalMixture[],
  options: FilterOptions,
): CanonicalMixture[] {
  const rules = options.rules ?? SPECTRUM_RULES;
  const { history, poolIds } = options;

  return candidates.filter((candidate) => {
    for (const entry of history) {
      const ab = scoreAB(entry.guess, candidate, poolIds);
      if (ab.a !== entry.ab.a || ab.b !== entry.ab.b) return false;
    }

    if (
      options.fitTolerance !== undefined &&
      options.observedSignal &&
      options.signatures &&
      options.difficulty &&
      options.seed !== undefined
    ) {
      const preset = getPreset(options.difficulty);
      const signals = computeSignals(
        candidate,
        options.signatures,
        preset.mixingModel,
        options.seed,
        rules,
      );
      const fit = signalFitScore(options.observedSignal, signals.observed, rules);
      if (fit < 100 - options.fitTolerance) return false;
    }

    return true;
  });
}

/** Assert helper for tests: truth remains after filtering. */
export function truthSurvivesFilter(
  truth: CanonicalMixture,
  candidates: readonly CanonicalMixture[],
  options: FilterOptions,
): boolean {
  const filtered = filterCandidates(candidates, options);
  return filtered.some((c) => mixturesEqual(c, truth));
}
