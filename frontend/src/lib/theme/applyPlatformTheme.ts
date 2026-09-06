import type { PlatformThemeTokens } from '../../api/platformTheme.ts';
import { ensureThemeFontsLoaded } from './ensureThemeFonts.ts';

const DEFAULTS: Required<PlatformThemeTokens> = {
  primary_color: '#947961',
  primary_dark: '#1f3d3a',
  surface_color: '#f3ecdb',
  font_family_ar: 'Alexandria, Tajawal, sans-serif',
  font_family_en: 'Outfit, Inter, sans-serif',
  vendor_accent_color: '#947961',
  provider_accent_color: '#2563eb',
  affiliate_accent_color: '#16a34a',
};

export function applyPlatformTheme(theme: PlatformThemeTokens, locale: string): void {
  const root = document.documentElement;
  const merged = { ...DEFAULTS, ...theme };

  root.style.setProperty('--diyar-theme-primary', merged.primary_color);
  root.style.setProperty('--diyar-theme-primary-dark', merged.primary_dark);
  root.style.setProperty('--diyar-theme-surface', merged.surface_color);
  root.style.setProperty('--diyar-portal-vendor', merged.vendor_accent_color);
  root.style.setProperty('--diyar-portal-provider', merged.provider_accent_color);
  root.style.setProperty('--diyar-portal-affiliate', merged.affiliate_accent_color);

  const fontStack = locale === 'ar' ? merged.font_family_ar : merged.font_family_en;
  root.style.setProperty('--diyar-theme-font', fontStack);
  document.body.style.fontFamily = fontStack;
  ensureThemeFontsLoaded(fontStack);
}

export function previewThemeFont(fullKey: string, fontStack: string, locale: string): void {
  const appliesNow =
    (fullKey === 'theme.font_family_ar' && locale === 'ar') ||
    (fullKey === 'theme.font_family_en' && locale !== 'ar');

  if (!appliesNow) {
    return;
  }

  document.documentElement.style.setProperty('--diyar-theme-font', fontStack);
  document.body.style.fontFamily = fontStack;
  ensureThemeFontsLoaded(fontStack);
}
