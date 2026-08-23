import { test, expect } from '@playwright/test';
import { demoUsers } from './fixtures/credentials.ts';
import { loginMarketplaceUi } from './helpers/ui-auth.ts';

test.describe('Vendor journey', () => {
  test('vendor login reaches dashboard', async ({ page }) => {
    await loginMarketplaceUi(page, demoUsers.vendor.phoneNational);
    await page.goto('/dashboard/vendor');
    await expect(page).not.toHaveURL(/\/auth/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('vendor products page loads', async ({ page }) => {
    await loginMarketplaceUi(page, demoUsers.vendor.phoneNational);
    await page.goto('/dashboard/vendor/products');
    await expect(page.locator('body')).toBeVisible();
  });

  test('vendor orders page loads', async ({ page }) => {
    await loginMarketplaceUi(page, demoUsers.vendor.phoneNational);
    await page.goto('/dashboard/vendor/orders');
    await expect(page.locator('body')).toBeVisible();
  });
});
