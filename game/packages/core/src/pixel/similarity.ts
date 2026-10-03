import type { PixelOdor } from './types';

/** Cosine similarity of illustrative feature vectors. */
export function similarity(a: PixelOdor, b: PixelOdor): number {
  const dot = a.vector.reduce((sum, value, i) => sum + value * (b.vector[i] ?? 0), 0);
  const ma = Math.sqrt(a.vector.reduce((sum, value) => sum + value * value, 0));
  const mb = Math.sqrt(b.vector.reduce((sum, value) => sum + value * value, 0));
  if (ma === 0 || mb === 0) return 0;
  return dot / (ma * mb);
}

export function rankBySimilarity(
  target: PixelOdor,
  candidates: readonly PixelOdor[],
): PixelOdor[] {
  return [...candidates]
    .filter((odor) => odor.id !== target.id)
    .sort((a, b) => similarity(target, b) - similarity(target, a));
}

/** Prefer nearest odor from the session pool; fall back to full catalog. */
export function nearestOdor(
  target: PixelOdor,
  pool: readonly PixelOdor[],
  catalog: readonly PixelOdor[] = pool,
): PixelOdor | undefined {
  const fromPool = rankBySimilarity(target, pool)[0];
  if (fromPool) return fromPool;
  return rankBySimilarity(target, catalog)[0];
}
