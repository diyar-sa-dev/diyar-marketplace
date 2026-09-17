import { test, expect } from '@playwright/test';
import { demoUsers, E2E_PASSWORD } from './fixtures/credentials.ts';
import {
  apiBaseUrl,
  ensureCsrf,
  loginMarketplaceApi,
  sessionRequestHeaders,
} from './helpers/api.ts';
import { loginMarketplaceUi } from './helpers/ui-auth.ts';

test.describe('Security sessions — browser E2E', () => {
  test('two contexts: remote device revoke logs out other browser', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const requestA = contextA.request;
    const requestB = contextB.request;

    await loginMarketplaceApi(requestA, demoUsers.customer.phoneNational, E2E_PASSWORD);
    await loginMarketplaceApi(requestB, demoUsers.customer.phoneNational, E2E_PASSWORD);

    const listA = await requestA.get(`${apiBaseUrl()}/profile/security/sessions`, {
      headers: await sessionRequestHeaders(requestA),
    });
    expect(listA.ok()).toBeTruthy();
    const devices = ((await listA.json()) as {
      data: { devices: Array<{ sessions: Array<{ id: string; is_current: boolean }> }> };
    }).data.devices;
    const remote = devices
      .flatMap((device) => device.sessions)
      .find((item) => !item.is_current);
    expect(remote).toBeTruthy();

    const revoke = await requestA.delete(`${apiBaseUrl()}/profile/security/sessions/${remote!.id}`, {
      headers: await sessionRequestHeaders(requestA),
    });
    expect(revoke.ok()).toBeTruthy();

    const meB = await requestB.get(`${apiBaseUrl()}/auth/me`, {
      headers: await sessionRequestHeaders(requestB),
    });
    expect(meB.status()).toBe(401);

    const meA = await requestA.get(`${apiBaseUrl()}/auth/me`, {
      headers: await sessionRequestHeaders(requestA),
    });
    expect(meA.ok()).toBeTruthy();

    await contextA.close();
    await contextB.close();
  });

  test('logout all others keeps current browser session', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const requestA = contextA.request;
    const requestB = contextB.request;

    await loginMarketplaceApi(requestA, demoUsers.customer.phoneNational, E2E_PASSWORD);
    await loginMarketplaceApi(requestB, demoUsers.customer.phoneNational, E2E_PASSWORD);

    const logoutOthers = await requestA.post(
      `${apiBaseUrl()}/profile/security/sessions/logout-others`,
      { headers: await sessionRequestHeaders(requestA) },
    );
    expect(logoutOthers.ok()).toBeTruthy();

    expect((await requestA.get(`${apiBaseUrl()}/auth/me`, { headers: await sessionRequestHeaders(requestA) })).ok()).toBeTruthy();
    expect(
      (await requestB.get(`${apiBaseUrl()}/auth/me`, { headers: await sessionRequestHeaders(requestB) })).status(),
    ).toBe(401);

    await contextA.close();
    await contextB.close();
  });

  test('security page lists devices in UI', async ({ page }) => {
    await loginMarketplaceUi(page, demoUsers.customer.phoneNational);
    await page.goto('/profile/security');
    await expect(page.getByRole('heading', { name: /Security|الأمان/i })).toBeVisible();
    await expect(page.getByText(/Connected devices|الأجهزة المتصلة/i)).toBeVisible();
  });
});
