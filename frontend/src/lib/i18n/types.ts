export type Locale = 'ar' | 'en';

export type FieldDirection = 'rtl' | 'ltr';

export type TranslateParams = Record<string, string | number>;

export type TranslateFn = (key: string, params?: TranslateParams) => string;

export const SUPPORTED_LOCALES: Locale[] = ['ar', 'en'];

export const DEFAULT_LOCALE: Locale = 'ar';

export const LOCALE_STORAGE_KEY = 'diyar-locale';

export function localeDirection(locale: Locale): FieldDirection {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export function isLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}
