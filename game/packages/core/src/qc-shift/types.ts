/** AeroSense QC Shift — educational screening simulation types. */

export type RiskLevel = 'low' | 'medium' | 'high' | 'invalid';

export type SignalQuality = 'good' | 'uncertain' | 'invalid';

export type PlayerAction = 'monitor' | 'retest' | 'holdConfirm';

export type QcShiftPresetId = 'junior' | 'standard' | 'challenge';

export type QcShiftSessionMode = 'practice' | 'daily';

export type ScenarioType =
  | 'true-low'
  | 'true-high'
  | 'true-medium'
  | 'false-positive'
  | 'false-negative'
  | 'borderline'
  | 'invalid-reading'
  | 'drift-qc';

/**
 * Simulated fungal-risk state for education only.
 * Not a toxin concentration and not a diagnostic result.
 */
export type SimulatedFungalRisk = 'not-elevated' | 'elevated' | 'high';

export type QcFlag = 'ok' | 'drift' | 'low-signal' | 'out-of-range' | 'unstable-baseline';

export type QcReading = {
  risk: RiskLevel;
  quality: SignalQuality;
  /** Standard/Challenge only. Junior omits this (null). */
  confidence: number | null;
  qcFlags: readonly QcFlag[];
};

export type SimulatedGroundTruth = {
  simulatedFungalRisk: SimulatedFungalRisk;
};

export type ScenarioSeedMeta = {
  seed: string;
  presetId: QcShiftPresetId;
  index: number;
  seedVersion: string;
};

export type QcScenario = {
  id: string;
  productId: string;
  initialReading: QcReading;
  /** Deterministic second screening. At most one meaningful retest. */
  retestReading: QcReading;
  /** Educational simulation only — strip from public payloads until debrief. */
  hiddenGroundTruth: SimulatedGroundTruth;
  explanationKey: string;
  scenarioType: ScenarioType;
  seedMeta: ScenarioSeedMeta;
};

export type QcShiftResources = {
  /** null = unrestricted (Junior). */
  retestRemaining: number | null;
  confirmRemaining: number | null;
  timeRemaining: number | null;
};

export type QcShiftSettings = {
  presetId: QcShiftPresetId;
  batchCount: number;
  restrictiveBudget: boolean;
  retestBudget: number | null;
  confirmBudget: number | null;
  timeBudget: number | null;
  retestTimeCost: number;
  confirmTimeCost: number;
  showConfidence: boolean;
  showQcFlags: boolean;
};

export type QcShiftSessionMeta = {
  seed: string;
  seedVersion: string;
  contentVersion: string;
  gameVersion: string;
  mode: QcShiftSessionMode;
  presetId: QcShiftPresetId;
};

export type QcBatchState = {
  scenarioId: string;
  retestUsed: boolean;
  resolved: boolean;
  terminalAction: PlayerAction | null;
  currentReading: QcReading;
};

export type QcResourceCosts = {
  retest: number;
  confirm: number;
  time: number;
};

export type QcDebrief = {
  simulatedFungalRisk: SimulatedFungalRisk;
  explanationKey: string;
  missedHighRisk: boolean;
  unnecessaryHold: boolean;
};

export type QcDecisionRecord = {
  batchIndex: number;
  scenarioId: string;
  action: PlayerAction;
  terminal: boolean;
  costs: QcResourceCosts;
  readingAfter: QcReading;
  debrief: QcDebrief | null;
};

export type QcShiftPlayState = {
  batchIndex: number;
  batchStates: QcBatchState[];
  resources: QcShiftResources;
  log: QcDecisionRecord[];
  status: 'playing' | 'complete';
};

export type QcShiftSession = {
  meta: QcShiftSessionMeta;
  settings: QcShiftSettings;
  scenarios: QcScenario[];
  play: QcShiftPlayState;
};

export type QcActionRejectReason =
  | 'session-complete'
  | 'batch-resolved'
  | 'already-retested'
  | 'no-retest-remaining'
  | 'no-confirm-remaining'
  | 'not-enough-time'
  | 'unknown-action';

export type QcFeedback = {
  action: PlayerAction;
  scenarioId: string;
  terminal: boolean;
  readingAfter: QcReading;
  costs: QcResourceCosts;
  debrief: QcDebrief | null;
};

export type QcActionResult = {
  ok: boolean;
  reason?: QcActionRejectReason;
  session: QcShiftSession;
  feedback: QcFeedback | null;
};

/** Separate score dimensions — not a single opaque total. */
export type QcShiftScorecard = {
  safety: number;
  foodSaved: number;
  unnecessaryHold: number;
  efficiency: number;
  missedHighRiskCount: number;
  unnecessaryHoldCount: number;
  batchesResolved: number;
  batchesTotal: number;
  complete: boolean;
};

export type PublicQcScenario = {
  id: string;
  productId: string;
  initialReading: QcReading;
  seedMeta: ScenarioSeedMeta;
};

export type PublicQcShiftSession = {
  meta: QcShiftSessionMeta;
  settings: QcShiftSettings;
  scenarios: PublicQcScenario[];
  play: QcShiftPlayState;
};
