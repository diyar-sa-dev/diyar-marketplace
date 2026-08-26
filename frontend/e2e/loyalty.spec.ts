import { test, expect } from '@playwright/test';
import { demoUsers } from './fixtures/credentials.ts';
import { apiBaseUrl, applyRequestSessionToPage, loginMarketplaceApi } from './helpers/api.ts';

test.describe('Loyalty journey', () => {
  test('guest sees sign-in prompt on loyalty page', async ({ page }) => {
    await page.goto('/loyalty', { waitUntil: 'networkidle' });
    await expect(page.getByRole('link', { name: /sign in|تسجيل الدخول/i })).toBeVisible({
      timeout: 30_000,
    });
  });

  test('authenticated customer can load loyalty summary API and page', async ({ page, request }) => {
    await loginMarketplaceApi(request, demoUsers.customer.phoneNational);

    const summary = await request.get(`${apiBaseUrl()}/loyalty`, {
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
    expect(summary.ok()).toBeTruthy();
    const body = await summary.json();
    expect(body?.data?.loyalty).toMatchObject({
      balance: expect.any(Number),
      enabled: expect.any(Boolean),
    });

    await applyRequestSessionToPage(request, page);
    await page.goto('/loyalty', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/no rewards available|لا توجد مكافآت/i)).toBeVisible();
  });
});
