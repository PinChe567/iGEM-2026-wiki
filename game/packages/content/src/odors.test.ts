import { describe, expect, it } from 'vitest';
import { CONTENT_VERSION, contentCatalog, toLegacyOdors } from './index';

describe('content catalog', () => {
  it('has a version and 20 odors', () => {
    expect(contentCatalog.contentVersion).toBe(CONTENT_VERSION);
    expect(contentCatalog.odors).toHaveLength(20);
  });

  it('marks unknown media credits as TODO-VERIFY', () => {
    for (const odor of contentCatalog.odors) {
      expect(odor.creditStatus).toBe('TODO-VERIFY');
      expect(odor.sourceStatus).toBe('illustrative');
      expect(odor.modelKind).toBe('illustrative-virtual-receptor');
    }
  });

  it('maps to legacy Game 1 odor shape', () => {
    const legacy = toLegacyOdors();
    expect(legacy[0]).toEqual({
      id: 'banana',
      name: '\u9999\u8549',
      en: 'Banana',
      vector: [1, 0.1, 0.1, 0.45, 0.05],
    });
  });

  it('exposes model disclaimer', () => {
    expect(contentCatalog.modelDisclaimer.en).toMatch(/virtual-receptor/i);
    expect(contentCatalog.modelDisclaimer['zh-Hant'].length).toBeGreaterThan(10);
  });
});
