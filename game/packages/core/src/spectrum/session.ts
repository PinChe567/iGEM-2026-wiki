import { createRng } from '../rng';
import { SPECTRUM_GAME_VERSION, SPECTRUM_RULE_VERSION } from './rules';
import { getPreset } from './presets';
import { buildPuzzle } from './generator';
import type {
  DifficultyId,
  SignatureLookup,
  SpectrumPuzzle,
} from './types';

export type SpectrumSessionMode = 'practice' | 'daily';

export type SpectrumSessionMeta = {
  seed: string;
  mode: SpectrumSessionMode;
  difficulty: DifficultyId;
  ruleVersion: string;
  contentVersion: string;
  gameVersion: string;
  /** localStorage / score comparison key — same preset + rule only. */
  scoreKey: string;
  /** Present for daily mode (UTC yyyy-mm-dd). */
  dateUTC?: string;
};

export type SpectrumSession = {
  meta: SpectrumSessionMeta;
  puzzle: SpectrumPuzzle;
};

export function spectrumScoreKey(
  difficulty: DifficultyId,
  ruleVersion: string = SPECTRUM_RULE_VERSION,
): string {
  return `${difficulty}|${ruleVersion}`;
}

export function createPracticeSeed(nowMs: number = Date.now()): string {
  const rng = createRng(`spectrum-practice-${nowMs}`);
  const part = () => Math.floor(rng() * 1e9).toString(36);
  const salt = Math.floor(Math.random() * 1e9).toString(36);
  return `sp-${part()}-${salt}`;
}

/** Wiki daily: date-based seed. Local challenge only — not an anti-cheat world board. */
export function createDailySeed(
  dateUTC: string,
  gameVersion: string = SPECTRUM_GAME_VERSION,
): string {
  return `sd-${dateUTC}-v${gameVersion}`;
}

export function todayUTC(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function buildSpectrumSession(args: {
  seed: string;
  mode: SpectrumSessionMode;
  difficulty: DifficultyId;
  signatures: SignatureLookup;
  odorIds: readonly string[];
  contentVersion: string;
  dateUTC?: string;
}): SpectrumSession {
  getPreset(args.difficulty); // validate
  const puzzle = buildPuzzle({
    seed: args.seed,
    difficulty: args.difficulty,
    signatures: args.signatures,
    odorIds: args.odorIds,
    contentVersion: args.contentVersion,
  });
  const meta: SpectrumSessionMeta = {
    seed: args.seed,
    mode: args.mode,
    difficulty: args.difficulty,
    ruleVersion: SPECTRUM_RULE_VERSION,
    contentVersion: args.contentVersion,
    gameVersion: SPECTRUM_GAME_VERSION,
    scoreKey: spectrumScoreKey(args.difficulty),
    dateUTC: args.dateUTC,
  };
  return { meta, puzzle };
}

export function buildPracticeSpectrumSession(args: {
  difficulty: DifficultyId;
  signatures: SignatureLookup;
  odorIds: readonly string[];
  contentVersion: string;
  seed?: string;
}): SpectrumSession {
  return buildSpectrumSession({
    seed: args.seed ?? createPracticeSeed(),
    mode: 'practice',
    difficulty: args.difficulty,
    signatures: args.signatures,
    odorIds: args.odorIds,
    contentVersion: args.contentVersion,
  });
}

export function buildDailySpectrumSession(args: {
  difficulty: DifficultyId;
  signatures: SignatureLookup;
  odorIds: readonly string[];
  contentVersion: string;
  dateUTC?: string;
}): SpectrumSession {
  const dateUTC = args.dateUTC ?? todayUTC();
  return buildSpectrumSession({
    seed: createDailySeed(dateUTC),
    mode: 'daily',
    difficulty: args.difficulty,
    signatures: args.signatures,
    odorIds: args.odorIds,
    contentVersion: args.contentVersion,
    dateUTC,
  });
}
