import type { Locale } from './types.ts';

let enFontsLoaded = false;

/** Load Latin UI fonts only when English is active (Arabic fonts are in the main bundle). */
export async function ensureLocaleFonts(locale: Locale): Promise<void> {
  if (locale !== 'en' || enFontsLoaded) {
    return;
  }

  await Promise.all([
    import('@fontsource/outfit/400.css'),
    import('@fontsource/outfit/700.css'),
    import('@fontsource/inter/400.css'),
    import('@fontsource/inter/600.css'),
  ]);

  enFontsLoaded = true;
}
