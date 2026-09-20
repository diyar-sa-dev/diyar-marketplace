import type { Page } from '@playwright/test';

/** Matches SPA locale persistence (`diyar-locale` in localStorage). */
export async function setMarketplaceLocale(page: Page, locale: 'ar' | 'en'): Promise<void> {
  await page.addInitScript((loc) => {
    window.localStorage.setItem('diyar-locale', loc);
  }, locale);
}
