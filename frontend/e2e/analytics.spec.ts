import { test, expect } from '@playwright/test';
import { demoUsers } from './fixtures/credentials.ts';
import { loginAdminUi, loginMarketplaceUi } from './helpers/ui-auth.ts';

test.describe('Analytics journeys', () => {
  test('vendor analytics page loads with KPI cards', async ({ page }) => {
    await loginMarketplaceUi(page, demoUsers.vendor.phoneNational);
    await page.goto('/dashboard/vendor/analytics');

    await expect(page.getByRole('heading', { name: /analytics|تحليلات/i })).toBeVisible();
    await expect(page.getByText(/net sales|صافي المبيعات/i)).toBeVisible();
    await expect(page.getByText(/sales over time|المبيعات عبر الزمن/i)).toBeVisible();
  });

  test('vendor analytics period selector updates query', async ({ page }) => {
    await loginMarketplaceUi(page, demoUsers.vendor.phoneNational);
    await page.goto('/dashboard/vendor/analytics');

    const periodSelect = page.locator('select').first();
    await periodSelect.selectOption('7d');
    await expect(periodSelect).toHaveValue('7d');
  });

  test('provider analytics page loads with KPI cards', async ({ page }) => {
    await loginMarketplaceUi(page, demoUsers.provider.phoneNational);
    await page.goto('/dashboard/service/analytics');

    await expect(page.getByRole('heading', { name: /service analytics|تحليلات الخدمات/i })).toBeVisible();
    await expect(page.getByText(/revenue|الإيرادات/i).first()).toBeVisible();
    await expect(page.getByText(/revenue over time|الإيرادات عبر الزمن/i)).toBeVisible();
  });

  test('admin analytics hub loads all sections', async ({ page }) => {
    await loginAdminUi(page, demoUsers.admin.phoneNational);
    await page.goto('/admin/analytics');

    await expect(page.getByRole('heading', { name: /^analytics$|^التحليلات$/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /conversion funnel|قمع التحويل/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /customer cohorts|شرائح العملاء/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /search analytics|تحليلات البحث/i })).toBeVisible();
    await expect(page.locator('select')).toHaveCount(3);
  });

  test('legacy admin analytics routes redirect to hub sections', async ({ page }) => {
    await loginAdminUi(page, demoUsers.admin.phoneNational);
    await page.goto('/admin/analytics/funnel');
    await expect(page).toHaveURL(/\/admin\/analytics#funnel$/);
    await expect(page.getByRole('heading', { name: /conversion funnel|قمع التحويل/i })).toBeVisible();
  });
});
