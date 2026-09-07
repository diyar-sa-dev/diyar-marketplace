import type { LandingLocale, LandingMessages } from '../types.ts';
import { landingAr } from './ar.ts';
import { landingEn } from './en.ts';
import { landingFr } from './fr.ts';

export const landingCatalogs: Record<LandingLocale, LandingMessages> = {
  ar: landingAr,
  en: landingEn,
  fr: landingFr,
};

export function getLandingCatalog(locale: LandingLocale): LandingMessages {
  return landingCatalogs[locale];
}
