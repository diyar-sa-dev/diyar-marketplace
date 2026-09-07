import { useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { getLandingCatalog } from './i18n/catalogs/index.ts';
import { LandingLocaleContext } from './i18n/landingContext.ts';
import {
  isLandingLocale,
  landingLocaleDirection,
  LANDING_LOCALE_STORAGE_KEY,
  type LandingLocale,
} from './i18n/types.ts';
import { resolveLandingLocaleFromPath } from './constants.ts';
import { ensureLandingFonts } from './landingFonts.ts';

function applyLandingDocumentLocale(locale: LandingLocale): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.lang = locale;
  document.documentElement.dir = landingLocaleDirection(locale);
}

export function LandingLocaleProvider({ children }: { initialLocale?: LandingLocale; children: ReactNode }) {
  const location = useLocation();
  const locale = resolveLandingLocaleFromPath(location.pathname);

  useEffect(() => {
    applyLandingDocumentLocale(locale);
    window.localStorage.setItem(LANDING_LOCALE_STORAGE_KEY, locale);
    void ensureLandingFonts(locale);
  }, [locale]);

  const setLocale = useCallback((next: LandingLocale) => {
    applyLandingDocumentLocale(next);
    window.localStorage.setItem(LANDING_LOCALE_STORAGE_KEY, next);
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
