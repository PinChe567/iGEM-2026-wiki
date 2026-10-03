import { createRng, shuffle } from '../rng';
import { SPECTRUM_RULES } from './rules';
import { getPreset } from './presets';
import {
  canonicalizeMixture,
  combinations,
  enumeratePercentCompositions,
  mixtureKey,
} from './mixture';
import { computeSignals } from './signal';
import type {
  CanonicalMixture,
  DifficultyId,
  DifficultyPreset,
  SignatureLookup,
  SpectrumPuzzle,
  SpectrumRuleSet,
} from './types';

export type EnumerateOptions = {
  odorIds: readonly string[];
  preset: DifficultyPreset;
};

/**
 * Enumerate every legal canonical mixture for a difficulty preset.
 * Component order is normalized (sorted odorId); duplicate odors never appear.
 */
export function enumerateLegalMixtures(options: EnumerateOptions): CanonicalMixture[] {
  const { odorIds, preset } = options;
  if (odorIds.length < preset.odorCount) {
    throw new Error(
      `Need at least ${preset.odorCount} odors for ${preset.id}, got ${odorIds.length}`,
    );
  }
  const pool = odorIds.slice(0, preset.odorCount);
  const out: CanonicalMixture[] = [];
  const seen = new Set<string>();

  for (
    let n = preset.componentCountMin;
    n <= preset.componentCountMax;
    n += 1
  ) {
    const comps = enumeratePercentCompositions(
      n,
      100,
      preset.percentStep,
      preset.minPercent,
    );
    const odorCombos = combinations(pool, n);
    for (const odors of odorCombos) {
      // odors already in roster order; assign composition slots in that order,
      // then canonicalize (same as roster order when pool is sorted by id — we still canonicalize).
      for (const percents of comps) {
        const components = odors.map((odorId, i) => ({
          odorId,
          percent: percents[i]!,
        }));
        const canonical = canonicalizeMixture(components);
        const key = mixtureKey(canonical);
        if (!seen.has(key)) {
          seen.add(key);
          out.push(canonical);
        }
      }
    }
  }

  // Stable order by key for deterministic seed indexing.
  out.sort((a, b) => {
    const ka = mixtureKey(a);
    const kb = mixtureKey(b);
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
  return out;
}

export function selectSpectrumPool(
  odorIds: readonly string[],
  count: number,
  seed: string,
  ruleVersion: string = SPECTRUM_RULES.ruleVersion,
): string[] {
  if (count < 1 || odorIds.length < count) {
    throw new Error(`Need at least ${count} odors to build a pool of ${count}, got ${odorIds.length}`);
  }
  return shuffle(odorIds, `spectrum-pool:${ruleVersion}:${seed}`).slice(0, count);
}

export function pickTruthBySeed(
  legal: readonly CanonicalMixture[],
  seed: string,
  ruleVersion: string = SPECTRUM_RULES.ruleVersion,
): CanonicalMixture {
  if (legal.length === 0) throw new Error('No legal mixtures to pick from');
  const rng = createRng(`spectrum-truth:${ruleVersion}:${seed}`);
  const idx = Math.floor(rng() * legal.length);
  return legal[idx]!;
}

export type BuildPuzzleInput = {
  seed: string;
  difficulty: DifficultyId;
  /** Full catalog signatures. */
  signatures: SignatureLookup;
  /** Ordered catalog ids; a seed-shuffled slice of preset.odorCount becomes the pool. */
  odorIds: readonly string[];
  contentVersion: string;
  rules?: SpectrumRuleSet;
};

export function buildPuzzle(input: BuildPuzzleInput): SpectrumPuzzle {
  const rules = input.rules ?? SPECTRUM_RULES;
  const preset = getPreset(input.difficulty);
  const poolIds = selectSpectrumPool(input.odorIds, preset.odorCount, input.seed, rules.ruleVersion);
  const legal = enumerateLegalMixtures({
    odorIds: poolIds,
    preset,
  });
  const truth = pickTruthBySeed(legal, input.seed, rules.ruleVersion);
  const signals = computeSignals(
    truth,
    input.signatures,
    preset.mixingModel,
    input.seed,
    rules,
  );

  return {
    seed: input.seed,
    ruleVersion: rules.ruleVersion,
    contentVersion: input.contentVersion,
    difficulty: input.difficulty,
    poolIds,
    truth,
    observedSignal: signals.observed,
    linearSignal: signals.linear,
    saturatedSignal: signals.saturated,
    legalMixtureCount: legal.length,
  };
}
