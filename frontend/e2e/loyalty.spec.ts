import { test, expect } from '@playwright/test';
import { demoUsers } from './fixtures/credentials.ts';
import { loginMarketplaceUi } from './helpers/ui-auth.ts';
import { apiBaseUrl } from './helpers/api.ts';

test.describe('Loyalty journey', () => {
  test('guest sees sign-in prompt on loyalty page', async ({ page }) => {
    await page.goto('/loyalty', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('link', { name: /sign in|تسجيل الدخول/i })).toBeVisible();
  });

  test('authenticated customer can load loyalty summary API and page', async ({ page, request }) => {
    await loginMarketplaceUi(page, demoUsers.customer.phoneNational);

    const summary = await request.get(`${apiBaseUrl()}/loyalty`, {
      headers: { cookie: (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ') },
    });
    expect(summary.ok()).toBeTruthy();
    const body = await summary.json();
    expect(body?.data?.loyalty).toMatchObject({
      balance: expect.any(Number),
      enabled: expect.any(Boolean),
    });

    await page.goto('/loyalty', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/no rewards available|لا توجد مكافآت/i)).toBeVisible();
  });
});
