import type {
  CanonicalMixture,
  ChannelVector,
  DifficultyId,
  DifficultyPreset,
  SpectrumPuzzle,
} from './types';
import { getPreset } from './presets';

/** Keys that must never appear in client-facing JSON before finish/debrief. */
export const SPECTRUM_TRUTH_LEAK_KEYS = [
  'truth',
  'privateSeed',
  'private_seed',
  'server_truth',
  'serverTruth',
  'answerKey',
  'answer_key',
  'linearSignal',
  'saturatedSignal',
] as const;

export type PublicSpectrumRatioRules = {
  componentCountMin: number;
  componentCountMax: number;
  percentStep: number;
  minPercent: number;
};

export type PublicSpectrumPuzzle = {
  difficulty: DifficultyId;
  ruleVersion: string;
  contentVersion: string;
  poolIds: string[];
  observedSignal: number[];
  maxGuesses: number;
  ratioRules: PublicSpectrumRatioRules;
  mixingModel: DifficultyPreset['mixingModel'];
  showSignatureHints: boolean;
  /** When revealComponentCount is true (Junior / Standard): number of positive components. */
  truthComponentCount: number | null;
  legalMixtureCount: number;
};

export function toPublicPuzzle(puzzle: SpectrumPuzzle): PublicSpectrumPuzzle {
  const preset = getPreset(puzzle.difficulty);
  return {
    difficulty: puzzle.difficulty,
    ruleVersion: puzzle.ruleVersion,
    contentVersion: puzzle.contentVersion,
    poolIds: [...puzzle.poolIds],
    observedSignal: [...puzzle.observedSignal],
    maxGuesses: preset.maxGuesses,
    ratioRules: {
      componentCountMin: preset.componentCountMin,
      componentCountMax: preset.componentCountMax,
      percentStep: preset.percentStep,
      minPercent: preset.minPercent,
    },
    mixingModel: preset.mixingModel,
    showSignatureHints: preset.showSignatureHints,
    truthComponentCount: preset.revealComponentCount
      ? puzzle.truth.components.length
      : null,
    legalMixtureCount: puzzle.legalMixtureCount,
  };
}

/** Public curve comparison after a guess — never includes truth. */
export type PublicCurveComparison = {
  observedSignal: number[];
  guessSignal: number[];
  fit: number;
};

export function publicCurveComparison(
  observedSignal: ChannelVector,
  guessSignal: ChannelVector,
  fit: number,
): PublicCurveComparison {
  return {
    observedSignal: [...observedSignal],
    guessSignal: [...guessSignal],
    fit,
  };
}

export type PublicGuessFeedback = {
  attemptNumber: number;
  ab: { a: number; b: number };
  abLabel: string;
  fit: number;
  curve: PublicCurveComparison;
  /** Canonical form of the submitted guess (safe to echo). */
  guess: CanonicalMixture;
};

export function assertNoTruthLeak(payload: unknown, path = 'root'): void {
  if (payload === null || payload === undefined) return;
  if (Array.isArray(payload)) {
    payload.forEach((item, i) => assertNoTruthLeak(item, `${path}[${i}]`));
    return;
  }
  if (typeof payload !== 'object') return;
  for (const [k, v] of Object.entries(payload as Record<string, unknown>)) {
    if ((SPECTRUM_TRUTH_LEAK_KEYS as readonly string[]).includes(k)) {
      throw new Error(`truth_leak:${path}.${k}`);
    }
    assertNoTruthLeak(v, `${path}.${k}`);
  }
}
