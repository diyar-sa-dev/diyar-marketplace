import type { Locale } from './types.ts';

export type LocaleCatalog = Record<string, unknown>;

const loaders: Record<Locale, () => Promise<LocaleCatalog>> = {
  en: () => import('./locales/en.ts').then((module) => module.en),
  ar: () => import('./locales/ar.ts').then((module) => module.ar),
};

const cache = new Map<Locale, LocaleCatalog>();
const pending = new Map<Locale, Promise<LocaleCatalog>>();

export function getLocaleCatalog(locale: Locale): LocaleCatalog | undefined {
  return cache.get(locale);
}

export function isLocaleCatalogLoaded(locale: Locale): boolean {
  return cache.has(locale);
}

export async function ensureLocaleCatalog(locale: Locale): Promise<LocaleCatalog> {
  const cached = cache.get(locale);
  if (cached) {
    return cached;
  }

  const inFlight = pending.get(locale);
  if (inFlight) {
    return inFlight;
  }

  const loadPromise = loaders[locale]().then((catalog) => {
    cache.set(locale, catalog);
    pending.delete(locale);
    return catalog;
  });

  pending.set(locale, loadPromise);
  return loadPromise;
}

export async function preloadLocaleCatalogs(locales: readonly Locale[]): Promise<void> {
  await Promise.all(locales.map((locale) => ensureLocaleCatalog(locale)));
}
