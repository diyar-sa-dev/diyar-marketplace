import { test, expect } from '@playwright/test';
import { demoUsers } from './fixtures/credentials.ts';
import { loginAdminUi } from './helpers/ui-auth.ts';
import { ensureDraftB2bCompanyHidden } from './helpers/b2b-reset.ts';

test.describe('Admin shipping configuration', () => {
  test('admin can open shipping page with carrier tab', async ({ page }) => {
    await loginAdminUi(page, demoUsers.admin.phoneNational);
    await page.goto('/admin/shipping', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/shipping$/);
    await expect(page.locator('body')).toContainText(/carriers|الناقل|shipping|شحن/i);
  });
});
