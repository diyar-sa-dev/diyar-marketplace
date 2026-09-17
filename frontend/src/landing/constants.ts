export const LANDING_ASSETS = {
  logo: '/logo_diyar.svg',
  hero: '/hero_1.webp',
} as const;

export function resolveLandingLocaleFromPath(_pathname: string): 'ar' | 'en' {
  return 'ar';
}
