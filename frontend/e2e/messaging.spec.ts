import { test, expect } from '@playwright/test';
import { demoUsers } from './fixtures/credentials.ts';
import { loginAdminUi, loginMarketplaceUi } from './helpers/ui-auth.ts';

test.describe('Admin chat reports', () => {
  test('admin can open chat reports page', async ({ page }) => {
    await loginAdminUi(page, demoUsers.admin.phoneNational);
    await page.goto('/admin/chat');
    await expect(page.locator('body')).toContainText(/بلاغ|report/i);
  });
});

test.describe('Customer notifications', () => {
  test('customer can open notifications page', async ({ page }) => {
    await loginMarketplaceUi(page, demoUsers.customer.phoneNational);
    await page.goto('/notifications');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Customer chat', () => {
  test('customer can open chat page', async ({ page }) => {
    await loginMarketplaceUi(page, demoUsers.customer.phoneNational);
    await page.goto('/chat');
    await expect(page.locator('body')).toContainText(/محادث|message|chat/i);
  });
});
