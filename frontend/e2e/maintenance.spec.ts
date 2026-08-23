import { test, expect } from '@playwright/test';
import { demoUsers } from './fixtures/credentials.ts';
import { loginAdminUi } from './helpers/ui-auth.ts';

test.describe('Maintenance mode', () => {
  test('admin settings page is reachable and exposes maintenance controls', async ({ page }) => {
    await loginAdminUi(page, demoUsers.admin.phoneNational);
    await page.goto('/admin/settings');
    await expect(page.locator('body')).toContainText(/صيانة|maintenance|platform/i, {
      timeout: 30_000,
    });
  });

  test('health endpoint exposes maintenance status', async ({ request }) => {
    const response = await request.get('/api/v1/health');
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.data).toHaveProperty('maintenance');
    expect(body.data.maintenance).toHaveProperty('marketplace_enabled');
  });
});
