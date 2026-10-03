/** Anonymous education-study evidence. Local-only; no PII. */

export const EDUCATION_SCHEMA_VERSION = 1 as const;
export const EDUCATION_STORAGE_KEY = 'suite.education.v1' as const;
export const EDUCATION_STORAGE_VERSION = 1 as const;

export type EducationLocale = 'zh-Hant' | 'en';

export type EducationGameId = 'pixel' | 'qc-shift' | 'spectrum';

export type EducationPhase = 'pre' | 'post' | 'transfer' | 'feedback';

export type EducationItemId =
  | 'G1-COMB-01'
  | 'G1-NOISE-01'
  | 'G1-TRANSFER-01'
  | 'G1-FEED-01'
  | 'G2-SCREEN-01'
  | 'G2-QC-01'
  | 'G2-TRANSFER-01'
  | 'G2-FEED-01'
  | 'G2-ALERT-01'
  | 'G3-MIX-01'
  | 'G3-DECODE-01'
  | 'G3-TRANSFER-01'
  | 'G3-FEED-01';

export type LocalizedText = {
  'zh-Hant': string;
  en: string;
};

export type EducationOption = {
  id: string;
  label: LocalizedText;
};

export type EducationItem = {
  id: EducationItemId;
  gameId: EducationGameId;
  phase: EducationPhase;
  /** What the item measures (facilitator-facing, English). */
  measures: string;
  prompt: LocalizedText;
  options: readonly EducationOption[];
  /** Null for unscored feedback / preference items. */
  correctOptionId: string | null;
  optional: boolean;
};

export type EducationAnswer = {
  studyItemId: EducationItemId;
  phase: EducationPhase;
  answer: string;
  /** Null when the item is not scored. */
  correct: boolean | null;
  recordedAt: string;
};

export type PixelEducationOutcome = {
  correctCount: number;
  questionCount: number;
  score: number;
  presetId: string;
  studyReviewUsed: boolean;
};

export type QcShiftEducationOutcome = {
  monitorCount: number;
  retestCount: number;
  holdConfirmCount: number;
  missedSimulatedRisks: number;
  unnecessaryHolds: number;
  invalidReadingBatches: number;
  invalidReadingsFollowedUp: number;
  /** Null if the shift had no invalid/uncertain batches. */
  qcInvalidComprehension: boolean | null;
  /** Optional preference from G2-ALERT-01. */
  alertInformationPreference: string | null;
};

export type SpectrumEducationOutcome = {
  guesses: number;
  hintLevel: number;
  solved: boolean;
  difficulty: string;
};

export type EducationGameOutcome =
  | { gameId: 'pixel'; pixel: PixelEducationOutcome }
  | { gameId: 'qc-shift'; qcShift: QcShiftEducationOutcome }
  | { gameId: 'spectrum'; spectrum: SpectrumEducationOutcome };

export type EducationStudySession = {
  schemaVersion: typeof EDUCATION_SCHEMA_VERSION;
  anonymousSessionId: string;
  gameId: EducationGameId;
  gameVersion: string;
  contentVersion: string;
  locale: EducationLocale;
  selectedDifficulty: string | null;
  startedAt: string;
  completedPlay: boolean;
  durationMs: number | null;
  numberOfAttempts: number | null;
  hintsUsed: number | null;
  answers: EducationAnswer[];
  outcome: EducationGameOutcome | null;
};

export type EducationStoredState = {
  storageVersion: typeof EDUCATION_STORAGE_VERSION;
  schemaVersion: typeof EDUCATION_SCHEMA_VERSION;
  sessions: EducationStudySession[];
};

export type EducationExportPayload = {
  schemaVersion: typeof EDUCATION_SCHEMA_VERSION;
  exportedAt: string;
  privacy: 'anonymous-local-only';
  sessions: EducationStudySession[];
};

export type ItemPairSummary = {
  studyItemId: EducationItemId;
  pairedN: number;
  preCorrect: number;
  postCorrect: number;
  improved: number;
  noChange: number;
  declined: number;
};

export type GameEducationSummary = {
  gameId: EducationGameId;
  sessionCount: number;
  completedPlay: number;
  pairedItems: ItemPairSummary[];
  /** Null when no durations were recorded. */
  medianDurationMs: number | null;
  /** Null when no hint values were recorded. */
  medianHintsUsed: number | null;
  qcDecisionPatterns: QcShiftEducationOutcome | null;
  spectrumSolved: number | null;
  spectrumAttempted: number | null;
};
