export type {
  RiskLevel,
  SignalQuality,
  PlayerAction,
  QcShiftPresetId,
  QcShiftSessionMode,
  ScenarioType,
  SimulatedFungalRisk,
  QcFlag,
  QcReading,
  SimulatedGroundTruth,
  ScenarioSeedMeta,
  QcScenario,
  QcShiftResources,
  QcShiftSettings,
  QcShiftSessionMeta,
  QcBatchState,
  QcResourceCosts,
  QcDebrief,
  QcDecisionRecord,
  QcShiftPlayState,
  QcShiftSession,
  QcActionRejectReason,
  QcFeedback,
  QcActionResult,
  QcShiftScorecard,
  PublicQcScenario,
  PublicQcShiftSession,
} from './types';

export {
  QC_SHIFT_GAME_VERSION,
  QC_SHIFT_SEED_VERSION,
  QC_SHIFT_CONTENT_VERSION,
  getQcShiftVersions,
} from './versions';

export {
  QC_SHIFT_SCIENTIFIC_ROLE,
  QC_SHIFT_DISCLAIMER,
  QC_SHIFT_SCREENING_NOTE,
  QC_SHIFT_PRODUCTS,
  QC_SHIFT_EXPLANATIONS,
  getQcProduct,
  listQcExplanationKeys,
} from './content';

export {
  QC_SHIFT_PRESET_IDS,
  QC_SHIFT_PRESETS,
  QC_SHIFT_REQUIRED_TYPES,
  getQcShiftPreset,
  isQcShiftPresetId,
  initialResources,
} from './presets';

export {
  isTerminalAction,
  readingIsConsistent,
  assertReadingConsistent,
  actionTimeCost,
  canAffordAction,
  recommendedActionFromReading,
  missedHighRisk,
  isUnnecessaryHold,
  isFoodSaved,
  stripConfidenceIfNeeded,
  RISK_LEVELS,
  SIGNAL_QUALITIES,
  PLAYER_ACTIONS,
} from './rules';

export { generateQcShiftScenarios, assertScenarioPossible, listScenarioTemplates } from './generator';

export { applyQcShiftAction } from './actions';

export {
  summarizeQcShift,
  SAFETY_PENALTY_MISSED_HIGH,
  SAFETY_PENALTY_MISSED_ELEVATED,
  EFFICIENCY_PENALTY_WASTED_RETEST,
  EFFICIENCY_PENALTY_UNNECESSARY_CONFIRM,
  safetyPenaltyForMissedHigh,
} from './scoring';

export {
  createQcShiftPracticeSeed,
  createQcShiftDailySeed,
  todayUTC,
  buildQcShiftSessionMeta,
  buildQcShiftSession,
  buildQcShiftPracticeSession,
  buildQcShiftDailySession,
  replayQcShiftSession,
  currentQcScenario,
} from './session';

export {
  QC_SHIFT_TRUTH_LEAK_KEYS,
  toPublicQcScenario,
  toPublicQcShiftSession,
  assertNoQcTruthLeak,
} from './public';

export {
  QC_SHIFT_STORAGE_KEY,
  QC_SHIFT_STORAGE_VERSION,
  DEFAULT_QC_SHIFT_STORED_STATE,
  migrateQcShiftStoredState,
  parseQcShiftStoredJson,
  recordQcShiftPlayedSeed,
  recordQcShiftBestScore,
  type QcShiftStoredState,
  type QcShiftStoredScorecard,
} from './storage';
