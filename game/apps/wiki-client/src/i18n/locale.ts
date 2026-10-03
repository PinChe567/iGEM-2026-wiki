export type Locale = 'zh-Hant' | 'en';

export const LOCALES: Locale[] = ['zh-Hant', 'en'];
export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_STORAGE_KEY = 'suite.locale';

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'zh-Hant' || value === 'en';
}

export function readStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE;
}

export function storeLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
}
