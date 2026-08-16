import { createContext, useContext } from 'react';
import {
  DEFAULT_LOCALE,
  localeDirection,
  type FieldDirection,
  type Locale,
  type TranslateFn,
} from './types.ts';

export type LocaleContextValue = {
  locale: Locale;
  dir: FieldDirection;
  setLocale: (locale: Locale) => void;
  t: TranslateFn;
};

export const LocaleContext = createContext<LocaleContextValue | null>(null);

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
