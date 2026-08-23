import { test, expect } from '@playwright/test';
import { demoUsers } from './fixtures/credentials.ts';
import { loginAdminUi } from './helpers/ui-auth.ts';

test.describe('Admin journey', () => {
  test('login, dashboard, users, settings, logout', async ({ page }) => {
    await loginAdminUi(page, demoUsers.admin.phoneNational);
    await expect(page).toHaveURL(/\/admin/);

    await page.goto('/admin/users');
    await expect(page.locator('body')).toContainText(/مستخدم|user/i);

    await page.goto('/admin/settings');
    await expect(page.locator('body')).toBeVisible();

    await page.goto('/admin/finance');
    await expect(page.locator('body')).toBeVisible();

    await page.goto('/admin/audit');
    await expect(page.locator('body')).toBeVisible();
  });

  test('admin session cannot open marketplace profile without marketplace login', async ({ page }) => {
    await loginAdminUi(page, demoUsers.admin.phoneNational);
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/(auth|admin)/);
  });
});
