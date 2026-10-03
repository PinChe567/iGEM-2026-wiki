import type { SpectrumRuleSet } from './types';
import { SPECTRUM_CHANNEL_COUNT } from './types';

export const SPECTRUM_GAME_VERSION = '1.2.0' as const;
export const SPECTRUM_RULE_VERSION = '2.1.0' as const;

/**
 * Authoritative rule knobs for Scent Spectrum.
 * Change only with a ruleVersion bump; never scatter equivalents in UI.
 */
export const SPECTRUM_RULES: SpectrumRuleSet = {
  ruleVersion: SPECTRUM_RULE_VERSION,
  channelCount: SPECTRUM_CHANNEL_COUNT,
  saturationK: 1.8,
  noise: {
    kind: 'uniformSymmetric',
    amplitude: 0.03,
  },
  signalRoundingDecimals: 6,
  weightNormalization: 'percentOver100',
  fitMetric: {
    kind: 'normalizedRmse',
    rmseScale: 1,
  },
};

export function getSpectrumVersions(): {
  gameVersion: typeof SPECTRUM_GAME_VERSION;
  ruleVersion: typeof SPECTRUM_RULE_VERSION;
} {
  return {
    gameVersion: SPECTRUM_GAME_VERSION,
    ruleVersion: SPECTRUM_RULE_VERSION,
  };
}
