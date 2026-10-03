export type {
  ChannelVector,
  MixtureComponent,
  CanonicalMixture,
  DifficultyId,
  MixingModel,
  DifficultyPreset,
  WeightNormalization,
  NoiseSpec,
  FitMetricSpec,
  SpectrumRuleSet,
  ABResult,
  FeedbackEntry,
  SpectrumPuzzle,
  SignatureLookup,
} from './types';

export { SPECTRUM_CHANNEL_COUNT } from './types';

export {
  SPECTRUM_GAME_VERSION,
  SPECTRUM_RULE_VERSION,
  SPECTRUM_RULES,
  getSpectrumVersions,
} from './rules';

export { SPECTRUM_PRESETS, SPECTRUM_DIFFICULTY_IDS, getPreset, isDifficultyId, parseDifficultyId } from './presets';

export {
  canonicalizeMixture,
  mixtureKey,
  mixturesEqual,
  validateMixture,
  enumeratePercentCompositions,
  combinations,
  type MixtureValidation,
  type MixtureValidationError,
} from './mixture';

export {
  roundChannel,
  clamp01,
  roundSignal,
  linearMix,
  applySaturation,
  applyNoise,
  computeSignals,
  noiseRng,
  type ComputedSignals,
} from './signal';

export { scoreAB, formatAB, mixturePercent, isPerfectAB } from './ab';

export { signalFitScore } from './fit';

export {
  enumerateLegalMixtures,
  pickTruthBySeed,
  buildPuzzle,
  selectSpectrumPool,
  type EnumerateOptions,
  type BuildPuzzleInput,
} from './generator';

export {
  filterCandidates,
  truthSurvivesFilter,
  type FilterOptions,
} from './filter';

export {
  spectrumScoreKey,
  createPracticeSeed,
  createDailySeed,
  todayUTC,
  buildSpectrumSession,
  buildPracticeSpectrumSession,
  buildDailySpectrumSession,
  type SpectrumSessionMode,
  type SpectrumSessionMeta,
  type SpectrumSession,
} from './session';

export {
  computeSpectrumScore,
  formatElapsed,
  HINT_SCORE_PENALTY,
  type SpectrumScoreBreakdown,
} from './scoring';

export {
  hintPossibleOdorIds,
  hintRevealComponent,
  hintClosestCandidates,
  hintAutofillMixture,
} from './hints';

export {
  toPublicPuzzle,
  publicCurveComparison,
  assertNoTruthLeak,
  SPECTRUM_TRUTH_LEAK_KEYS,
  type PublicSpectrumPuzzle,
  type PublicSpectrumRatioRules,
  type PublicCurveComparison,
  type PublicGuessFeedback,
} from './public';

export {
  SPECTRUM_STORAGE_KEY,
  SPECTRUM_STORAGE_VERSION,
  DEFAULT_SPECTRUM_STORED_STATE,
  migrateSpectrumStoredState,
  parseSpectrumStoredJson,
  recordSpectrumPlayedSeed,
  recordSpectrumBestScore,
  type SpectrumStoredState,
} from './storage';
