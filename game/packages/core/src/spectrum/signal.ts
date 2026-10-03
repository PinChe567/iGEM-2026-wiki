import { createRng, type Rng } from '../rng';
import { SPECTRUM_RULES } from './rules';
import type {
  CanonicalMixture,
  ChannelVector,
  MixingModel,
  SignatureLookup,
  SpectrumRuleSet,
} from './types';

function weight(percent: number, rules: SpectrumRuleSet): number {
  if (rules.weightNormalization !== 'percentOver100') {
    throw new Error(`Unsupported weightNormalization: ${rules.weightNormalization}`);
  }
  return percent / 100;
}

export function roundChannel(value: number, decimals: number): number {
  if (!Number.isFinite(value)) return value;
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

export function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function roundSignal(signal: ChannelVector, decimals: number): number[] {
  return signal.map((v) => roundChannel(v, decimals));
}

/**
 * Linear mix: x[j] = sum_i (w_i * r_ij) with w_i = percent_i / 100.
 * Requires signatures of length rules.channelCount.
 */
export function linearMix(
  mixture: CanonicalMixture,
  signatures: SignatureLookup,
  rules: SpectrumRuleSet = SPECTRUM_RULES,
): number[] {
  const x = Array.from({ length: rules.channelCount }, () => 0);
  for (const comp of mixture.components) {
    const sig = signatures.get(comp.odorId);
    if (!sig) throw new Error(`Missing signature for odor ${comp.odorId}`);
    if (sig.length !== rules.channelCount) {
      throw new Error(`Signature ${comp.odorId} length ${sig.length} != ${rules.channelCount}`);
    }
    const w = weight(comp.percent, rules);
    for (let j = 0; j < rules.channelCount; j += 1) {
      x[j]! += w * sig[j]!;
    }
  }
  return roundSignal(x, rules.signalRoundingDecimals);
}

/** Fixed saturation: y[j] = 1 - exp(-k * x[j]). Monotone in x for k > 0. */
export function applySaturation(
  linear: ChannelVector,
  rules: SpectrumRuleSet = SPECTRUM_RULES,
): number[] {
  const k = rules.saturationK;
  return roundSignal(
    linear.map((xj) => 1 - Math.exp(-k * xj)),
    rules.signalRoundingDecimals,
  );
}

/** Seeded uniform symmetric noise, then clamp to [0,1] and round. */
export function applyNoise(
  signal: ChannelVector,
  seed: string,
  rules: SpectrumRuleSet = SPECTRUM_RULES,
): number[] {
  if (rules.noise.kind !== 'uniformSymmetric') {
    throw new Error(`Unsupported noise kind: ${rules.noise.kind}`);
  }
  const rng = createRng(`spectrum-noise:${rules.ruleVersion}:${seed}`);
  const amp = rules.noise.amplitude;
  return roundSignal(
    signal.map((v) => clamp01(v + (rng() * 2 - 1) * amp)),
    rules.signalRoundingDecimals,
  );
}

export type ComputedSignals = {
  linear: number[];
  saturated: number[] | null;
  observed: number[];
};

/**
 * Build the observed signal for a difficulty mixing model.
 * Noise uses the puzzle seed so same seed/rule/content ⇒ identical noise.
 */
export function computeSignals(
  mixture: CanonicalMixture,
  signatures: SignatureLookup,
  model: MixingModel,
  seed: string,
  rules: SpectrumRuleSet = SPECTRUM_RULES,
): ComputedSignals {
  const linear = linearMix(mixture, signatures, rules);
  if (model === 'linear') {
    return { linear, saturated: null, observed: [...linear] };
  }
  const saturated = applySaturation(linear, rules);
  if (model === 'saturated') {
    return { linear, saturated, observed: [...saturated] };
  }
  // saturatedNoisy
  const observed = applyNoise(saturated, seed, rules);
  return { linear, saturated, observed };
}

/** Expose RNG factory for tests that need to inspect noise stream. */
export function noiseRng(seed: string, rules: SpectrumRuleSet = SPECTRUM_RULES): Rng {
  return createRng(`spectrum-noise:${rules.ruleVersion}:${seed}`);
}
