import type { LandingLocale } from './i18n/types.ts';

let arFontsLoaded = false;
let latinFontsLoaded = false;

export async function ensureLandingFonts(locale: LandingLocale): Promise<void> {
  if (locale === 'ar' && !arFontsLoaded) {
    await Promise.all([
      import('@fontsource/alexandria/400.css'),
      import('@fontsource/alexandria/700.css'),
      import('@fontsource/tajawal/400.css'),
      import('@fontsource/tajawal/700.css'),
    ]);
    arFontsLoaded = true;
    return;
  }

  if ((locale === 'en' || locale === 'fr') && !latinFontsLoaded) {
    await Promise.all([
      import('@fontsource/outfit/400.css'),
      import('@fontsource/outfit/700.css'),
      import('@fontsource/inter/400.css'),
      import('@fontsource/inter/600.css'),
    ]);
    latinFontsLoaded = true;
  }
}
