import type { CanonicalMixture, MixtureComponent } from './types';

export type MixtureValidationError =
  | 'empty'
  | 'duplicate_odor'
  | 'non_integer_percent'
  | 'percent_out_of_range'
  | 'sum_not_100'
  | 'below_min_percent'
  | 'not_on_step'
  | 'component_count';

export type MixtureValidationOk = {
  ok: true;
  canonical: CanonicalMixture;
};

export type MixtureValidationFail = {
  ok: false;
  error: MixtureValidationError;
};

export type MixtureValidation = MixtureValidationOk | MixtureValidationFail;

function compareOdorId(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Sort by odorId; identity for already-canonical input. */
export function canonicalizeMixture(
  components: readonly MixtureComponent[],
): CanonicalMixture {
  const sorted = [...components].sort((a, b) => compareOdorId(a.odorId, b.odorId));
  return {
    components: sorted.map((c) => ({ odorId: c.odorId, percent: c.percent })),
  };
}

export function mixtureKey(mixture: CanonicalMixture): string {
  return mixture.components.map((c) => `${c.odorId}:${c.percent}`).join('|');
}

export function mixturesEqual(a: CanonicalMixture, b: CanonicalMixture): boolean {
  return mixtureKey(a) === mixtureKey(b);
}

/**
 * Validate + canonicalize. Exact equality uses integer percents only (no float epsilons).
 */
export function validateMixture(
  components: readonly MixtureComponent[],
  options?: {
    minPercent?: number;
    percentStep?: number;
    componentCountMin?: number;
    componentCountMax?: number;
  },
): MixtureValidation {
  if (components.length === 0) return { ok: false, error: 'empty' };

  const min = options?.componentCountMin;
  const max = options?.componentCountMax;
  if (min !== undefined && components.length < min) {
    return { ok: false, error: 'component_count' };
  }
  if (max !== undefined && components.length > max) {
    return { ok: false, error: 'component_count' };
  }

  const seen = new Set<string>();
  let sum = 0;
  for (const c of components) {
    if (seen.has(c.odorId)) return { ok: false, error: 'duplicate_odor' };
    seen.add(c.odorId);
    if (!Number.isInteger(c.percent)) return { ok: false, error: 'non_integer_percent' };
    if (c.percent < 0 || c.percent > 100) return { ok: false, error: 'percent_out_of_range' };
    if (options?.minPercent !== undefined && c.percent < options.minPercent) {
      return { ok: false, error: 'below_min_percent' };
    }
    if (options?.percentStep !== undefined && c.percent % options.percentStep !== 0) {
      return { ok: false, error: 'not_on_step' };
    }
    sum += c.percent;
  }
  if (sum !== 100) return { ok: false, error: 'sum_not_100' };

  return { ok: true, canonical: canonicalizeMixture(components) };
}

/** Enumerate integer compositions of `sum` into `n` parts, each on step and >= min. */
export function enumeratePercentCompositions(
  n: number,
  sum: number,
  step: number,
  minPercent: number,
): number[][] {
  const out: number[][] = [];

  function rec(remainingParts: number, remainingSum: number, acc: number[]): void {
    if (remainingParts === 1) {
      if (
        remainingSum >= minPercent &&
        remainingSum <= 100 &&
        remainingSum % step === 0
      ) {
        out.push([...acc, remainingSum]);
      }
      return;
    }
    for (let p = minPercent; p <= remainingSum - minPercent * (remainingParts - 1); p += step) {
      acc.push(p);
      rec(remainingParts - 1, remainingSum - p, acc);
      acc.pop();
    }
  }

  rec(n, sum, []);
  return out;
}

/** Combinations of size k from items (order preserved from input). */
export function combinations<T>(items: readonly T[], k: number): T[][] {
  const result: T[][] = [];
  const n = items.length;
  if (k < 0 || k > n) return result;

  const idxs = Array.from({ length: k }, (_, i) => i);
  while (true) {
    result.push(idxs.map((i) => items[i]!));
    let i = k - 1;
    while (i >= 0 && idxs[i] === n - k + i) i -= 1;
    if (i < 0) break;
    idxs[i]! += 1;
    for (let j = i + 1; j < k; j += 1) idxs[j] = idxs[j - 1]! + 1;
  }
  return result;
}
