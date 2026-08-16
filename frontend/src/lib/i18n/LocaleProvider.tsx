import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { LocaleContext, type LocaleContextValue } from './localeContext.ts';
import { translate } from './translate.ts';
import { applyDocumentLocale, readStoredLocale, writeStoredLocale } from './storage.ts';
import { localeDirection, type Locale, type TranslateFn, type TranslateParams } from './types.ts';

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
