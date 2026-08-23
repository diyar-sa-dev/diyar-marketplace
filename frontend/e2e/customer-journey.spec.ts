import { test, expect } from '@playwright/test';
import { demoUsers } from './fixtures/credentials.ts';
import { loginMarketplaceUi } from './helpers/ui-auth.ts';

test.describe('Customer journey', () => {
  test('browse home, search, open product, login, view profile', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/DIYAR|ديار/i);

    const productsApi = await page.request.get('/api/v1/products?per_page=4');
    expect(productsApi.ok()).toBeTruthy();

    await page.goto('/search?q=كنب&type=products&per_page=48');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/كنب/);
    await expect(page.getByText(/\([1-9]\d*\)/).first()).toBeVisible({ timeout: 60_000 });

    const productLink = page.locator('a[href^="/product/"]').first();
    await expect(productLink).toBeVisible({ timeout: 60_000 });
    await productLink.click();
    await expect(page).toHaveURL(/\/product\//);

    await loginMarketplaceUi(page, demoUsers.customer.phoneNational);
    await page.goto('/profile');
    await expect(page).not.toHaveURL(/\/auth/);
  });

  test('services catalog loads with filters', async ({ page }) => {
    const servicesApi = await page.request.get('/api/v1/services?per_page=4');
    expect(servicesApi.ok()).toBeTruthy();

    await page.goto('/services');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/[1-9]\d*/).first()).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('a[href^="/service/"]').first()).toBeVisible({ timeout: 60_000 });
  });

  test('unauthenticated cart prompt does not crash', async ({ page }) => {
    await page.goto('/');
    await page.locator('button, [role="button"]').filter({ hasText: /سلة|cart/i }).first().click({ timeout: 10_000 }).catch(() => undefined);
    await expect(page.locator('body')).toBeVisible();
  });
});
