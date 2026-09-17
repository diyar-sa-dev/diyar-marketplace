import { test, expect } from '@playwright/test';
import { demoUsers, E2E_PASSWORD } from './fixtures/credentials.ts';
import {
  apiBaseUrl,
  ensureCsrf,
  loginMarketplaceApi,
  logoutMarketplaceApi,
  sessionRequestHeaders,
} from './helpers/api.ts';
import { loginMarketplaceUi } from './helpers/ui-auth.ts';

const E2E_OTP = process.env.E2E_OTP_CODE ?? '123456';

async function enableTwoFactorViaApi(request: import('@playwright/test').APIRequestContext): Promise<void> {
  const headers = await sessionRequestHeaders(request);

  const enable = await request.post(`${apiBaseUrl()}/profile/security/two-factor/enable`, { headers });
  expect(enable.ok()).toBeTruthy();

  const confirm = await request.post(`${apiBaseUrl()}/profile/security/two-factor/confirm`, {
    headers,
    data: { code: E2E_OTP },
  });
  expect(confirm.ok()).toBeTruthy();
}

async function disableTwoFactorViaApi(request: import('@playwright/test').APIRequestContext): Promise<void> {
  const headers = await sessionRequestHeaders(request);

  await request.post(`${apiBaseUrl()}/profile/security/two-factor/disable`, {
    headers,
    data: { password: E2E_PASSWORD },
  });

  const confirm = await request.post(`${apiBaseUrl()}/profile/security/two-factor/disable`, {
    headers,
    data: { password: E2E_PASSWORD, code: E2E_OTP },
  });
  expect(confirm.ok()).toBeTruthy();
}

test.describe('Two-factor authentication — E2E', () => {
  test('E2E-01 login without 2FA authenticates directly', async ({ request }) => {
    await loginMarketplaceApi(request, demoUsers.customer.phoneNational, E2E_PASSWORD);
    const me = await request.get(`${apiBaseUrl()}/auth/me`, {
      headers: await sessionRequestHeaders(request),
    });
    expect(me.ok()).toBeTruthy();
    await logoutMarketplaceApi(request);
  });

  test('E2E-03 login with 2FA requires OTP then authenticates', async ({ request }) => {
    await loginMarketplaceApi(request, demoUsers.customer.phoneNational, E2E_PASSWORD);
    await enableTwoFactorViaApi(request);
    await logoutMarketplaceApi(request);

    const xsrf = await ensureCsrf(request);
    const login = await request.post(`${apiBaseUrl()}/auth/login`, {
      data: { method: 'phone', identifier: demoUsers.customer.phoneNational, password: E2E_PASSWORD },
      headers: {
        'Content-Type': 'application/json',
        ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}),
      },
    });
    expect(login.status()).toBe(422);

    const body = (await login.json()) as { errors?: Record<string, string[]> };
    const challengeId = body.errors?.challenge_id?.[0];
    expect(challengeId).toBeTruthy();

    const mePending = await request.get(`${apiBaseUrl()}/auth/me`, {
      headers: await sessionRequestHeaders(request),
    });
    expect(mePending.status()).toBe(401);

    const verify = await request.post(`${apiBaseUrl()}/auth/verify-two-factor`, {
      data: { challenge_id: challengeId, code: E2E_OTP },
      headers: {
        'Content-Type': 'application/json',
        ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}),
      },
    });
    expect(verify.ok()).toBeTruthy();

    const me = await request.get(`${apiBaseUrl()}/auth/me`, {
      headers: await sessionRequestHeaders(request),
    });
    expect(me.ok()).toBeTruthy();

    await disableTwoFactorViaApi(request);
    await logoutMarketplaceApi(request);
  });

  test('E2E-04 wrong OTP remains unauthenticated', async ({ request }) => {
    await loginMarketplaceApi(request, demoUsers.customer.phoneNational, E2E_PASSWORD);
    await enableTwoFactorViaApi(request);
    await logoutMarketplaceApi(request);

    const xsrf = await ensureCsrf(request);
    const login = await request.post(`${apiBaseUrl()}/auth/login`, {
      data: { method: 'phone', identifier: demoUsers.customer.phoneNational, password: E2E_PASSWORD },
      headers: {
        'Content-Type': 'application/json',
        ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}),
      },
    });
    const challengeId = ((await login.json()) as { errors?: Record<string, string[]> }).errors?.challenge_id?.[0];

    const verify = await request.post(`${apiBaseUrl()}/auth/verify-two-factor`, {
      data: { challenge_id: challengeId, code: '000000' },
      headers: {
        'Content-Type': 'application/json',
        ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}),
      },
    });
    expect(verify.status()).toBe(422);

    const me = await request.get(`${apiBaseUrl()}/auth/me`, {
      headers: await sessionRequestHeaders(request),
    });
    expect(me.status()).toBe(401);

    await loginMarketplaceApi(request, demoUsers.customer.phoneNational, E2E_PASSWORD, E2E_OTP);
    await disableTwoFactorViaApi(request);
    await logoutMarketplaceApi(request);
  });

  test('E2E-02 security page shows enable flow in English', async ({ page }) => {
    await loginMarketplaceUi(page, demoUsers.customer.phoneNational);
    await page.goto('/profile/security');
    await expect(page.getByText(/Two-factor authentication \(2FA\)|التحقق بخطوتين/i)).toBeVisible();
    await expect(page.getByText(/^Disabled$|^غير مفعّل$/i)).toBeVisible();
  });

  test('E2E-09 Arabic RTL security copy', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('diyar-locale', 'ar'));
    await loginMarketplaceUi(page, demoUsers.customer.phoneNational);
    await page.goto('/profile/security');
    await expect(page.getByText(/التحقق بخطوتين/)).toBeVisible();
  });
});
