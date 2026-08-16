import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { translate } from './translate.ts';
import { applyDocumentLocale, readStoredLocale, writeStoredLocale } from './storage.ts';
import {
  DEFAULT_LOCALE,
  localeDirection,
  type FieldDirection,
  type Locale,
  type TranslateFn,
  type TranslateParams,
} from './types.ts';

type LocaleContextValue = {
  locale: Locale;
  dir: FieldDirection;
  setLocale: (locale: Locale) => void;
  t: TranslateFn;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => readStoredLocale());

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    writeStoredLocale(next);
    applyDocumentLocale(next);
  }, []);

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

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocaleContext(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocaleContext must be used within LocaleProvider');
  }

  return context;
}

export function useLocale(): LocaleContextValue {
  return useLocaleContext();
}

export function useAuthFieldDirection(): FieldDirection {
  return useLocale().dir;
}

/** @deprecated Use useAuthFieldDirection() instead. */
export const AUTH_FIELD_DIRECTION: FieldDirection = localeDirection(DEFAULT_LOCALE);
