import type { APIRequestContext } from '@playwright/test';
import { demoUsers } from '../fixtures/credentials.ts';
import { apiBaseUrl, loginAdminApi } from './api.ts';

const DRAFT_B2B_SLUG = 'draft-b2b-company';

async function readXsrfToken(request: APIRequestContext): Promise<string | null> {
  const state = await request.storageState();
  const token = state.cookies.find((cookie) => cookie.name === 'XSRF-TOKEN')?.value;
  return token ? decodeURIComponent(token) : null;
}

function adminHeaders(xsrf: string | null): Record<string, string> {
  return {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}),
  };
}

export async function ensureDraftB2bCompanyHidden(request: APIRequestContext): Promise<void> {
  const publicRes = await request.get(`${apiBaseUrl()}/b2b/companies/${DRAFT_B2B_SLUG}`, {
    failOnStatusCode: false,
  });

  if (publicRes.status() !== 200) {
    return;
  }

  await loginAdminApi(request, demoUsers.admin.phoneNational);
  const headers = adminHeaders(await readXsrfToken(request));

  const listRes = await request.get(
    `${apiBaseUrl()}/admin/b2b/companies?q=${encodeURIComponent(DRAFT_B2B_SLUG)}&per_page=20`,
    { headers },
  );

  if (!listRes.ok()) {
    throw new Error(`Unable to locate draft B2B company for reset: ${listRes.status()}`);
  }

  const body = await listRes.json();
  const companies = (body?.data?.companies ?? []) as Array<{ id: string; slug: string }>;
  const company = companies.find((item) => item.slug === DRAFT_B2B_SLUG);

  if (!company?.id) {
    return;
  }

  const unpublishRes = await request.post(
    `${apiBaseUrl()}/admin/b2b/companies/${company.id}/unpublish`,
    { headers },
  );

  if (!unpublishRes.ok()) {
    throw new Error(`Unable to reset draft B2B company: ${unpublishRes.status()}`);
  }
}
