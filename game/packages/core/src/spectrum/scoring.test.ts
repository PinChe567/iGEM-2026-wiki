import { describe, expect, it } from 'vitest';
import {
  computeSpectrumScore,
  createDailySeed,
  spectrumScoreKey,
  parseSpectrumStoredJson,
  recordSpectrumBestScore,
  HINT_SCORE_PENALTY,
} from './index';

describe('spectrum scoring + storage', () => {
  it('scores only within scoreKey and splits guess/time', () => {
    const solved = computeSpectrumScore({
      solved: true,
      guessesUsed: 2,
      difficulty: 'easy',
      elapsedMs: 20_000,
    });
    expect(solved.scoreKey).toBe(spectrumScoreKey('easy'));
    expect(solved.totalScore).toBe(solved.guessScore + solved.timeScore);

    const fail = computeSpectrumScore({
      solved: false,
      guessesUsed: 8,
      difficulty: 'easy',
      elapsedMs: 90_000,
    });
    expect(fail.totalScore).toBe(0);
  });

  it('junior omits time score and applies a small hint penalty without blocking a solve', () => {
    const plain = computeSpectrumScore({
      solved: true,
      guessesUsed: 2,
      difficulty: 'junior',
      elapsedMs: 5_000,
    });
    expect(plain.timeScore).toBe(0);
    expect(plain.totalScore).toBe(plain.guessScore);

    const hinted = computeSpectrumScore({
      solved: true,
      guessesUsed: 2,
      difficulty: 'junior',
      elapsedMs: 5_000,
      hintsUsed: 2,
    });
    expect(hinted.totalScore).toBe(plain.guessScore - HINT_SCORE_PENALTY * 2);
    expect(hinted.totalScore).toBeGreaterThan(0);
  });

  it('challenge (hard) does not subtract hint penalty', () => {
    const plain = computeSpectrumScore({
      solved: true,
      guessesUsed: 2,
      difficulty: 'hard',
      elapsedMs: 20_000,
    });
    const hinted = computeSpectrumScore({
      solved: true,
      guessesUsed: 2,
      difficulty: 'hard',
      elapsedMs: 20_000,
      hintsUsed: 3,
    });
    expect(hinted.totalScore).toBe(plain.totalScore);
  });

  it('records best per scoreKey only when higher', () => {
    let state = parseSpectrumStoredJson(null);
    const key = spectrumScoreKey('hard');
    state = recordSpectrumBestScore(state, key, 100);
    state = recordSpectrumBestScore(state, key, 50);
    expect(state.bestByScoreKey[key]).toBe(100);
    expect(createDailySeed('2026-08-01')).toMatch(/^sd-2026-08-01-v/);
  });

  it('loads older easy/hard storage without dropping bests', () => {
    const parsed = parseSpectrumStoredJson(
      JSON.stringify({
        storageVersion: 1,
        locale: 'en',
        playedSeeds: ['sp-old'],
        bestByScoreKey: { 'easy|1': 8800, 'hard|1': 4200 },
      }),
    );
    expect(parsed.playedSeeds).toEqual(['sp-old']);
    expect(parsed.bestByScoreKey['easy|1']).toBe(8800);
    expect(parsed.bestByScoreKey['hard|1']).toBe(4200);
    expect(parsed.lastDifficulty).toBe('junior');
  });

  it('keeps stored easy/hard lastDifficulty ids', () => {
    const easy = parseSpectrumStoredJson(
      JSON.stringify({
        storageVersion: 1,
        locale: 'en',
        lastDifficulty: 'easy',
        bestByScoreKey: { 'easy|1': 100 },
      }),
    );
    expect(easy.lastDifficulty).toBe('easy');
    const hard = parseSpectrumStoredJson(
      JSON.stringify({
        storageVersion: 1,
        lastDifficulty: 'hard',
        bestByScoreKey: { 'hard|1': 50 },
      }),
    );
    expect(hard.lastDifficulty).toBe('hard');
  });
});
