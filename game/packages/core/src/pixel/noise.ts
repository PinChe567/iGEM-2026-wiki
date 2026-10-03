import { shuffle } from '../rng';
import type { CellKind, NoisePercentOfOff } from './types';

/**
 * Fixed-count noise: `round(offCells * percent/100)` of originally-OFF cells.
 * Never covers a base-ON cell. Deterministic given seed.
 */
export function noiseCountForOffCells(
  offCount: number,
  percent: NoisePercentOfOff,
): number {
  if (percent === 0 || offCount <= 0) return 0;
  return Math.min(offCount, Math.round((offCount * percent) / 100));
}

export function injectNoise(
  basePattern: boolean[],
  percent: NoisePercentOfOff,
  seed: string,
): { noiseIndices: number[]; noiseCount: number; displayCells: CellKind[] } {
  const off = basePattern
    .map((on, index) => (on ? -1 : index))
    .filter((index) => index >= 0);
  const noiseCount = noiseCountForOffCells(off.length, percent);
  const noiseIndices = shuffle(off, seed).slice(0, noiseCount).sort((a, b) => a - b);
  const noiseSet = new Set(noiseIndices);

  for (const index of noiseIndices) {
    if (basePattern[index]) {
      throw new Error('Noise attempted to cover a base-ON cell');
    }
  }

  const displayCells: CellKind[] = basePattern.map((on, index) => {
    if (noiseSet.has(index)) return 'noise';
    if (on) return 'on';
    return 'off';
  });

  return { noiseIndices, noiseCount, displayCells };
}

export function patternDiff(
  shownBase: boolean[],
  answerBase: boolean[],
): { onlyAnswer: number[]; onlyShown: number[]; sharedOn: number[] } {
  const onlyAnswer: number[] = [];
  const onlyShown: number[] = [];
  const sharedOn: number[] = [];
  const n = Math.max(shownBase.length, answerBase.length);
  for (let i = 0; i < n; i += 1) {
    const a = Boolean(answerBase[i]);
    const s = Boolean(shownBase[i]);
    if (a && s) sharedOn.push(i);
    else if (a && !s) onlyAnswer.push(i);
    else if (!a && s) onlyShown.push(i);
  }
  return { onlyAnswer, onlyShown, sharedOn };
}
