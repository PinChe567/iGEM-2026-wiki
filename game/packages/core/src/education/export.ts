import type { EducationExportPayload, EducationStudySession } from './types';
import { EDUCATION_SCHEMA_VERSION } from './types';
import { migrateEducationSession } from './storage';

export function buildEducationExport(sessions: readonly EducationStudySession[]): EducationExportPayload {
  return {
    schemaVersion: EDUCATION_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    privacy: 'anonymous-local-only',
    sessions: sessions.map((row) => ({ ...row })),
  };
}

export function parseEducationExportJson(text: string): EducationStudySession[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return [];
  }
  if (Array.isArray(parsed)) {
    return parsed.map(migrateEducationSession).filter((row): row is EducationStudySession => row != null);
  }
  if (parsed != null && typeof parsed === 'object') {
    const data = parsed as Record<string, unknown>;
    if (Array.isArray(data.sessions)) {
      return data.sessions
        .map(migrateEducationSession)
        .filter((row): row is EducationStudySession => row != null);
    }
    const one = migrateEducationSession(parsed);
    return one ? [one] : [];
  }
  return [];
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

const CSV_HEADERS = [
  'anonymousSessionId',
  'gameId',
  'gameVersion',
  'contentVersion',
  'locale',
  'selectedDifficulty',
  'completedPlay',
  'durationMs',
  'numberOfAttempts',
  'hintsUsed',
  'studyItemId',
  'phase',
  'answer',
  'correct',
  'pixelCorrectCount',
  'pixelQuestionCount',
  'qcMonitorCount',
  'qcRetestCount',
  'qcHoldConfirmCount',
  'qcMissedSimulatedRisks',
  'qcUnnecessaryHolds',
  'qcInvalidComprehension',
  'qcAlertPreference',
  'spectrumGuesses',
  'spectrumHintLevel',
  'spectrumSolved',
  'spectrumDifficulty',
] as const;

function cell(value: string | number | boolean | null | undefined): string {
  if (value == null) return '';
  return csvEscape(String(value));
}

export function educationSessionsToCsv(sessions: readonly EducationStudySession[]): string {
  const lines = [CSV_HEADERS.join(',')];
  for (const session of sessions) {
    const pixel = session.outcome?.gameId === 'pixel' ? session.outcome.pixel : null;
    const qc = session.outcome?.gameId === 'qc-shift' ? session.outcome.qcShift : null;
    const sp = session.outcome?.gameId === 'spectrum' ? session.outcome.spectrum : null;
    const rows = session.answers.length > 0 ? session.answers : [null];
    for (const answer of rows) {
      lines.push(
        [
          cell(session.anonymousSessionId),
          cell(session.gameId),
          cell(session.gameVersion),
          cell(session.contentVersion),
          cell(session.locale),
          cell(session.selectedDifficulty),
          cell(session.completedPlay),
          cell(session.durationMs),
          cell(session.numberOfAttempts),
          cell(session.hintsUsed),
          cell(answer?.studyItemId),
          cell(answer?.phase),
          cell(answer?.answer),
          cell(answer?.correct),
          cell(pixel?.correctCount),
          cell(pixel?.questionCount),
          cell(qc?.monitorCount),
          cell(qc?.retestCount),
          cell(qc?.holdConfirmCount),
          cell(qc?.missedSimulatedRisks),
          cell(qc?.unnecessaryHolds),
          cell(qc?.qcInvalidComprehension),
          cell(qc?.alertInformationPreference),
          cell(sp?.guesses),
          cell(sp?.hintLevel),
          cell(sp?.solved),
          cell(sp?.difficulty),
        ].join(','),
      );
    }
  }
  return `${lines.join('\n')}\n`;
}
