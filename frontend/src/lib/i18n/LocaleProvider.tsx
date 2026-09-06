import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { LocaleContext, type LocaleContextValue } from './localeContext.ts';
import { ensureLocaleCatalog, isLocaleCatalogLoaded } from './localeCatalog.ts';
import { ensureLocaleFonts } from './localeFonts.ts';
import { HomeRouteFallback } from '../../marketplace/LazyRoute.tsx';
import { translate } from './translate.ts';
import { applyDocumentLocale, readStoredLocale, writeStoredLocale } from './storage.ts';
import { localeDirection, type Locale, type TranslateFn, type TranslateParams } from './types.ts';

function LocaleBootstrapFallback() {
  return <HomeRouteFallback />;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const initialLocale = readStoredLocale();
  const [locale, setLocaleState] = useState<Locale>(() => initialLocale);
  const [bootstrappedLocale, setBootstrappedLocale] = useState<Locale | null>(() =>
    isLocaleCatalogLoaded(initialLocale) ? initialLocale : null,
  );

  useEffect(() => {
    if (isLocaleCatalogLoaded(locale)) {
      return;
    }

    let cancelled = false;

    void Promise.all([ensureLocaleCatalog(locale), ensureLocaleFonts(locale)]).then(() => {
      if (!cancelled) {
        setBootstrappedLocale(locale);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [locale]);

  const catalogReady = isLocaleCatalogLoaded(locale) || bootstrappedLocale === locale;

  const setLocale = useCallback(
    (next: Locale) => {
      if (next === locale) {
        return;
      }

      void Promise.all([ensureLocaleCatalog(next), ensureLocaleFonts(next)]).then(() => {
        setLocaleState(next);
        writeStoredLocale(next);
        applyDocumentLocale(next);
      });
    },
    [locale],
  );

  useEffect(() => {
    applyDocumentLocale(locale);
  }, [locale]);

  const t = useCallback<TranslateFn>(
    (key: string, params?: TranslateParams) => translate(locale, key, params),
    [locale],
  );

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      dir: localeDirection(locale),
      setLocale,
      t,
    }),
    [locale, setLocale, t],
  );

  if (!catalogReady) {
    return <LocaleBootstrapFallback />;
  }

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
