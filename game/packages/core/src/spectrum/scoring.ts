import type { DifficultyId } from './types';
import { SPECTRUM_RULE_VERSION } from './rules';
import { getPreset } from './presets';
import { spectrumScoreKey } from './session';

/** Per staged hint on Junior / Standard. Challenge is unpenalized. Never zeroes a solved run by itself. */
export const HINT_SCORE_PENALTY = 400;

export type SpectrumScoreBreakdown = {
  solved: boolean;
  guessesUsed: number;
  maxGuesses: number;
  elapsedMs: number;
  difficulty: DifficultyId;
  ruleVersion: string;
  /** Compare bests only when this matches. */
  scoreKey: string;
  /** Points from remaining guesses (0 if unsolved). */
  guessScore: number;
  /** Points from elapsed time (0 if unsolved or Junior). */
  timeScore: number;
  totalScore: number;
};

/**
 * Score is only meaningful within the same scoreKey (difficulty + ruleVersion).
 * UI must display guessScore and timeScore separately.
 */
export function computeSpectrumScore(args: {
  solved: boolean;
  guessesUsed: number;
  difficulty: DifficultyId;
  elapsedMs: number;
  ruleVersion?: string;
  /** Staged hints used (0–3). Junior/Standard subtract a small penalty; never blocks a solve. */
  hintsUsed?: number;
}): SpectrumScoreBreakdown {
  const ruleVersion = args.ruleVersion ?? SPECTRUM_RULE_VERSION;
  const preset = getPreset(args.difficulty);
  const maxGuesses = preset.maxGuesses;
  const guessesUsed = Math.max(0, Math.min(maxGuesses, Math.round(args.guessesUsed)));
  const elapsedMs = Math.max(0, Math.round(args.elapsedMs));
  const scoreKey = spectrumScoreKey(args.difficulty, ruleVersion);
  const hintsUsed = Math.max(0, Math.min(3, Math.round(args.hintsUsed ?? 0)));

  if (!args.solved) {
    return {
      solved: false,
      guessesUsed,
      maxGuesses,
      elapsedMs,
      difficulty: args.difficulty,
      ruleVersion,
      scoreKey,
      guessScore: 0,
      timeScore: 0,
      totalScore: 0,
    };
  }

  const unused = Math.max(0, maxGuesses - guessesUsed);
  const guessScore = 5_000 + unused * 1_000;
  // Full time bonus under 30s; linear decay to 0 by 3 minutes. Junior does not use time score.
  const elapsedSec = elapsedMs / 1000;
  const timeScore =
    args.difficulty === 'junior'
      ? 0
      : Math.max(0, Math.round(2_000 * Math.max(0, 1 - Math.max(0, elapsedSec - 30) / 150)));

  const hintPenalty = args.difficulty === 'hard' ? 0 : HINT_SCORE_PENALTY * hintsUsed;
  const totalScore = Math.max(0, guessScore + timeScore - hintPenalty);

  return {
    solved: true,
    guessesUsed,
    maxGuesses,
    elapsedMs,
    difficulty: args.difficulty,
    ruleVersion,
    scoreKey,
    guessScore,
    timeScore,
    totalScore,
  };
}

export function formatElapsed(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
