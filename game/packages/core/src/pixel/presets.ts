import type { DifficultySettings, MatrixSize, NoisePercentOfOff, PixelLevelId } from './types';

const MATRIX_SIZES: MatrixSize[] = [3, 4, 5, 6, 7];
const NOISE_PERCENTS: NoisePercentOfOff[] = [0, 10, 20, 30, 40];

export const PIXEL_JUNIOR_PRESET_ID = 'junior' as const;
export const PIXEL_STANDARD_PRESET_ID = 'practice' as const;
export const PIXEL_CHALLENGE_PRESET_ID = 'challenge' as const;

/** Three player-facing levels. `practice` remains the Standard preset id for storage compatibility. */
export const PIXEL_LEVEL_IDS: readonly PixelLevelId[] = [
  PIXEL_JUNIOR_PRESET_ID,
  PIXEL_STANDARD_PRESET_ID,
  PIXEL_CHALLENGE_PRESET_ID,
];

export const DEFAULT_PRACTICE_SETTINGS: DifficultySettings = {
  matrixSize: 4,
  distractorBias: 'similar',
  noisePercentOfOff: 10,
  allowStudyReview: true,
  patternDisplayMs: 0,
  poolSize: 8,
  questionCount: 16,
  optionsPerQuestion: 4,
  passCorrect: 10,
  pointsPerCorrect: 100,
};

export const JUNIOR_SETTINGS: DifficultySettings = {
  matrixSize: 3,
  distractorBias: 'mixed',
  noisePercentOfOff: 10,
  allowStudyReview: true,
  patternDisplayMs: 0,
  poolSize: 5,
  questionCount: 10,
  optionsPerQuestion: 3,
  passCorrect: 6,
  pointsPerCorrect: 100,
};

/** Timed-memory Challenge default; daily-focus / daily-dense stay available as advanced presets. */
export const CHALLENGE_SETTINGS: DifficultySettings = {
  matrixSize: 5,
  distractorBias: 'similar',
  noisePercentOfOff: 20,
  allowStudyReview: true,
  patternDisplayMs: 800,
  poolSize: 8,
  questionCount: 16,
  optionsPerQuestion: 4,
  passCorrect: 10,
  pointsPerCorrect: 100,
};

/** Named presets — difficulty is multi-axis, not “7×7 = hardest”. */
export const PIXEL_PRESETS: Record<string, DifficultySettings> = {
  junior: { ...JUNIOR_SETTINGS },
  practice: { ...DEFAULT_PRACTICE_SETTINGS },
  challenge: { ...CHALLENGE_SETTINGS },
  'daily-easy': {
    matrixSize: 4,
    distractorBias: 'mixed',
    noisePercentOfOff: 0,
    allowStudyReview: true,
    patternDisplayMs: 0,
    poolSize: 8,
    questionCount: 16,
    optionsPerQuestion: 4,
    passCorrect: 10,
    pointsPerCorrect: 100,
  },
  'daily-standard': {
    matrixSize: 5,
    distractorBias: 'similar',
    noisePercentOfOff: 20,
    allowStudyReview: true,
    patternDisplayMs: 800,
    poolSize: 8,
    questionCount: 16,
    optionsPerQuestion: 4,
    passCorrect: 10,
    pointsPerCorrect: 100,
  },
  'daily-focus': {
    matrixSize: 5,
    distractorBias: 'very-similar',
    noisePercentOfOff: 10,
    allowStudyReview: false,
    patternDisplayMs: 1200,
    poolSize: 8,
    questionCount: 16,
    optionsPerQuestion: 4,
    passCorrect: 10,
    pointsPerCorrect: 100,
  },
  'daily-dense': {
    matrixSize: 6,
    distractorBias: 'similar',
    noisePercentOfOff: 30,
    allowStudyReview: true,
    patternDisplayMs: 0,
    poolSize: 8,
    questionCount: 16,
    optionsPerQuestion: 4,
    passCorrect: 10,
    pointsPerCorrect: 100,
  },
};

export function listPixelPresetIds(): readonly string[] {
  return Object.keys(PIXEL_PRESETS);
}

export function isJuniorPreset(presetId: string): boolean {
  return presetId === PIXEL_JUNIOR_PRESET_ID;
}

export function isPixelLevelId(value: string): value is PixelLevelId {
  return (PIXEL_LEVEL_IDS as readonly string[]).includes(value);
}

/**
 * Timed memory hides the pattern after this many ms.
 * Junior never uses timed memory, even if a customized payload asks for it.
 */
export function effectivePatternDisplayMs(
  settings: Pick<DifficultySettings, 'patternDisplayMs'>,
  presetId?: string,
): number {
  if (presetId && isJuniorPreset(presetId)) return 0;
  const ms = settings.patternDisplayMs;
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return Math.round(ms);
}

export function usesTimedMemory(
  settings: Pick<DifficultySettings, 'patternDisplayMs'>,
  presetId?: string,
): boolean {
  return effectivePatternDisplayMs(settings, presetId) > 0;
}

/** Daily mode keeps the existing Standard mapping; Junior/Challenge pick matching daily-capable presets. */
export function dailyPresetIdForLevel(levelId: PixelLevelId): string {
  if (levelId === 'junior') return PIXEL_JUNIOR_PRESET_ID;
  if (levelId === 'challenge') return 'daily-focus';
  return 'daily-standard';
}

export function listMatrixSizes(): readonly MatrixSize[] {
  return MATRIX_SIZES;
}

export function listNoisePercents(): readonly NoisePercentOfOff[] {
  return NOISE_PERCENTS;
}

export function getPreset(presetId: string): DifficultySettings {
  const preset = PIXEL_PRESETS[presetId];
  if (!preset) throw new Error(`Unknown preset: ${presetId}`);
  return { ...preset };
}

export function mergePracticeSettings(
  partial: Partial<DifficultySettings>,
  basePresetId: string = PIXEL_STANDARD_PRESET_ID,
): DifficultySettings {
  const base = PIXEL_PRESETS[basePresetId]
    ? getPreset(basePresetId)
    : { ...DEFAULT_PRACTICE_SETTINGS };
  const merged = { ...base, ...partial };
  if (isJuniorPreset(basePresetId)) {
    merged.patternDisplayMs = 0;
  }
  return merged;
}
