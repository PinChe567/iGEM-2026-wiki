/**
 * Versioned local education-study evidence.
 * Browser localStorage only — never transmitted automatically.
 */

import { isEducationItemId } from './items';
import type {
  EducationAnswer,
  EducationGameId,
  EducationGameOutcome,
  EducationItemId,
  EducationLocale,
  EducationPhase,
  EducationStoredState,
  EducationStudySession,
  PixelEducationOutcome,
  QcShiftEducationOutcome,
  SpectrumEducationOutcome,
} from './types';
import {
  EDUCATION_SCHEMA_VERSION,
  EDUCATION_STORAGE_KEY,
  EDUCATION_STORAGE_VERSION,
} from './types';

export { EDUCATION_STORAGE_KEY, EDUCATION_STORAGE_VERSION };

const PII_KEYS = /^(name|email|age|exactAge|ip|ipAddress|school|schoolId|studentId|phone|address)$/i;

export const DEFAULT_EDUCATION_STORED_STATE: EducationStoredState = {
  storageVersion: EDUCATION_STORAGE_VERSION,
  schemaVersion: EDUCATION_SCHEMA_VERSION,
  sessions: [],
};

function asLocale(value: unknown): EducationLocale {
  return value === 'en' || value === 'zh-Hant' ? value : 'zh-Hant';
}

function asGameId(value: unknown): EducationGameId | null {
  if (value === 'pixel' || value === 'qc-shift' || value === 'spectrum') return value;
  return null;
}

function asPhase(value: unknown): EducationPhase | null {
  if (value === 'pre' || value === 'post' || value === 'transfer' || value === 'feedback') return value;
  return null;
}

function finiteInt(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.max(0, Math.round(value));
}

function stripPiiRecord(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (PII_KEYS.test(key)) continue;
    out[key] = value;
  }
  return out;
}

function parseAnswer(raw: unknown): EducationAnswer | null {
  if (raw == null || typeof raw !== 'object') return null;
  const data = stripPiiRecord(raw as Record<string, unknown>);
  const studyItemId = data.studyItemId;
  const phase = asPhase(data.phase);
  if (typeof studyItemId !== 'string' || !isEducationItemId(studyItemId) || !phase) return null;
  if (typeof data.answer !== 'string') return null;
  const correct =
    data.correct === true ? true : data.correct === false ? false : data.correct == null ? null : null;
  return {
    studyItemId: studyItemId as EducationItemId,
    phase,
    answer: data.answer.slice(0, 80),
    correct,
    recordedAt: typeof data.recordedAt === 'string' ? data.recordedAt : '',
  };
}

function parsePixelOutcome(raw: unknown): PixelEducationOutcome | null {
  if (raw == null || typeof raw !== 'object') return null;
  const data = raw as Record<string, unknown>;
  const correctCount = finiteInt(data.correctCount);
  const questionCount = finiteInt(data.questionCount);
  const score = finiteInt(data.score);
  if (correctCount == null || questionCount == null || score == null) return null;
  return {
    correctCount,
    questionCount,
    score,
    presetId: typeof data.presetId === 'string' ? data.presetId : '',
    studyReviewUsed: Boolean(data.studyReviewUsed),
  };
}

function parseQcOutcome(raw: unknown): QcShiftEducationOutcome | null {
  if (raw == null || typeof raw !== 'object') return null;
  const data = raw as Record<string, unknown>;
  const monitorCount = finiteInt(data.monitorCount);
  const retestCount = finiteInt(data.retestCount);
  const holdConfirmCount = finiteInt(data.holdConfirmCount);
  const missedSimulatedRisks = finiteInt(data.missedSimulatedRisks);
  const unnecessaryHolds = finiteInt(data.unnecessaryHolds);
  const invalidReadingBatches = finiteInt(data.invalidReadingBatches);
  const invalidReadingsFollowedUp = finiteInt(data.invalidReadingsFollowedUp);
  if (
    monitorCount == null ||
    retestCount == null ||
    holdConfirmCount == null ||
    missedSimulatedRisks == null ||
    unnecessaryHolds == null ||
    invalidReadingBatches == null ||
    invalidReadingsFollowedUp == null
  ) {
    return null;
  }
  return {
    monitorCount,
    retestCount,
    holdConfirmCount,
    missedSimulatedRisks,
    unnecessaryHolds,
    invalidReadingBatches,
    invalidReadingsFollowedUp,
    qcInvalidComprehension:
      data.qcInvalidComprehension === true ? true : data.qcInvalidComprehension === false ? false : null,
    alertInformationPreference:
      typeof data.alertInformationPreference === 'string' ? data.alertInformationPreference.slice(0, 40) : null,
  };
}

function parseSpectrumOutcome(raw: unknown): SpectrumEducationOutcome | null {
  if (raw == null || typeof raw !== 'object') return null;
  const data = raw as Record<string, unknown>;
  const guesses = finiteInt(data.guesses);
  const hintLevel = finiteInt(data.hintLevel);
  if (guesses == null || hintLevel == null || typeof data.solved !== 'boolean') return null;
  return {
    guesses,
    hintLevel,
    solved: data.solved,
    difficulty: typeof data.difficulty === 'string' ? data.difficulty : '',
  };
}

function parseOutcome(gameId: EducationGameId, raw: unknown): EducationGameOutcome | null {
  if (raw == null || typeof raw !== 'object') return null;
  const data = raw as Record<string, unknown>;
  if (gameId === 'pixel') {
    const pixel = parsePixelOutcome(data.pixel ?? data);
    return pixel ? { gameId: 'pixel', pixel } : null;
  }
  if (gameId === 'qc-shift') {
    const qcShift = parseQcOutcome(data.qcShift ?? data);
    return qcShift ? { gameId: 'qc-shift', qcShift } : null;
  }
  const spectrum = parseSpectrumOutcome(data.spectrum ?? data);
  return spectrum ? { gameId: 'spectrum', spectrum } : null;
}

export function migrateEducationSession(raw: unknown): EducationStudySession | null {
  if (raw == null || typeof raw !== 'object') return null;
  const data = stripPiiRecord(raw as Record<string, unknown>);
  const gameId = asGameId(data.gameId);
  if (!gameId) return null;
  if (typeof data.anonymousSessionId !== 'string' || data.anonymousSessionId.length < 4) return null;
  const answers = Array.isArray(data.answers)
    ? data.answers.map(parseAnswer).filter((row): row is EducationAnswer => row != null).slice(0, 40)
    : [];
  return {
    schemaVersion: EDUCATION_SCHEMA_VERSION,
    anonymousSessionId: data.anonymousSessionId.slice(0, 80),
    gameId,
    gameVersion: typeof data.gameVersion === 'string' ? data.gameVersion.slice(0, 32) : '',
    contentVersion: typeof data.contentVersion === 'string' ? data.contentVersion.slice(0, 32) : '',
    locale: asLocale(data.locale),
    selectedDifficulty: typeof data.selectedDifficulty === 'string' ? data.selectedDifficulty.slice(0, 40) : null,
    startedAt: typeof data.startedAt === 'string' ? data.startedAt : '',
    completedPlay: Boolean(data.completedPlay),
    durationMs: finiteInt(data.durationMs),
    numberOfAttempts: finiteInt(data.numberOfAttempts),
    hintsUsed: finiteInt(data.hintsUsed),
    answers,
    outcome: parseOutcome(gameId, data.outcome),
  };
}

export function migrateEducationStoredState(raw: unknown): EducationStoredState {
  if (raw == null || typeof raw !== 'object') {
    return { ...DEFAULT_EDUCATION_STORED_STATE, sessions: [] };
  }
  const data = stripPiiRecord(raw as Record<string, unknown>);
  const sessions = Array.isArray(data.sessions)
    ? data.sessions
        .map(migrateEducationSession)
        .filter((row): row is EducationStudySession => row != null)
        .slice(-400)
    : [];
  return {
    storageVersion: EDUCATION_STORAGE_VERSION,
    schemaVersion: EDUCATION_SCHEMA_VERSION,
    sessions,
  };
}

export function parseEducationStoredJson(text: string | null): EducationStoredState {
  if (!text) return migrateEducationStoredState(null);
  try {
    return migrateEducationStoredState(JSON.parse(text));
  } catch {
    return migrateEducationStoredState(null);
  }
}

export function upsertEducationSession(
  state: EducationStoredState,
  session: EducationStudySession,
): EducationStoredState {
  const sessions = state.sessions.filter((row) => row.anonymousSessionId !== session.anonymousSessionId);
  return { ...state, sessions: [...sessions, session].slice(-400) };
}
