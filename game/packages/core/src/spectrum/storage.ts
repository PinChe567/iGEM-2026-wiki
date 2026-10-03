/**
 * Versioned local preferences / best scores for Scent Spectrum.
 * Bests are keyed by scoreKey (difficulty|ruleVersion) only.
 */

import { parseDifficultyId } from './presets';
import type { DifficultyId } from './types';

export const SPECTRUM_STORAGE_KEY = 'suite.spectrum.v1' as const;
export const SPECTRUM_STORAGE_VERSION = 1 as const;

export type SpectrumStoredState = {
  storageVersion: typeof SPECTRUM_STORAGE_VERSION;
  locale: 'zh-Hant' | 'en';
  reducedMotion: boolean;
  highContrast: boolean;
  tutorialSeen: boolean;
  playedSeeds: string[];
  /** Internal difficulty id. Older saves without this field default to junior. */
  lastDifficulty: DifficultyId;
  /** Best totalScore by scoreKey. */
  bestByScoreKey: Record<string, number>;
};

export const DEFAULT_SPECTRUM_STORED_STATE: SpectrumStoredState = {
  storageVersion: SPECTRUM_STORAGE_VERSION,
  locale: 'zh-Hant',
  reducedMotion: false,
  highContrast: false,
  tutorialSeen: false,
  playedSeeds: [],
  lastDifficulty: 'junior',
  bestByScoreKey: {},
};

export function migrateSpectrumStoredState(raw: unknown): SpectrumStoredState {
  if (raw == null || typeof raw !== 'object') {
    return {
      ...DEFAULT_SPECTRUM_STORED_STATE,
      playedSeeds: [],
      bestByScoreKey: {},
    };
  }
  const data = raw as Record<string, unknown>;
  const locale = data.locale === 'en' || data.locale === 'zh-Hant' ? data.locale : 'zh-Hant';
  const playedSeeds = Array.isArray(data.playedSeeds)
    ? data.playedSeeds.filter((s): s is string => typeof s === 'string').slice(-200)
    : [];
  const bestByScoreKey: Record<string, number> = {};
  if (data.bestByScoreKey && typeof data.bestByScoreKey === 'object') {
    for (const [key, value] of Object.entries(data.bestByScoreKey as Record<string, unknown>)) {
      if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
        bestByScoreKey[key] = Math.round(value);
      }
    }
  }
  return {
    storageVersion: SPECTRUM_STORAGE_VERSION,
    locale,
    reducedMotion: Boolean(data.reducedMotion),
    highContrast: Boolean(data.highContrast),
    tutorialSeen: Boolean(data.tutorialSeen),
    playedSeeds,
    lastDifficulty: parseDifficultyId(data.lastDifficulty),
    bestByScoreKey,
  };
}

export function parseSpectrumStoredJson(text: string | null): SpectrumStoredState {
  if (!text) return migrateSpectrumStoredState(null);
  try {
    return migrateSpectrumStoredState(JSON.parse(text));
  } catch {
    return migrateSpectrumStoredState(null);
  }
}

export function recordSpectrumPlayedSeed(
  state: SpectrumStoredState,
  seed: string,
): SpectrumStoredState {
  const playedSeeds = [...state.playedSeeds.filter((s) => s !== seed), seed].slice(-200);
  return { ...state, playedSeeds };
}

export function recordSpectrumBestScore(
  state: SpectrumStoredState,
  scoreKey: string,
  totalScore: number,
): SpectrumStoredState {
  if (!Number.isFinite(totalScore) || totalScore < 0) return state;
  const prev = state.bestByScoreKey[scoreKey] ?? 0;
  if (totalScore <= prev) return state;
  return {
    ...state,
    bestByScoreKey: { ...state.bestByScoreKey, [scoreKey]: Math.round(totalScore) },
  };
}
