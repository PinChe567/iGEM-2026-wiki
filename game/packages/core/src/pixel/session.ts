import { createRng } from '../rng';
import { CONTENT_VERSION_PLACEHOLDER } from './content-version';
import { buildQuestions, pickSessionPool } from './questions';
import { getPreset, mergePracticeSettings } from './presets';
import type {
  BuiltSession,
  DifficultySettings,
  PixelOdor,
  SessionMeta,
  SessionMode,
} from './types';
import { PIXEL_GAME_VERSION, PIXEL_SEED_VERSION } from './versions';

export function createPracticeSeed(nowMs: number = Date.now()): string {
  const rng = createRng(`practice-entropy-${nowMs}`);
  const part = () => Math.floor(rng() * 1e9).toString(36);
  // Include a second entropy source for practice-only unpredictability;
  // replay always goes through an explicit seed string afterward.
  const salt = Math.floor(Math.random() * 1e9).toString(36);
  return `p-${part()}-${salt}`;
}

/** Daily seed is stable for a UTC calendar day + game version. */
export function createDailySeed(dateUTC: string, gameVersion = PIXEL_GAME_VERSION): string {
  return `d-${dateUTC}-v${gameVersion}`;
}

export function todayUTC(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function buildSessionMeta(args: {
  seed: string;
  mode: SessionMode;
  presetId: string;
  contentVersion?: string;
}): SessionMeta {
  return {
    seed: args.seed,
    seedVersion: PIXEL_SEED_VERSION,
    contentVersion: args.contentVersion ?? CONTENT_VERSION_PLACEHOLDER,
    gameVersion: PIXEL_GAME_VERSION,
    mode: args.mode,
    presetId: args.presetId,
  };
}

export function buildSession(args: {
  odors: readonly PixelOdor[];
  settings: DifficultySettings;
  meta: SessionMeta;
  patternCache?: Map<number, Map<string, boolean[]>>;
}): BuiltSession {
  const poolIds = pickSessionPool(args.odors, args.settings.poolSize, args.meta.seed);
  const questions = buildQuestions({
    odors: args.odors,
    poolIds,
    settings: args.settings,
    seed: args.meta.seed,
    patternCache: args.patternCache,
  });
  return {
    meta: args.meta,
    settings: args.settings,
    poolIds,
    questions,
  };
}

export function buildPracticeSession(args: {
  odors: readonly PixelOdor[];
  settings?: Partial<DifficultySettings>;
  seed?: string;
  contentVersion?: string;
  presetId?: string;
}): BuiltSession {
  const presetId = args.presetId ?? 'practice';
  const settings = mergePracticeSettings(args.settings ?? {}, presetId);
  const seed = args.seed ?? createPracticeSeed();
  const meta = buildSessionMeta({
    seed,
    mode: 'practice',
    presetId,
    contentVersion: args.contentVersion,
  });
  return buildSession({ odors: args.odors, settings, meta });
}

export function buildDailySession(args: {
  odors: readonly PixelOdor[];
  presetId?: string;
  dateUTC?: string;
  contentVersion?: string;
}): BuiltSession {
  const presetId = args.presetId ?? 'daily-standard';
  const settings = getPreset(presetId);
  const dateUTC = args.dateUTC ?? todayUTC();
  const seed = createDailySeed(dateUTC);
  const meta = buildSessionMeta({
    seed,
    mode: 'daily',
    presetId,
    contentVersion: args.contentVersion,
  });
  return buildSession({ odors: args.odors, settings, meta });
}

export function replaySession(args: {
  odors: readonly PixelOdor[];
  settings: DifficultySettings;
  meta: SessionMeta;
}): BuiltSession {
  return buildSession(args);
}
