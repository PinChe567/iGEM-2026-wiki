/**
 * Versioned local progress for QC Shift.
 * No names, analytics, or network — browser localStorage only.
 */

export const QC_SHIFT_STORAGE_KEY = 'suite.qc-shift.v1' as const;
export const QC_SHIFT_STORAGE_VERSION = 1 as const;

export type QcShiftStoredScorecard = {
  safety: number;
  foodSaved: number;
  unnecessaryHold: number;
  efficiency: number;
};

export type QcShiftStoredState = {
  storageVersion: typeof QC_SHIFT_STORAGE_VERSION;
  locale: 'zh-Hant' | 'en';
  playedSeeds: string[];
  tutorialSeen: boolean;
  /** Local educational/UI feedback only — never a market or regulatory claim. */
  designHelpChoices: string[];
  designHelpSubmitted: boolean;
  /** Best card by preset — compared by safety first, then efficiency, then foodSaved. */
  bestByPreset: Record<string, QcShiftStoredScorecard>;
};

export const DEFAULT_QC_SHIFT_STORED_STATE: QcShiftStoredState = {
  storageVersion: QC_SHIFT_STORAGE_VERSION,
  locale: 'zh-Hant',
  playedSeeds: [],
  tutorialSeen: false,
  designHelpChoices: [],
  designHelpSubmitted: false,
  bestByPreset: {},
};

function readScorecard(raw: unknown): QcShiftStoredScorecard | null {
  if (raw == null || typeof raw !== 'object') return null;
  const data = raw as Record<string, unknown>;
  const safety = data.safety;
  const foodSaved = data.foodSaved;
  const unnecessaryHold = data.unnecessaryHold;
  const efficiency = data.efficiency;
  if (
    typeof safety !== 'number' ||
    typeof foodSaved !== 'number' ||
    typeof unnecessaryHold !== 'number' ||
    typeof efficiency !== 'number'
  ) {
    return null;
  }
  if (![safety, foodSaved, unnecessaryHold, efficiency].every((n) => Number.isFinite(n))) return null;
  return {
    safety: Math.round(safety),
    foodSaved: Math.round(foodSaved),
    unnecessaryHold: Math.round(unnecessaryHold),
    efficiency: Math.round(efficiency),
  };
}

function isBetter(next: QcShiftStoredScorecard, prev: QcShiftStoredScorecard): boolean {
  if (next.safety !== prev.safety) return next.safety > prev.safety;
  if (next.efficiency !== prev.efficiency) return next.efficiency > prev.efficiency;
  return next.foodSaved > prev.foodSaved;
}

export function migrateQcShiftStoredState(raw: unknown): QcShiftStoredState {
  if (raw == null || typeof raw !== 'object') {
    return { ...DEFAULT_QC_SHIFT_STORED_STATE, playedSeeds: [], bestByPreset: {} };
  }
  const data = raw as Record<string, unknown>;
  const locale = data.locale === 'en' || data.locale === 'zh-Hant' ? data.locale : 'zh-Hant';
  const playedSeeds = Array.isArray(data.playedSeeds)
    ? data.playedSeeds.filter((s): s is string => typeof s === 'string').slice(-200)
    : [];
  const bestByPreset: Record<string, QcShiftStoredScorecard> = {};
  if (data.bestByPreset && typeof data.bestByPreset === 'object') {
    for (const [key, value] of Object.entries(data.bestByPreset as Record<string, unknown>)) {
      const card = readScorecard(value);
      if (card) bestByPreset[key] = card;
    }
  }
  const designHelpChoices = Array.isArray(data.designHelpChoices)
    ? data.designHelpChoices.filter((s): s is string => typeof s === 'string').slice(0, 12)
    : [];
  return {
    storageVersion: QC_SHIFT_STORAGE_VERSION,
    locale,
    playedSeeds,
    tutorialSeen: Boolean(data.tutorialSeen),
    designHelpChoices,
    designHelpSubmitted: Boolean(data.designHelpSubmitted),
    bestByPreset,
  };
}

export function parseQcShiftStoredJson(text: string | null): QcShiftStoredState {
  if (!text) return migrateQcShiftStoredState(null);
  try {
    return migrateQcShiftStoredState(JSON.parse(text));
  } catch {
    return migrateQcShiftStoredState(null);
  }
}

export function recordQcShiftPlayedSeed(state: QcShiftStoredState, seed: string): QcShiftStoredState {
  const playedSeeds = [...state.playedSeeds.filter((s) => s !== seed), seed].slice(-200);
  return { ...state, playedSeeds };
}

export function recordQcShiftBestScore(
  state: QcShiftStoredState,
  presetId: string,
  card: QcShiftStoredScorecard,
): QcShiftStoredState {
  const prev = state.bestByPreset[presetId];
  if (prev && !isBetter(card, prev)) return state;
  return {
    ...state,
    bestByPreset: { ...state.bestByPreset, [presetId]: { ...card } },
  };
}
