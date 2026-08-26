import { test, expect } from '@playwright/test';
import { demoUsers } from './fixtures/credentials.ts';
import { loginAdminUi } from './helpers/ui-auth.ts';

test.describe('Admin shipping configuration', () => {
  test('admin can open shipping page with carrier tab', async ({ page }) => {
    await loginAdminUi(page, demoUsers.admin.phoneNational);
    await page.goto('/admin/shipping');
    await expect(page.locator('body')).toContainText(/shipping|شحن|carrier|ناقل/i);
  });
});
