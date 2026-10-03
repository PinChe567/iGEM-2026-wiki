import { describe, expect, it } from 'vitest';
import {
  SPECTRUM_CONTENT_VERSION,
  SPECTRUM_CHANNEL_COUNT,
  SPECTRUM_ODORS,
  SPECTRUM_ODOR_IDS,
  spectrumContentCatalog,
  spectrumPool,
  signatureMap,
} from './index';

describe('spectrum content', () => {
  it('ships 16 illustrativeGenerated 12-channel signatures', () => {
    expect(spectrumContentCatalog.contentVersion).toBe(SPECTRUM_CONTENT_VERSION);
    expect(spectrumContentCatalog.channelCount).toBe(SPECTRUM_CHANNEL_COUNT);
    expect(SPECTRUM_ODORS).toHaveLength(16);
    expect(SPECTRUM_ODOR_IDS).toHaveLength(16);
    for (const odor of SPECTRUM_ODORS) {
      expect(odor.source).toBe('illustrativeGenerated');
      expect(odor.signature).toHaveLength(12);
      expect(odor.signatureVersion).toBe(SPECTRUM_CONTENT_VERSION);
      for (const v of odor.signature) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });

  it('disclaimer rejects experimental provenance claims', () => {
    expect(spectrumContentCatalog.modelDisclaimer.en).toMatch(/illustrativeGenerated/i);
    expect(spectrumContentCatalog.modelDisclaimer.en).toMatch(/not AeroSense/i);
    expect(spectrumContentCatalog.modelDisclaimer['zh-Hant']).toMatch(/illustrativeGenerated/);
  });

  it('exposes stable difficulty pools', () => {
    expect(spectrumPool(8)).toHaveLength(8);
    expect(spectrumPool(12)).toHaveLength(12);
    expect(spectrumPool(16)).toHaveLength(16);
    expect(signatureMap().size).toBe(16);
  });
});
