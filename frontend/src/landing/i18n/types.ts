export type LandingLocale = 'ar' | 'en' | 'fr';

export const LANDING_LOCALES: LandingLocale[] = ['ar', 'en', 'fr'];

export const DEFAULT_LANDING_LOCALE: LandingLocale = 'ar';

export const LANDING_LOCALE_STORAGE_KEY = 'diyar-landing-locale';

export function isLandingLocale(value: string): value is LandingLocale {
  return LANDING_LOCALES.includes(value as LandingLocale);
}

export function landingLocaleDirection(locale: LandingLocale): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

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
    coming: string;
    contact: string;
    menu: string;
    close: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    status: string;
    primaryCta: string;
    secondaryCta: string;
    imageAlt: string;
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
    items: string[];
  };
  providers: {
    title: string;
    subtitle: string;
    items: string[];
  };
  ecosystem: {
    title: string;
    subtitle: string;
    hub: string;
    customers: string;
    providers: string;
    services: string;
    bookings: string;
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
    fr: string;
  };
};
