import type { ABResult, CanonicalMixture } from './types';

/** Percent of an odor in a mixture; omitted components are 0%. */
export function mixturePercent(mixture: CanonicalMixture, odorId: string): number {
  for (const c of mixture.components) {
    if (c.odorId === odorId) return c.percent;
  }
  return 0;
}

/**
 * Score only over odors that participate in the truth mixture (>0%).
 * Non-participating pool odors are ignored (false positives do not change A/B).
 *
 * - **A**: guess has the same concentration as truth for that participating odor.
 * - **B**: guess selected the odor (>0) but the concentration differs.
 * - Missed participating odor (guess 0%): neither A nor B.
 *
 * Perfect solve for a k-component truth ⇒ `{a: k, b: 0}` (e.g. 5A0B).
 *
 * `poolIds` is kept for call-site compatibility and is unused.
 */
export function scoreAB(
  guess: CanonicalMixture,
  truth: CanonicalMixture,
  _poolIds?: readonly string[],
): ABResult {
  void _poolIds;
  let a = 0;
  let b = 0;
  for (const comp of truth.components) {
    const t = comp.percent;
    const g = mixturePercent(guess, comp.odorId);
    if (t === g) a += 1;
    else if (g > 0) b += 1;
  }
  return { a, b };
}

export function formatAB(result: ABResult): string {
  return `${result.a}A${result.b}B`;
}

/**
 * True when every participating truth odor is exact (A === truth component count, B === 0).
 */
export function isPerfectAB(ab: ABResult, truthComponentCount: number): boolean {
  return ab.a === truthComponentCount && ab.b === 0;
}
