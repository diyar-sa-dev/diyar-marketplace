import type { Page } from '@playwright/test';
import { E2E_PASSWORD } from '../fixtures/credentials.ts';
import { expect } from '@playwright/test';

export async function loginMarketplaceUi(
  page: Page,
  phoneNational: string,
  password = E2E_PASSWORD,
): Promise<void> {
  await page.goto('/auth');
  await page.locator('#login-phone').fill(phoneNational);
  await page.locator('input[type="password"]').first().fill(password);
  await Promise.all([
    page.waitForResponse(
      (response) => response.url().includes('/auth/login') && response.ok(),
      { timeout: 30_000 },
    ),
    page.locator('[data-testid="marketplace-login-submit"]').click(),
  ]);
  await page.waitForURL((url) => !url.pathname.startsWith('/auth'), { timeout: 30_000 });
}

export async function loginAdminUi(
  page: Page,
  phoneNational: string,
  password = E2E_PASSWORD,
): Promise<void> {
  await page.goto('/admin/login');
  await page.locator('#admin-login-phone').fill(phoneNational);
  await page.locator('#admin-login-password').fill(password);
  await Promise.all([
    page.waitForResponse(
      (response) => response.url().includes('/admin/auth/login') && response.ok(),
      { timeout: 30_000 },
    ),
    page.locator('[data-testid="admin-login-submit"]').click(),
  ]);
  await page.waitForURL(/\/admin(?!\/login)/, { timeout: 30_000 });
}

export async function expectMarketplaceLoggedIn(page: Page): Promise<void> {
  await page.goto('/profile');
  await expect(page).not.toHaveURL(/\/auth/);
}

export async function expectMarketplaceLoggedOut(page: Page): Promise<void> {
  await page.goto('/profile');
  await expect(page).toHaveURL(/\/auth/);
}

export async function expectAdminLoggedIn(page: Page): Promise<void> {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin(?!\/login)/);
}

export async function expectAdminLoggedOut(page: Page): Promise<void> {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin\/login/);
}

export async function logoutMarketplaceUi(page: Page): Promise<void> {
  await page.goto('/profile');
  await page.getByRole('button', { name: /تسجيل الخروج|logout/i }).click();
  await page.waitForURL(/\/auth/, { timeout: 30_000 });
}

export async function logoutAdminUi(page: Page): Promise<void> {
  await page.goto('/admin');
  await page.getByRole('button', { name: /تسجيل الخروج|logout/i }).click();
  await page.waitForURL(/\/admin\/login/, { timeout: 30_000 });
}
