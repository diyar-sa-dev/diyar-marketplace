import { createContext } from 'react';
import type { LandingLocale } from './types.ts';
import type { LandingMessages } from './types.ts';

export type LandingLocaleContextValue = {
  locale: LandingLocale;
  dir: 'rtl' | 'ltr';
  messages: LandingMessages;
  setLocale: (locale: LandingLocale) => void;
};

export const LandingLocaleContext = createContext<LandingLocaleContextValue | null>(null);
