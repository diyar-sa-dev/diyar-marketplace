export type LandingLocale = 'ar' | 'en';

export const LANDING_LOCALES: LandingLocale[] = ['ar', 'en'];

export const DEFAULT_LANDING_LOCALE: LandingLocale = 'ar';

export const LANDING_LOCALE_STORAGE_KEY = 'diyar-landing-locale';

export function isLandingLocale(value: string): value is LandingLocale {
  return LANDING_LOCALES.includes(value as LandingLocale);
}

export function landingLocaleDirection(locale: LandingLocale): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

/** SEO-only catalog shape for landing mode. */
export type LandingMessages = {
  meta: {
    title: string;
    description: string;
    ogLocale: string;
  };
};
