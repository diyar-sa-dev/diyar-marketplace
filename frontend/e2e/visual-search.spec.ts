import { expect, test } from '@playwright/test';

test.describe('Visual Search', () => {
  test('EN — open modal and show upload control', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/search');
    await page.getByRole('button', { name: /البحث بالصورة|Image search/i }).click();
    await expect(page.getByText(/ارفع صورة|Upload|JPEG|WebP|2 MB/i).first()).toBeVisible();
  });

  test('AR RTL — modal renders in Arabic locale', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/search');
    await page.getByRole('button', { name: /البحث بالصورة/i }).click();
    await expect(page.locator('html[dir="rtl"]').first()).toBeVisible();
    await expect(page.getByText(/ارفع صورة|JPEG|WebP/i).first()).toBeVisible();
  });

  test('mobile viewport — visual search entry visible', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/search');
    await expect(page.getByRole('button', { name: /البحث بالصورة/i })).toBeVisible();
  });
});
