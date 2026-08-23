import type { Page } from '@playwright/test';

async function readXsrfToken(page: Page): Promise<string | null> {
  const cookies = await page.context().cookies();
  const token = cookies.find((cookie) => cookie.name === 'XSRF-TOKEN')?.value;
  return token ? decodeURIComponent(token) : null;
}

export async function marketplaceSessionOk(page: Page): Promise<boolean> {
  const xsrf = await readXsrfToken(page);
  const response = await page.request.get('/api/v1/auth/me', {
    headers: {
      Accept: 'application/json',
      ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}),
    },
  });
  return response.ok();
}

export async function adminSessionOk(page: Page): Promise<boolean> {
  const xsrf = await readXsrfToken(page);
  const response = await page.request.get('/api/v1/admin/session', {
    headers: {
      Accept: 'application/json',
      ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}),
    },
  });
  return response.ok();
}

export async function logoutMarketplaceViaApi(page: Page): Promise<void> {
  const xsrf = await readXsrfToken(page);
  await page.request.post('/api/v1/auth/logout', {
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}),
    },
  });
}

export async function logoutAdminViaApi(page: Page): Promise<void> {
  const xsrf = await readXsrfToken(page);
  await page.request.post('/api/v1/admin/auth/logout', {
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}),
    },
  });
}
