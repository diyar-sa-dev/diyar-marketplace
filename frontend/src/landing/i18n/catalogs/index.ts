import type { LandingLocale, LandingMessages } from '../types.ts';
import { landingAr } from './ar.ts';
import { landingEn } from './en.ts';

export const landingCatalogs: Record<LandingLocale, LandingMessages> = {
  ar: landingAr,
  en: landingEn,
};

export function getLandingCatalog(locale: LandingLocale): LandingMessages {
  return landingCatalogs[locale];
}
