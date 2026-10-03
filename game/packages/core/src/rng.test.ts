import { describe, expect, it } from 'vitest';
import { createRng, shuffle } from './rng';

describe('createRng', () => {
  it('is deterministic for the same seed', () => {
    const a = createRng('suite-seed-1');
    const b = createRng('suite-seed-1');
    const seqA = Array.from({ length: 8 }, () => a());
    const seqB = Array.from({ length: 8 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it('diverges for different seeds', () => {
    const a = createRng('alpha');
    const b = createRng('beta');
    expect([a(), a(), a()]).not.toEqual([b(), b(), b()]);
  });

  it('matches legacy Game 1 first draws for receptor-3-0', () => {
    const rng = createRng('receptor-3-0');
    expect(rng()).toBeCloseTo(0.46105148340575397, 12);
    expect(rng()).toBeCloseTo(0.7143834372982383, 12);
  });
});

describe('shuffle', () => {
  it('is stable for a fixed seed', () => {
    const input = [0, 1, 2, 3, 4, 5];
    expect(shuffle(input, 'fixed-order')).toEqual(shuffle(input, 'fixed-order'));
    expect(shuffle(input, 'fixed-order')).not.toEqual(input);
  });
});
