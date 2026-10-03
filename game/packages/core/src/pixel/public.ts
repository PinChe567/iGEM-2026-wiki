import type { BuiltQuestion, BuiltSession, CellKind, DifficultySettings } from './types';

/** Stable public id for a question round — never encodes the answer. */
export function questionIdForRound(round: number): string {
  return `q${round}`;
}

export function roundFromQuestionId(questionId: string): number | null {
  const m = /^q(\d+)$/.exec(questionId);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

/**
 * Client-safe question payload. Omits answerId, basePattern, noiseIndices,
 * and any seed material that would reconstruct server truth.
 */
export type PublicPixelQuestion = {
  questionId: string;
  round: number;
  optionIds: string[];
  displayCells: CellKind[];
};

export type PublicPixelSession = {
  questionCount: number;
  poolIds: string[];
  settings: Pick<
    DifficultySettings,
    | 'matrixSize'
    | 'noisePercentOfOff'
    | 'allowStudyReview'
    | 'patternDisplayMs'
    | 'questionCount'
    | 'optionsPerQuestion'
    | 'passCorrect'
    | 'pointsPerCorrect'
  >;
  questions: PublicPixelQuestion[];
};

export function toPublicQuestion(q: BuiltQuestion): PublicPixelQuestion {
  return {
    questionId: questionIdForRound(q.round),
    round: q.round,
    optionIds: [...q.optionIds],
    displayCells: [...q.displayCells],
  };
}

export function toPublicSession(session: BuiltSession): PublicPixelSession {
  return {
    questionCount: session.settings.questionCount,
    poolIds: [...session.poolIds],
    settings: {
      matrixSize: session.settings.matrixSize,
      noisePercentOfOff: session.settings.noisePercentOfOff,
      allowStudyReview: session.settings.allowStudyReview,
      patternDisplayMs: session.settings.patternDisplayMs,
      questionCount: session.settings.questionCount,
      optionsPerQuestion: session.settings.optionsPerQuestion,
      passCorrect: session.settings.passCorrect,
      pointsPerCorrect: session.settings.pointsPerCorrect,
    },
    questions: session.questions.map(toPublicQuestion),
  };
}

/** Keys that must never appear in client-facing JSON for online modes. */
export const PIXEL_ANSWER_LEAK_KEYS = [
  'answerId',
  'answer_id',
  'basePattern',
  'noiseIndices',
  'privateSeed',
  'private_seed',
  'server_truth',
  'serverTruth',
  'answerKey',
  'answer_key',
] as const;

export function assertNoAnswerLeak(payload: unknown, path = 'root'): void {
  if (payload === null || payload === undefined) return;
  if (Array.isArray(payload)) {
    payload.forEach((item, i) => assertNoAnswerLeak(item, `${path}[${i}]`));
    return;
  }
  if (typeof payload !== 'object') return;
  for (const [k, v] of Object.entries(payload as Record<string, unknown>)) {
    if ((PIXEL_ANSWER_LEAK_KEYS as readonly string[]).includes(k)) {
      throw new Error(`answer_leak:${path}.${k}`);
    }
    assertNoAnswerLeak(v, `${path}.${k}`);
  }
}
