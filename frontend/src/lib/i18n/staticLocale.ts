import { translate } from './translate.ts';
import { readStoredLocale } from './storage.ts';
import { localeDirection, type Locale, type TranslateParams } from './types.ts';

export function getStaticLocale() {
  const locale: Locale = readStoredLocale();
  const dir = localeDirection(locale);

  const t = (key: string, params?: TranslateParams) => translate(locale, key, params);

  return { locale, dir, t };
}
