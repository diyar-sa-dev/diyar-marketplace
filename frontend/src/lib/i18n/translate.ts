import { getLocaleCatalog } from './localeCatalog.ts';
import type { Locale, TranslateParams } from './types.ts';

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

  const entries = Object.entries(params).sort(([a], [b]) => b.length - a.length);

  return entries.reduce((result, [name, value]) => {
    const stringValue = String(value);
    return result.replaceAll(`:${name}`, stringValue).replaceAll(`{{${name}}}`, stringValue);
  }, template);
}

export function translate(locale: Locale, key: string, params?: TranslateParams): string {
  const catalog = getLocaleCatalog(locale);
  if (!catalog) {
    return key;
  }

  const value = resolvePath(catalog, key);

  if (typeof value !== 'string') {
    return key;
  }

  return interpolate(value, params);
}
