import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'mobile-320', width: 320, height: 800 },
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'tablet-1024', width: 1024, height: 768 },
  { name: 'desktop-1280', width: 1280, height: 800 },
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1920', width: 1920, height: 1080 },
] as const;

const routes = ['/', '/search', '/services', '/blog'] as const;

for (const viewport of viewports) {
  test.describe(`Responsive smoke @ ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const route of routes) {
      test(`${route} renders without horizontal overflow`, async ({ page }) => {
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('body')).toBeVisible();

        const overflow = await page.evaluate(() => {
          const doc = document.documentElement;
          return doc.scrollWidth - doc.clientWidth;
        });

        expect(overflow).toBeLessThanOrEqual(2);
      });
    }
  });
}

test.describe('Responsive smoke — checkout shell', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('auth page form visible on mobile', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('#auth-phone, input[type="tel"]').first()).toBeVisible({
      timeout: 30_000,
    });
  });
});
