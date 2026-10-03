/**
 * Local non-competitive Explorer Level progress for the wiki suite.
 * Never present as a global ranking.
 */

import { QC_SHIFT_STORAGE_KEY, parseQcShiftStoredJson } from '@suite/core/qc-shift';

export const SUITE_EXPLORER_KEY = 'suite.explorer.v1' as const;
export const SUITE_EXPLORER_VERSION = 1 as const;

export type ScienceCardId = 'suite' | 'pixel' | 'labyrinth' | 'spectrum';

export type SuiteExplorerState = {
  storageVersion: typeof SUITE_EXPLORER_VERSION;
  /** Local marks that the player opened science / model-limit cards. */
  scienceCards: Record<ScienceCardId, boolean>;
};

export const DEFAULT_SUITE_EXPLORER_STATE: SuiteExplorerState = {
  storageVersion: SUITE_EXPLORER_VERSION,
  scienceCards: {
    suite: false,
    pixel: false,
    labyrinth: false,
    spectrum: false,
  },
};

export function parseSuiteExplorerJson(text: string | null): SuiteExplorerState {
  if (!text) {
    return {
      ...DEFAULT_SUITE_EXPLORER_STATE,
      scienceCards: { ...DEFAULT_SUITE_EXPLORER_STATE.scienceCards },
    };
  }
  try {
    const raw = JSON.parse(text) as Record<string, unknown>;
    const cards = (raw.scienceCards ?? {}) as Record<string, unknown>;
    return {
      storageVersion: SUITE_EXPLORER_VERSION,
      scienceCards: {
        suite: Boolean(cards.suite),
        pixel: Boolean(cards.pixel),
        labyrinth: Boolean(cards.labyrinth),
        spectrum: Boolean(cards.spectrum),
      },
    };
  } catch {
    return {
      ...DEFAULT_SUITE_EXPLORER_STATE,
      scienceCards: { ...DEFAULT_SUITE_EXPLORER_STATE.scienceCards },
    };
  }
}

export function markScienceCard(
  state: SuiteExplorerState,
  id: ScienceCardId,
): SuiteExplorerState {
  return {
    ...state,
    scienceCards: { ...state.scienceCards, [id]: true },
  };
}

export type GameLocalProgress = {
  tutorialDone: boolean;
  practiceDone: boolean;
  dailyOrCampaignDone: boolean;
  scienceDone: boolean;
};

export type ExplorerSnapshot = {
  pixel: GameLocalProgress;
  labyrinth: GameLocalProgress;
  spectrum: GameLocalProgress;
  /** 0 .. maxLevel inclusive local badge — not a leaderboard. */
  level: number;
  maxLevel: number;
  checklist: Array<{ id: string; done: boolean }>;
};

function safeParse<T>(key: string, fallback: T, parse: (t: string | null) => T): T {
  try {
    return parse(localStorage.getItem(key));
  } catch {
    return fallback;
  }
}

/**
 * Aggregate localStorage from all three games + suite explorer marks.
 * Call only in browser.
 */
export function readExplorerSnapshot(args: {
  pixelKey: string;
  labyrinthKey: string;
  spectrumKey: string;
  parsePixel: (t: string | null) => {
    playedSeeds: string[];
    onboardingSeen?: boolean;
  };
  parseLabyrinth: (t: string | null) => {
    tutorialCompleted: boolean;
    bestTotal: number;
    lastSeed: string;
  };
  parseSpectrum: (t: string | null) => {
    tutorialSeen: boolean;
    playedSeeds: string[];
  };
}): ExplorerSnapshot {
  const explorer = safeParse(SUITE_EXPLORER_KEY, DEFAULT_SUITE_EXPLORER_STATE, parseSuiteExplorerJson);
  const pixel = safeParse(args.pixelKey, { playedSeeds: [] as string[] }, args.parsePixel);
  const labyrinth = safeParse(
    args.labyrinthKey,
    { tutorialCompleted: false, bestTotal: 0, lastSeed: '' },
    args.parseLabyrinth,
  );
  const qcShift = safeParse(QC_SHIFT_STORAGE_KEY, parseQcShiftStoredJson(null), parseQcShiftStoredJson);
  const spectrum = safeParse(
    args.spectrumKey,
    { tutorialSeen: false, playedSeeds: [] as string[] },
    args.parseSpectrum,
  );

  const pixelPractice = pixel.playedSeeds.some((s) => s.startsWith('p-') || !s.startsWith('d-'));
  const pixelDaily = pixel.playedSeeds.some((s) => s.startsWith('d-'));
  const spectrumPractice = spectrum.playedSeeds.some((s) => s.startsWith('sp-'));
  const spectrumDaily = spectrum.playedSeeds.some((s) => s.startsWith('sd-'));
  const qcPlayed = qcShift.playedSeeds.length > 0;
  const qcDaily = qcShift.playedSeeds.some((s) => s.startsWith('qcd-'));

  const pixelProg: GameLocalProgress = {
    tutorialDone: Boolean(pixel.onboardingSeen) || pixel.playedSeeds.length > 0,
    practiceDone: pixelPractice && pixel.playedSeeds.length > 0,
    dailyOrCampaignDone: pixelDaily,
    scienceDone: explorer.scienceCards.pixel || explorer.scienceCards.suite,
  };
  const labyrinthProg: GameLocalProgress = {
    tutorialDone: qcShift.tutorialSeen || labyrinth.tutorialCompleted || qcPlayed,
    practiceDone: qcPlayed || Boolean(labyrinth.lastSeed) || labyrinth.bestTotal > 0,
    dailyOrCampaignDone: qcDaily || labyrinth.bestTotal > 0,
    scienceDone: explorer.scienceCards.labyrinth || explorer.scienceCards.suite,
  };
  const spectrumProg: GameLocalProgress = {
    tutorialDone: spectrum.tutorialSeen,
    practiceDone: spectrumPractice || spectrum.playedSeeds.length > 0,
    dailyOrCampaignDone: spectrumDaily,
    scienceDone: explorer.scienceCards.spectrum || explorer.scienceCards.suite,
  };

  const checklist = [
    { id: 'pixel.tutorial', done: pixelProg.tutorialDone },
    { id: 'pixel.practice', done: pixelProg.practiceDone },
    { id: 'pixel.daily', done: pixelProg.dailyOrCampaignDone },
    { id: 'pixel.science', done: pixelProg.scienceDone },
    { id: 'labyrinth.tutorial', done: labyrinthProg.tutorialDone },
    { id: 'labyrinth.play', done: labyrinthProg.practiceDone },
    { id: 'labyrinth.science', done: labyrinthProg.scienceDone },
    { id: 'spectrum.tutorial', done: spectrumProg.tutorialDone },
    { id: 'spectrum.practice', done: spectrumProg.practiceDone },
    { id: 'spectrum.daily', done: spectrumProg.dailyOrCampaignDone },
    { id: 'spectrum.science', done: spectrumProg.scienceDone },
    { id: 'suite.science', done: explorer.scienceCards.suite },
  ];

  const maxLevel = checklist.length;
  const level = checklist.filter((c) => c.done).length;

  return {
    pixel: pixelProg,
    labyrinth: labyrinthProg,
    spectrum: spectrumProg,
    level,
    maxLevel,
    checklist,
  };
}

export function saveSuiteExplorer(state: SuiteExplorerState): void {
  try {
    localStorage.setItem(SUITE_EXPLORER_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function loadSuiteExplorer(): SuiteExplorerState {
  try {
    return parseSuiteExplorerJson(localStorage.getItem(SUITE_EXPLORER_KEY));
  } catch {
    return {
      ...DEFAULT_SUITE_EXPLORER_STATE,
      scienceCards: { ...DEFAULT_SUITE_EXPLORER_STATE.scienceCards },
    };
  }
}
