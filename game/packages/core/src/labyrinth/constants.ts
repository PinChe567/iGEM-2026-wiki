/** Timing and product constants for Scentbound Labyrinth pure core. */

export const LABYRINTH_GAME_VERSION = '0.1.0' as const;
export const LABYRINTH_MAP_VERSION = '1.0.0' as const;
export const LABYRINTH_CASE_SCHEMA_VERSION = '1.0.0' as const;

/** Brief active window after activating phaseShift. */
export const PHASE_SHIFT_DURATION_MS = 3_000;
/** Cooldown before phaseShift can be activated again. */
export const PHASE_SHIFT_COOLDOWN_MS = 25_000;
/** Artifact lifetime left on unauthorized gate passage. */
export const PHASE_SHIFT_ARTIFACT_MS = 8_000;

export const SIGNAL_JAM_DURATION_MS = 8_000;
export const SIGNAL_JAM_COOLDOWN_MS = 45_000;
/** Scanner/channel evidence marked corrupted for this window. */
export const SIGNAL_JAM_CORRUPTION_MS = 8_000;

/** Default explore phase length (pure timer; UI may display). */
export const EXPLORE_PHASE_MS = 120_000;
export const REVIEW_PHASE_MS = 60_000;
export const BRIEFING_PHASE_MS = 20_000;
export const VERDICT_PHASE_MS = 45_000;

export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 8;
export const MIN_LEGAL_TASKS_REACHABLE = 3;
