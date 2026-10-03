/** Scent Spectrum pure-core types. */

export const SPECTRUM_CHANNEL_COUNT = 12 as const;

export type ChannelVector = readonly number[];

export type MixtureComponent = {
  odorId: string;
  /** Integer percentage in (0, 100]; unused pool odors are omitted (= 0%). */
  percent: number;
};

/** Canonical mixture: positive components only, sorted by odorId; percents sum to 100. */
export type CanonicalMixture = {
  components: readonly MixtureComponent[];
};

/** Easy = hints + reveal mix count; hard = no mix-count reveal. Junior = tiny 2-odor card mixer. */
export type DifficultyId = 'junior' | 'easy' | 'hard';

export type MixingModel = 'linear' | 'saturated' | 'saturatedNoisy';

export type DifficultyPreset = {
  id: DifficultyId;
  /** Size of the selectable odor pool (e.g. 10). */
  odorCount: number;
  /** Inclusive truth/guess component-count range (positive-percent odors). */
  componentCountMin: number;
  componentCountMax: number;
  percentStep: number;
  /** Minimum percent for each *selected* (positive) component. */
  minPercent: number;
  maxGuesses: number;
  mixingModel: MixingModel;
  /** Easy: show each pool odor's illustrative signature sketch. */
  showSignatureHints: boolean;
  /** Easy: tell the player how many odors are in the truth mix. */
  revealComponentCount: boolean;
};

export type WeightNormalization = 'percentOver100';

export type NoiseSpec = {
  kind: 'uniformSymmetric';
  /** Sample U(-amplitude, +amplitude) per channel. */
  amplitude: number;
};

export type FitMetricSpec = {
  kind: 'normalizedRmse';
  /**
   * Score = clamp(round(100 * (1 - rmse / rmseScale)), 0, 100).
   * With channels in [0,1], rmseScale=1 maps perfect match → 100 and max RMSE → 0.
   */
  rmseScale: number;
};

/**
 * All numeric / distributional knobs live here (ruleVersion).
 * UI must not redefine k, noise, rounding, or fit math.
 */
export type SpectrumRuleSet = {
  ruleVersion: string;
  channelCount: typeof SPECTRUM_CHANNEL_COUNT;
  /** Saturation: y = 1 - exp(-k * x). */
  saturationK: number;
  noise: NoiseSpec;
  signalRoundingDecimals: number;
  weightNormalization: WeightNormalization;
  fitMetric: FitMetricSpec;
};

export type ABResult = {
  a: number;
  b: number;
};

export type FeedbackEntry = {
  guess: CanonicalMixture;
  ab: ABResult;
  /** Optional observed 訊號吻合度 (0–100) for tolerance filtering. */
  signalFit?: number;
};

export type SpectrumPuzzle = {
  seed: string;
  ruleVersion: string;
  contentVersion: string;
  difficulty: DifficultyId;
  /** Fixed roster used for A/B (length = preset.odorCount). */
  poolIds: readonly string[];
  truth: CanonicalMixture;
  /** Observed mixture signal after the difficulty's mixing model (+ noise when noisy). */
  observedSignal: ChannelVector;
  /** Linear mix before saturation/noise (always computed for visualizer). */
  linearSignal: ChannelVector;
  /** Saturated signal before noise (null when model is linear). */
  saturatedSignal: ChannelVector | null;
  legalMixtureCount: number;
};

export type SignatureLookup = ReadonlyMap<string, ChannelVector>;
