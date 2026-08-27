import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { demoUsers } from './fixtures/credentials.ts';
import { loginMarketplaceUi, loginAdminUi } from './helpers/ui-auth.ts';
import { apiBaseUrl, sessionRequestHeaders } from './helpers/api.ts';

const fixtureDir = path.dirname(fileURLToPath(import.meta.url));
const validImage = path.join(fixtureDir, '..', 'public', 'after.png');

test.describe('Upload integration smoke (KI-028-046)', () => {
  test('vendor can upload store logo via settings UI', async ({ page }) => {
    await loginMarketplaceUi(page, demoUsers.vendor.phoneNational);
    await page.goto('/dashboard/vendor/settings', { waitUntil: 'domcontentloaded' });

    const logoInput = page.locator('input[type="file"]').first();
    await expect(logoInput).toBeAttached({ timeout: 30_000 });

    await logoInput.setInputFiles(validImage);

    await expect
      .poll(
        async () => {
          const res = await page.request.get(`${apiBaseUrl()}/dashboard/vendor/settings`, {
            headers: await sessionRequestHeaders(page.request),
          });
          if (!res.ok()) return false;
          const body = await res.json();
          return Boolean(body?.data?.settings?.logo_url);
        },
        { timeout: 60_000 },
      )
      .toBe(true);
  });

  test('admin blog CMS page loads for authenticated admin', async ({ page }) => {
    await loginAdminUi(page, demoUsers.admin.phoneNational);
    await page.goto('/admin/blog/articles', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
  });
});
