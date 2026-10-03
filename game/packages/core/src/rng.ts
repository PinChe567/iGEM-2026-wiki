/**
 * Seeded RNG matching the legacy Game 1 `hash` / `shuffle` in root `app.js`.
 * Same seed string ⇒ identical sequence in browser and Node.
 */
export type Rng = () => number;

/** FNV-1a style seed mixer returning a Mulberry32-like generator (legacy-compatible). */
export function createRng(seed: string): Rng {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** @deprecated Prefer createRng — alias kept for migration clarity. */
export const hash = createRng;

export function shuffle<T>(items: readonly T[], seed: string): T[] {
  const result = [...items];
  const random = createRng(seed);
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function randomInt(rng: Rng, maxExclusive: number): number {
  return Math.floor(rng() * maxExclusive);
}
