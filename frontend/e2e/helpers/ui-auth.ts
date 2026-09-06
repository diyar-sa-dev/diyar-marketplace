import type { Page } from '@playwright/test';
import { E2E_PASSWORD } from '../fixtures/credentials.ts';
import { expect } from '@playwright/test';

async function submitAndAwaitLoginResponse(
  page: Page,
  submitSelector: string,
  loginPath: string,
): Promise<void> {
  const [loginResponse] = await Promise.all([
    page.waitForResponse((response) => response.url().includes(loginPath), { timeout: 30_000 }),
    page.locator(submitSelector).click(),
  ]);

  if (!loginResponse.ok()) {
    throw new Error(
      `Login failed (${loginResponse.status()}): ${await loginResponse.text().catch(() => '')}`,
    );
  }
}

export async function loginMarketplaceUi(
  page: Page,
  phoneNational: string,
  password = E2E_PASSWORD,
): Promise<void> {
  await page.goto('/auth');
  await page.locator('#login-phone').fill(phoneNational);
  await page.locator('input[type="password"]').first().fill(password);
  await submitAndAwaitLoginResponse(page, '[data-testid="marketplace-login-submit"]', '/auth/login');
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
  await submitAndAwaitLoginResponse(page, '[data-testid="admin-login-submit"]', '/admin/auth/login');
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
