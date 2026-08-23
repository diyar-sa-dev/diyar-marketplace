import { test, expect } from '@playwright/test';
import { demoUsers } from './fixtures/credentials.ts';
import { loginMarketplaceUi } from './helpers/ui-auth.ts';

test.describe('Provider journey', () => {
  test('provider login reaches service dashboard', async ({ page }) => {
    await loginMarketplaceUi(page, demoUsers.provider.phoneNational);
    await page.goto('/dashboard/service');
    await expect(page).not.toHaveURL(/\/auth/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('provider services management loads', async ({ page }) => {
    await loginMarketplaceUi(page, demoUsers.provider.phoneNational);
    await page.goto('/dashboard/service/services');
    await expect(page.locator('body')).toBeVisible();
  });

  test('public services page lists seeded services', async ({ page }) => {
    const servicesApi = await page.request.get('/api/v1/services?per_page=4');
    expect(servicesApi.ok()).toBeTruthy();

    await page.goto('/services');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('a[href^="/service/"]').first()).toBeVisible({ timeout: 60_000 });
  });
});
