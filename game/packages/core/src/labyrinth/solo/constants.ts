/** Solo wiki campaign constants (1 human + 4 NPCs). */

export const SOLO_HUMAN_ID = 'P1' as const;
export const SOLO_ACTOR_COUNT = 5 as const;
export const SOLO_NPC_COUNT = 4 as const;

/** Target round length ~6–8 minutes excluding tutorial. */
export const SOLO_EXPLORE_MS = 150_000;
export const SOLO_REVIEW_MS = 50_000;
export const SOLO_BRIEFING_MS = 25_000;
export const SOLO_VERDICT_MS = 60_000;
export const SOLO_TUTORIAL_MS = 75_000;

export const SOLO_TASK_KINDS = [
  'patternPair',
  'signalRouting',
  'calibrationHold',
  'memoryOrder',
] as const;

export type SoloTaskKind = (typeof SOLO_TASK_KINDS)[number];
