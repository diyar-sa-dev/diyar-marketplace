import { test, expect } from '@playwright/test';
import { demoUsers } from './fixtures/credentials.ts';
import { apiBaseUrl, loginAdminApi, loginMarketplaceApi } from './helpers/api.ts';
import {
  expectAdminLoggedIn,
  expectAdminLoggedOut,
  expectMarketplaceLoggedIn,
  expectMarketplaceLoggedOut,
  loginAdminUi,
  loginMarketplaceUi,
  logoutAdminUi,
  logoutMarketplaceUi,
} from './helpers/ui-auth.ts';

test.describe('Auth isolation — dual sessions (UI)', () => {
  test('marketplace logout preserves admin', async ({ browser }) => {
    const marketplaceContext = await browser.newContext();
    const adminContext = await browser.newContext();
    const marketplacePage = await marketplaceContext.newPage();
    const adminPage = await adminContext.newPage();

    await loginMarketplaceUi(marketplacePage, demoUsers.customer.phoneNational);
    await loginAdminUi(adminPage, demoUsers.admin.phoneNational);

    await expectMarketplaceLoggedIn(marketplacePage);
    await expectAdminLoggedIn(adminPage);

    await logoutMarketplaceUi(marketplacePage);

    await expectMarketplaceLoggedOut(marketplacePage);
    await expectAdminLoggedIn(adminPage);

    await marketplaceContext.close();
    await adminContext.close();
  });

  test('admin logout preserves marketplace', async ({ browser }) => {
    const marketplaceContext = await browser.newContext();
    const adminContext = await browser.newContext();
    const marketplacePage = await marketplaceContext.newPage();
    const adminPage = await adminContext.newPage();

    await loginMarketplaceUi(marketplacePage, demoUsers.customer.phoneNational);
    await loginAdminUi(adminPage, demoUsers.admin.phoneNational);

    await expectMarketplaceLoggedIn(marketplacePage);
    await expectAdminLoggedIn(adminPage);

    await logoutAdminUi(adminPage);

    await expectAdminLoggedOut(adminPage);
    await expectMarketplaceLoggedIn(marketplacePage);

    await marketplaceContext.close();
    await adminContext.close();
  });
});

test.describe('Auth isolation — API (direct)', () => {
  test('admin-only account cannot access marketplace me without marketplace session', async ({
    request,
  }) => {
    await loginAdminApi(request, demoUsers.admin.phoneNational);
    const response = await request.get(`${apiBaseUrl()}/auth/me`, {
      headers: { Accept: 'application/json' },
    });
    expect([401, 403]).toContain(response.status());
  });

  test('marketplace customer cannot access admin session', async ({ request }) => {
    await loginMarketplaceApi(request, demoUsers.customer.phoneNational);
    const response = await request.get(`${apiBaseUrl()}/admin/session`, {
      headers: { Accept: 'application/json' },
    });
    expect([401, 403]).toContain(response.status());
  });
});

test.describe('Auth isolation — browser UI', () => {
  test('marketplace and admin UI sessions stay isolated across tabs', async ({ browser }) => {
    const marketplacePage = await browser.newPage();
    const adminPage = await browser.newPage();

    await loginMarketplaceUi(marketplacePage, demoUsers.customer.phoneNational);
    await loginAdminUi(adminPage, demoUsers.admin.phoneNational);

    await marketplacePage.goto('/profile');
    await expect(marketplacePage).not.toHaveURL(/\/admin/);

    await adminPage.goto('/admin');
    await expect(adminPage).toHaveURL(/\/admin/);
    await expect(adminPage).not.toHaveURL(/\/admin\/login/);

    await marketplacePage.close();
    await adminPage.close();
  });

  test('refresh preserves marketplace identity', async ({ page }) => {
    await loginMarketplaceUi(page, demoUsers.customer.phoneNational);
    await page.goto('/profile');
    await page.reload();
    await expect(page).not.toHaveURL(/\/auth/);
    await expect(page).not.toHaveURL(/\/admin\/login/);
  });
});
