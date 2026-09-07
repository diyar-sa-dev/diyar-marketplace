import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getLandingCatalog } from './i18n/catalogs/index.ts';
import { LandingLocaleContext } from './i18n/landingContext.ts';
import {
  DEFAULT_LANDING_LOCALE,
  isLandingLocale,
  landingLocaleDirection,
  LANDING_LOCALE_STORAGE_KEY,
  type LandingLocale,
} from './i18n/types.ts';
import { ensureLandingFonts } from './landingFonts.ts';

function readStoredLandingLocale(): LandingLocale {
  if (typeof window === 'undefined') {
    return DEFAULT_LANDING_LOCALE;
  }

  const stored = window.localStorage.getItem(LANDING_LOCALE_STORAGE_KEY);
  return stored && isLandingLocale(stored) ? stored : DEFAULT_LANDING_LOCALE;
}

function applyLandingDocumentLocale(locale: LandingLocale): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.lang = locale;
  document.documentElement.dir = landingLocaleDirection(locale);
}

export function LandingLocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale?: LandingLocale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<LandingLocale>(() => initialLocale ?? readStoredLandingLocale());

  useEffect(() => {
    applyLandingDocumentLocale(locale);
    void ensureLandingFonts(locale);
  }, [locale]);

  const setLocale = useCallback((next: LandingLocale) => {
    setLocaleState(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LANDING_LOCALE_STORAGE_KEY, next);
    }
    applyLandingDocumentLocale(next);
    void ensureLandingFonts(next);
  }, []);

  const value = useMemo(
    () => ({
      locale,
      dir: landingLocaleDirection(locale),
      messages: getLandingCatalog(locale),
      setLocale,
    }),
    [locale, setLocale],
  );

  return <LandingLocaleContext.Provider value={value}>{children}</LandingLocaleContext.Provider>;
}

export function resolveLandingLocaleFromParam(param?: string): LandingLocale | null {
  if (!param) {
    return null;
  }
  return isLandingLocale(param) ? param : null;
}
