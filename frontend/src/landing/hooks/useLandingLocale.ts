import { useContext } from 'react';
import { LandingLocaleContext } from '../i18n/landingContext.ts';

export function useLandingLocale() {
  const context = useContext(LandingLocaleContext);
  if (!context) {
    throw new Error('useLandingLocale must be used within LandingLocaleProvider');
  }
  return context;
}
