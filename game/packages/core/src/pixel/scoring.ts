import type { AnswerOutcome, DifficultySettings, ResultSummary } from './types';

export function initialScore(): number {
  return 0;
}

export function maxScore(settings: DifficultySettings): number {
  return settings.questionCount * settings.pointsPerCorrect;
}

/**
 * Apply one answer. Rejects out-of-range / already-answered / unknown option.
 * Score never exceeds max or goes negative.
 */
export function applyAnswer(args: {
  settings: DifficultySettings;
  currentScore: number;
  answerId: string;
  optionIds: readonly string[];
  chosenId: string | null | undefined;
  alreadyAnswered: boolean;
}): AnswerOutcome {
  const { settings, currentScore, answerId, optionIds, chosenId, alreadyAnswered } = args;

  if (alreadyAnswered) {
    return {
      correct: false,
      scoreDelta: 0,
      nextScore: clampScore(currentScore, settings),
      alreadyAnswered: true,
    };
  }

  if (chosenId == null || chosenId === '' || !optionIds.includes(chosenId)) {
    return {
      correct: false,
      scoreDelta: 0,
      nextScore: clampScore(currentScore, settings),
      alreadyAnswered: false,
    };
  }

  const correct = chosenId === answerId;
  const scoreDelta = correct ? settings.pointsPerCorrect : 0;
  return {
    correct,
    scoreDelta,
    nextScore: clampScore(currentScore + scoreDelta, settings),
    alreadyAnswered: false,
  };
}

export function clampScore(score: number, settings: DifficultySettings): number {
  if (!Number.isFinite(score)) return 0;
  const max = maxScore(settings);
  return Math.min(max, Math.max(0, Math.round(score)));
}

export function summarizeResult(
  score: number,
  settings: DifficultySettings,
): ResultSummary {
  const safe = clampScore(score, settings);
  const correctCount = settings.pointsPerCorrect > 0 ? safe / settings.pointsPerCorrect : 0;
  if (!Number.isInteger(correctCount)) {
    // Non-aligned score → floor for display safety
  }
  const count = Math.round(correctCount);
  return {
    correctCount: count,
    score: safe,
    maxScore: maxScore(settings),
    passed: count >= settings.passCorrect,
    perfect: count === settings.questionCount,
    passCorrect: settings.passCorrect,
    questionCount: settings.questionCount,
  };
}
