/** Local preferences + campaign progress for Labyrinth wiki solo. */

export const LABYRINTH_STORAGE_KEY = 'suite.labyrinth.v1' as const;
export const LABYRINTH_STORAGE_VERSION = 2 as const;

export type LabyrinthStoredState = {
  storageVersion: typeof LABYRINTH_STORAGE_VERSION;
  locale: 'zh-Hant' | 'en';
  muted: boolean;
  lowDarkness: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  tutorialCompleted: boolean;
  lastSeed: string;
  bestTotal: number;
  bestBySeed: Record<string, number>;
};

export const DEFAULT_LABYRINTH_STORED_STATE: LabyrinthStoredState = {
  storageVersion: LABYRINTH_STORAGE_VERSION,
  locale: 'zh-Hant',
  muted: false,
  lowDarkness: false,
  highContrast: false,
  reducedMotion: false,
  tutorialCompleted: false,
  lastSeed: '',
  bestTotal: 0,
  bestBySeed: {},
};

export function migrateLabyrinthStoredState(raw: unknown): LabyrinthStoredState {
  if (raw == null || typeof raw !== 'object') {
    return { ...DEFAULT_LABYRINTH_STORED_STATE, bestBySeed: {} };
  }
  const data = raw as Record<string, unknown>;
  const bestBySeed: Record<string, number> = {};
  if (data.bestBySeed && typeof data.bestBySeed === 'object') {
    for (const [k, v] of Object.entries(data.bestBySeed as Record<string, unknown>)) {
      if (typeof v === 'number' && Number.isFinite(v)) bestBySeed[k] = Math.round(v);
    }
  }
  return {
    storageVersion: LABYRINTH_STORAGE_VERSION,
    locale: data.locale === 'en' || data.locale === 'zh-Hant' ? data.locale : 'zh-Hant',
    muted: Boolean(data.muted),
    lowDarkness: Boolean(data.lowDarkness),
    highContrast: Boolean(data.highContrast),
    reducedMotion: Boolean(data.reducedMotion),
    tutorialCompleted: Boolean(data.tutorialCompleted),
    lastSeed: typeof data.lastSeed === 'string' ? data.lastSeed : '',
    bestTotal: typeof data.bestTotal === 'number' ? Math.round(data.bestTotal) : 0,
    bestBySeed,
  };
}

export function parseLabyrinthStoredJson(text: string | null): LabyrinthStoredState {
  if (!text) return migrateLabyrinthStoredState(null);
  try {
    return migrateLabyrinthStoredState(JSON.parse(text));
  } catch {
    return migrateLabyrinthStoredState(null);
  }
}

export function recordSoloBest(
  state: LabyrinthStoredState,
  seed: string,
  total: number,
): LabyrinthStoredState {
  const prev = state.bestBySeed[seed] ?? 0;
  const bestBySeed = { ...state.bestBySeed, [seed]: Math.max(prev, total) };
  return {
    ...state,
    lastSeed: seed,
    bestTotal: Math.max(state.bestTotal, total),
    bestBySeed,
  };
}
