export type Locale = 'zh-Hant' | 'en';

export const LOCALES: Locale[] = ['zh-Hant', 'en'];
export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_STORAGE_KEY = 'suite.locale';
export const WIKI_LOCALE_STORAGE_KEY = 'aerosense-language';

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'zh-Hant' || value === 'en';
}

function normalizedLocale(value: string | null | undefined): Locale | null {
  if (value === 'zh-TW' || value === 'zh') return 'zh-Hant';
  return isLocale(value) ? value : null;
}

export function readStoredLocale(): Locale {
  try {
    const stored = normalizedLocale(localStorage.getItem(LOCALE_STORAGE_KEY));
    const wiki = normalizedLocale(localStorage.getItem(WIKI_LOCALE_STORAGE_KEY));
    const locale = wiki ?? stored ?? DEFAULT_LOCALE;
    storeLocale(locale);
    return locale;
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE;
}

export function storeLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    localStorage.setItem(WIKI_LOCALE_STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
}
