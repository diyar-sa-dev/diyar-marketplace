import type { Locale } from './types.ts';

let arFontsLoaded = false;
let enFontsLoaded = false;

/** Load locale UI fonts after first paint — never block initial render. */
export async function ensureLocaleFonts(locale: Locale): Promise<void> {
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

  if (locale === 'en' && !enFontsLoaded) {
    await Promise.all([
      import('@fontsource/outfit/400.css'),
      import('@fontsource/outfit/700.css'),
      import('@fontsource/inter/400.css'),
      import('@fontsource/inter/600.css'),
    ]);
    enFontsLoaded = true;
  }
}
