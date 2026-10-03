export type {
  PixelOdor,
  MatrixSize,
  NoisePercentOfOff,
  DistractorBias,
  DifficultySettings,
  SessionMode,
  PixelLevelId,
  SessionMeta,
  CellKind,
  BuiltQuestion,
  BuiltSession,
  AnswerOutcome,
  ResultSummary,
  PatternDiff,
} from './types';

export {
  PIXEL_GAME_VERSION,
  PIXEL_SEED_VERSION,
  getPixelVersions,
} from './versions';

export {
  DEFAULT_PRACTICE_SETTINGS,
  JUNIOR_SETTINGS,
  CHALLENGE_SETTINGS,
  PIXEL_PRESETS,
  PIXEL_JUNIOR_PRESET_ID,
  PIXEL_STANDARD_PRESET_ID,
  PIXEL_CHALLENGE_PRESET_ID,
  PIXEL_LEVEL_IDS,
  listMatrixSizes,
  listNoisePercents,
  listPixelPresetIds,
  getPreset,
  mergePracticeSettings,
  isJuniorPreset,
  isPixelLevelId,
  effectivePatternDisplayMs,
  usesTimedMemory,
  dailyPresetIdForLevel,
} from './presets';

export {
  cellFeatures,
  activeCellCount,
  rawOdorPattern,
  patternsForSize,
  odorPattern,
  assertPatternsUnique,
} from './pattern';

export { similarity, rankBySimilarity, nearestOdor } from './similarity';

export {
  noiseCountForOffCells,
  injectNoise,
  patternDiff,
} from './noise';

export {
  pickSessionPool,
  buildQuestionOptions,
  buildAnswerSchedule,
  buildQuestions,
} from './questions';

export {
  initialScore,
  maxScore,
  applyAnswer,
  clampScore,
  summarizeResult,
} from './scoring';

export {
  createPracticeSeed,
  createDailySeed,
  todayUTC,
  buildSessionMeta,
  buildSession,
  buildPracticeSession,
  buildDailySession,
  replaySession,
} from './session';

export { CONTENT_VERSION_PLACEHOLDER } from './content-version';

export {
  questionIdForRound,
  roundFromQuestionId,
  toPublicQuestion,
  toPublicSession,
  assertNoAnswerLeak,
  PIXEL_ANSWER_LEAK_KEYS,
  type PublicPixelQuestion,
  type PublicPixelSession,
} from './public';

export {
  PIXEL_STORAGE_KEY,
  PIXEL_STORAGE_VERSION,
  DEFAULT_PIXEL_STORED_STATE,
  migratePixelStoredState,
  parsePixelStoredJson,
  recordPlayedSeed,
  recordBestScore,
  type PixelStoredState,
} from './storage';
