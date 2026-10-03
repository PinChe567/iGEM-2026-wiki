/**
 * Versioned local preferences / progress for Pixel Lab.
 * No names, analytics, or network — browser localStorage only.
 */

export const PIXEL_STORAGE_KEY = 'suite.pixel.v2' as const;
export const PIXEL_STORAGE_VERSION = 2 as const;

export type PixelStoredState = {
  storageVersion: typeof PIXEL_STORAGE_VERSION;
  locale: 'zh-Hant' | 'en';
  muted: boolean;
  reducedEffects: boolean;
  highContrast: boolean;
  /** Interactive onboarding has been completed at least once. */
  onboardingSeen: boolean;
  playedSeeds: string[];
  bestByPreset: Record<string, number>;
};

export const DEFAULT_PIXEL_STORED_STATE: PixelStoredState = {
  storageVersion: PIXEL_STORAGE_VERSION,
  locale: 'zh-Hant',
  muted: false,
  reducedEffects: false,
  highContrast: false,
  onboardingSeen: false,
  playedSeeds: [],
  bestByPreset: {},
};

export function migratePixelStoredState(raw: unknown): PixelStoredState {
  if (raw == null || typeof raw !== 'object') {
    return { ...DEFAULT_PIXEL_STORED_STATE, bestByPreset: {}, playedSeeds: [] };
  }

  const data = raw as Record<string, unknown>;

  // Legacy / corrupt payloads must not crash.
  const locale = data.locale === 'en' || data.locale === 'zh-Hant' ? data.locale : 'zh-Hant';
  const muted = Boolean(data.muted);
  const reducedEffects = Boolean(data.reducedEffects);
  const highContrast = Boolean(data.highContrast);

  const playedSeeds = Array.isArray(data.playedSeeds)
    ? data.playedSeeds.filter((s): s is string => typeof s === 'string').slice(-200)
    : [];

  const bestByPreset: Record<string, number> = {};
  if (data.bestByPreset && typeof data.bestByPreset === 'object') {
    for (const [key, value] of Object.entries(data.bestByPreset as Record<string, unknown>)) {
      if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
        bestByPreset[key] = Math.round(value);
      }
    }
  }

  // v1 may have used different shapes — ignore unknown fields.
  return {
    storageVersion: PIXEL_STORAGE_VERSION,
    locale,
    muted,
    reducedEffects,
    highContrast,
    onboardingSeen: Boolean(data.onboardingSeen),
    playedSeeds,
    bestByPreset,
  };
}

export function parsePixelStoredJson(text: string | null): PixelStoredState {
  if (!text) return migratePixelStoredState(null);
  try {
    return migratePixelStoredState(JSON.parse(text));
  } catch {
    return migratePixelStoredState(null);
  }
}

export function recordPlayedSeed(state: PixelStoredState, seed: string): PixelStoredState {
  const playedSeeds = [...state.playedSeeds.filter((s) => s !== seed), seed].slice(-200);
  return { ...state, playedSeeds };
}

export function recordBestScore(
  state: PixelStoredState,
  presetId: string,
  score: number,
): PixelStoredState {
  if (!Number.isFinite(score) || score < 0) return state;
  const prev = state.bestByPreset[presetId] ?? 0;
  if (score <= prev) return state;
  return {
    ...state,
    bestByPreset: { ...state.bestByPreset, [presetId]: Math.round(score) },
  };
}
