import { translate } from './translate.ts';
import { readStoredLocale } from './storage.ts';
import { statusPageFallback } from './statusPageFallbacks.ts';
import { localeDirection, type Locale, type TranslateParams } from './types.ts';

export function getStaticLocale() {
  const locale: Locale = readStoredLocale();
  const dir = localeDirection(locale);

  const t = (key: string, params?: TranslateParams) => {
    const translated = translate(locale, key, params);
    if (translated !== key) {
      return translated;
    }

    return statusPageFallback(locale, key, params) ?? key;
  };

  return { locale, dir, t };
}
