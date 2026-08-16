import { ar } from './locales/ar.ts';
import { en } from './locales/en.ts';
import type { Locale, TranslateParams } from './types.ts';

const catalogs: Record<Locale, Record<string, unknown>> = {
  ar,
  en,
};

function resolvePath(catalog: Record<string, unknown>, key: string): unknown {
  return key.split('.').reduce<unknown>((current, part) => {
    if (typeof current !== 'object' || current === null) {
      return undefined;
    }

    return (current as Record<string, unknown>)[part];
  }, catalog);
}

function interpolate(template: string, params?: TranslateParams): string {
  if (!params) {
    return template;
  }

  return Object.entries(params).reduce(
    (result, [name, value]) => result.replaceAll(`:${name}`, String(value)),
    template,
  );
}

export function translate(locale: Locale, key: string, params?: TranslateParams): string {
  const value = resolvePath(catalogs[locale], key);

  if (typeof value !== 'string') {
    return key;
  }

  return interpolate(value, params);
}
