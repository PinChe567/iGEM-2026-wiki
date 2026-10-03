import { scoreEducationAnswer } from './items';
import type {
  EducationAnswer,
  EducationGameId,
  EducationGameOutcome,
  EducationItemId,
  EducationLocale,
  EducationPhase,
  EducationStudySession,
} from './types';
import { EDUCATION_SCHEMA_VERSION } from './types';

export function createAnonymousSessionId(): string {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
    return cryptoObj.randomUUID();
  }
  return `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function createEducationSession(args: {
  gameId: EducationGameId;
  gameVersion: string;
  contentVersion: string;
  locale: EducationLocale;
  selectedDifficulty?: string | null;
}): EducationStudySession {
  return {
    schemaVersion: EDUCATION_SCHEMA_VERSION,
    anonymousSessionId: createAnonymousSessionId(),
    gameId: args.gameId,
    gameVersion: args.gameVersion,
    contentVersion: args.contentVersion,
    locale: args.locale,
    selectedDifficulty: args.selectedDifficulty ?? null,
    startedAt: new Date().toISOString(),
    completedPlay: false,
    durationMs: null,
    numberOfAttempts: null,
    hintsUsed: null,
    answers: [],
    outcome: null,
  };
}

export function recordEducationAnswer(
  session: EducationStudySession,
  args: { studyItemId: EducationItemId; phase: EducationPhase; answer: string },
): EducationStudySession {
  const recordedAt = new Date().toISOString();
  const correct = scoreEducationAnswer(args.studyItemId, args.answer);
  const next: EducationAnswer = {
    studyItemId: args.studyItemId,
    phase: args.phase,
    answer: args.answer,
    correct,
    recordedAt,
  };
  const answers = session.answers.filter(
    (row) => !(row.studyItemId === args.studyItemId && row.phase === args.phase),
  );
  return { ...session, answers: [...answers, next] };
}

export function markEducationPlayComplete(
  session: EducationStudySession,
  args: {
    durationMs: number | null;
    numberOfAttempts: number | null;
    hintsUsed: number | null;
    selectedDifficulty?: string | null;
    outcome: EducationGameOutcome | null;
  },
): EducationStudySession {
  return {
    ...session,
    completedPlay: true,
    durationMs: args.durationMs != null && Number.isFinite(args.durationMs) ? Math.max(0, Math.round(args.durationMs)) : null,
    numberOfAttempts:
      args.numberOfAttempts != null && Number.isFinite(args.numberOfAttempts)
        ? Math.max(0, Math.round(args.numberOfAttempts))
        : null,
    hintsUsed:
      args.hintsUsed != null && Number.isFinite(args.hintsUsed) ? Math.max(0, Math.round(args.hintsUsed)) : null,
    selectedDifficulty: args.selectedDifficulty ?? session.selectedDifficulty,
    outcome: args.outcome,
  };
}

/** Query flag. Public play is unchanged unless this is explicitly set. */
export function isStudyQueryEnabled(search: string): boolean {
  const raw = search.startsWith('?') ? search.slice(1) : search;
  try {
    return new URLSearchParams(raw).get('study') === '1';
  } catch {
    return false;
  }
}
