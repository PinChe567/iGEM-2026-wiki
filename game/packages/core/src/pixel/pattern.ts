import { createRng, shuffle } from '../rng';
import type { PixelOdor } from './types';

/**
 * Illustrative virtual-receptor pattern model (deterministic).
 * Not derived from human, Drosophila, or AeroSense measurements.
 */
export function cellFeatures(size: number, index: number): number[] {
  const random = createRng(`receptor-${size}-${index}`);
  return [random(), random(), random(), random(), random()];
}

export function activeCellCount(size: number): number {
  const total = size * size;
  return Math.max(3, Math.round(total * 0.36));
}

export function rawOdorPattern(odor: PixelOdor, size: number): boolean[] {
  const total = size * size;
  const activeCount = activeCellCount(size);
  const personal = createRng(`${odor.id}-${size}`);
  const vectorSum = odor.vector.reduce((sum, value) => sum + value, 0);
  const ranked = Array.from({ length: total }, (_, index) => {
    const features = cellFeatures(size, index);
    const affinity =
      features.reduce((sum, value, i) => sum + value * (odor.vector[i] ?? 0), 0) / vectorSum;
    return { index, score: affinity + personal() * 0.13 };
  }).sort((a, b) => b.score - a.score);
  const active = new Set(ranked.slice(0, activeCount).map((item) => item.index));
  return Array.from({ length: total }, (_, index) => active.has(index));
}

export function patternsForSize(
  odors: readonly PixelOdor[],
  size: number,
): Map<string, boolean[]> {
  const patterns = new Map<string, boolean[]>();
  const used = new Set<string>();

  for (const odor of odors) {
    const original = rawOdorPattern(odor, size);
    let candidate = original;
    let signature = candidate.map(Number).join('');

    if (used.has(signature)) {
      const active = original.map((value, index) => (value ? index : -1)).filter((i) => i >= 0);
      const off = original.map((value, index) => (value ? -1 : index)).filter((i) => i >= 0);
      const variants: Array<[number, number]> = [];
      for (const onIndex of active) {
        for (const offIndex of off) variants.push([onIndex, offIndex]);
      }
      const ordered = shuffle(variants, `signature-${odor.id}-${size}`);
      for (const [onIndex, offIndex] of ordered) {
        const variant = [...original];
        variant[onIndex] = false;
        variant[offIndex] = true;
        const variantSignature = variant.map(Number).join('');
        if (!used.has(variantSignature)) {
          candidate = variant;
          signature = variantSignature;
          break;
        }
      }
    }

    used.add(signature);
    patterns.set(odor.id, candidate);
  }

  return patterns;
}

export function odorPattern(
  odors: readonly PixelOdor[],
  odorId: string,
  size: number,
  cache?: Map<number, Map<string, boolean[]>>,
): boolean[] {
  let bySize = cache?.get(size);
  if (!bySize) {
    bySize = patternsForSize(odors, size);
    cache?.set(size, bySize);
  }
  const pattern = bySize.get(odorId);
  if (!pattern) throw new Error(`Missing pattern for odor ${odorId} at size ${size}`);
  return pattern;
}

export function assertPatternsUnique(patterns: Map<string, boolean[]>): void {
  const signatures = [...patterns.values()].map((p) => p.map(Number).join(''));
  if (new Set(signatures).size !== signatures.length) {
    throw new Error('Pattern uniqueness violated');
  }
}
