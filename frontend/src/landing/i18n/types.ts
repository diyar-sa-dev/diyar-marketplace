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

export type LandingEcosystemCard = {
  title: string;
  description: string;
};

export type LandingValueItem = {
  title: string;
  description: string;
};

export type LandingMessages = {
  meta: {
    title: string;
    description: string;
    ogLocale: string;
  };
  nav: {
    about: string;
    how: string;
    customers: string;
    providers: string;
    ecosystem: string;
    contact: string;
    menu: string;
    close: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    imageAlt: string;
    accentAlt: string;
  };
  intro: {
    title: string;
    body: string;
  };
  how: {
    title: string;
    customersTitle: string;
    providersTitle: string;
    customerSteps: string[];
    providerSteps: string[];
  };
  customers: {
    title: string;
    subtitle: string;
    items: LandingValueItem[];
  };
  providers: {
    title: string;
    subtitle: string;
    items: LandingValueItem[];
  };
  ecosystem: {
    badge: string;
    titleLine1: string;
    titleHighlight: string;
    body: string;
    cards: LandingEcosystemCard[];
  };
  trust: {
    title: string;
    items: string[];
  };
  coming: {
    title: string;
    body: string;
    note: string;
  };
  cta: {
    title: string;
    body: string;
    email: string;
    phone: string;
  };
  footer: {
    tagline: string;
    contact: string;
    rights: string;
  };
  language: {
    label: string;
    ar: string;
    en: string;
  };
};
