import type { APIRequestContext } from '@playwright/test';
import { E2E_PASSWORD } from '../fixtures/credentials.ts';

export function apiBaseUrl(): string {
  return process.env.E2E_API_URL ?? 'http://127.0.0.1:8000/api/v1';
}

export function appOrigin(): string {
  const api = apiBaseUrl();
  return api.replace(/\/api\/v1\/?$/, '');
}

async function readXsrfToken(request: APIRequestContext): Promise<string | null> {
  const state = await request.storageState();
  const token = state.cookies.find((cookie) => cookie.name === 'XSRF-TOKEN')?.value;
  return token ? decodeURIComponent(token) : null;
}

export async function ensureCsrf(request: APIRequestContext): Promise<string | null> {
  const response = await request.get(`${appOrigin()}/sanctum/csrf-cookie`);
  if (!response.ok()) {
    throw new Error(`CSRF cookie bootstrap failed: ${response.status()}`);
  }

  return readXsrfToken(request);
}

export async function loginMarketplaceApi(
  request: APIRequestContext,
  identifier: string,
  password = E2E_PASSWORD,
): Promise<void> {
  const xsrf = await ensureCsrf(request);
  const response = await request.post(`${apiBaseUrl()}/auth/login`, {
    data: { method: 'phone', identifier, password },
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}),
    },
  });
  if (!response.ok()) {
    throw new Error(`Marketplace login failed: ${response.status()} ${await response.text()}`);
  }
}

export async function loginAdminApi(
  request: APIRequestContext,
  identifier: string,
  password = E2E_PASSWORD,
): Promise<void> {
  const xsrf = await ensureCsrf(request);
  const response = await request.post(`${apiBaseUrl()}/admin/auth/login`, {
    data: { method: 'phone', identifier, password },
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}),
    },
  });
  if (!response.ok()) {
    throw new Error(`Admin login failed: ${response.status()} ${await response.text()}`);
  }
}

export async function logoutMarketplaceApi(request: APIRequestContext): Promise<void> {
  const xsrf = await readXsrfToken(request);
  await request.post(`${apiBaseUrl()}/auth/logout`, {
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}),
    },
  });
}

export async function logoutAdminApi(request: APIRequestContext): Promise<void> {
  const xsrf = await readXsrfToken(request);
  await request.post(`${apiBaseUrl()}/admin/auth/logout`, {
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}),
    },
  });
}
