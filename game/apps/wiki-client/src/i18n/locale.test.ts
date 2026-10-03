import { afterEach, describe, expect, it, vi } from 'vitest';
import { LOCALE_STORAGE_KEY, readStoredLocale, storeLocale } from './locale';

afterEach(() => vi.unstubAllGlobals());

describe('wiki language preference', () => {
  it.each([null, '', 'unsupported'])('starts in English without a valid saved choice (%s)', (value) => {
    vi.stubGlobal('localStorage', { getItem: () => value });
    expect(readStoredLocale()).toBe('en');
  });

  it.each(['en', 'zh-Hant'] as const)('preserves an explicit %s preference', (locale) => {
    const getItem = vi.fn(() => locale);
    vi.stubGlobal('localStorage', { getItem });
    expect(readStoredLocale()).toBe(locale);
    expect(getItem).toHaveBeenCalledWith(LOCALE_STORAGE_KEY);
  });

  it('still opens in English when storage is unavailable', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('Storage disabled'); } });
    expect(readStoredLocale()).toBe('en');
  });

  it('saves an explicit language switch', () => {
    const setItem = vi.fn();
    vi.stubGlobal('localStorage', { setItem });
    storeLocale('zh-Hant');
    expect(setItem).toHaveBeenCalledWith(LOCALE_STORAGE_KEY, 'zh-Hant');
  });
});
