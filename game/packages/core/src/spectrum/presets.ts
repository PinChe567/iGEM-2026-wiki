import type { DifficultyId, DifficultyPreset } from './types';

export const SPECTRUM_DIFFICULTY_IDS: readonly DifficultyId[] = ['junior', 'easy', 'hard'];

/**
 * Junior / easy (Standard) / hard (Challenge) presets.
 * Percent 0% means unused; only >0 components enter the mixture / A/B.
 * Internal ids `easy` and `hard` stay stable for seeds, scores, and old storage.
 */
export const SPECTRUM_PRESETS: Record<DifficultyId, DifficultyPreset> = {
  junior: {
    id: 'junior',
    odorCount: 4,
    componentCountMin: 2,
    componentCountMax: 2,
    percentStep: 25,
    minPercent: 25,
    maxGuesses: 6,
    mixingModel: 'linear',
    showSignatureHints: true,
    revealComponentCount: true,
  },
  easy: {
    id: 'easy',
    odorCount: 6,
    componentCountMin: 2,
    componentCountMax: 3,
    percentStep: 10,
    minPercent: 10,
    maxGuesses: 8,
    mixingModel: 'linear',
    showSignatureHints: true,
    revealComponentCount: true,
  },
  hard: {
    id: 'hard',
    odorCount: 10,
    componentCountMin: 2,
    componentCountMax: 4,
    percentStep: 10,
    minPercent: 10,
    maxGuesses: 10,
    mixingModel: 'saturated',
    showSignatureHints: true,
    revealComponentCount: false,
  },
};

export function isDifficultyId(value: string): value is DifficultyId {
  return (SPECTRUM_DIFFICULTY_IDS as readonly string[]).includes(value);
}

/** Map stored / UI values onto internal ids. Older `easy` / `hard` stay valid. */
export function parseDifficultyId(value: unknown, fallback: DifficultyId = 'junior'): DifficultyId {
  if (value === 'standard') return 'easy';
  if (value === 'challenge') return 'hard';
  if (typeof value === 'string' && isDifficultyId(value)) return value;
  return fallback;
}

export function getPreset(id: DifficultyId): DifficultyPreset {
  const preset = SPECTRUM_PRESETS[id];
  if (!preset) throw new Error(`Unknown spectrum difficulty: ${id}`);
  return preset;
}
