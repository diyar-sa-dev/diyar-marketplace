import { test, expect } from '@playwright/test';
import { demoUsers, E2E_PASSWORD } from './fixtures/credentials.ts';
import { apiBaseUrl } from './helpers/api.ts';
import { ensureDraftB2bCompanyHidden } from './helpers/b2b-reset.ts';
import { loginAdminUi, loginMarketplaceUi } from './helpers/ui-auth.ts';

const PUBLISHED_B2B_SLUG = 'modernwood';
const DRAFT_B2B_SLUG = 'draft-b2b-company';

test.describe.configure({ mode: 'serial' });

test.describe('B2B admin journey', () => {
  test.beforeEach(async ({ request }) => {
    await ensureDraftB2bCompanyHidden(request);
  });

  test('draft company is hidden from public but visible in admin list filter', async ({ page, request }) => {
    const draftPublic = await request.get(`${apiBaseUrl()}/b2b/companies/${DRAFT_B2B_SLUG}`, {
      failOnStatusCode: false,
    });
    expect(draftPublic.status()).toBe(404);

    await loginAdminUi(page, demoUsers.admin.phoneNational);
    await page.goto('/admin/b2b/companies', { waitUntil: 'networkidle' });
    await page.locator('select').first().selectOption('draft');
    await expect(page.getByTestId(`b2b-preview-${DRAFT_B2B_SLUG}`)).toBeVisible({ timeout: 60_000 });
  });

  test('admin publishes and verifies a draft company for public visibility', async ({ page, request }) => {
    const draftPublic = await request.get(`${apiBaseUrl()}/b2b/companies/${DRAFT_B2B_SLUG}`, {
      failOnStatusCode: false,
    });
    expect(draftPublic.status()).toBe(404);

    await loginAdminUi(page, demoUsers.admin.phoneNational);
    await page.goto('/admin/b2b/companies', { waitUntil: 'networkidle' });

    await page.locator('select').first().selectOption('draft');
    await expect(page.getByTestId(`b2b-preview-${DRAFT_B2B_SLUG}`)).toBeVisible({ timeout: 60_000 });

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes('/admin/b2b/companies/') &&
          response.url().includes('/publish') &&
          response.ok(),
      ),
      page.getByTestId(`b2b-publish-${DRAFT_B2B_SLUG}`).click(),
    ]);

    await page.locator('select').first().selectOption('published');
    await expect(page.getByTestId(`b2b-unpublish-${DRAFT_B2B_SLUG}`)).toBeVisible({
      timeout: 30_000,
    });

    await page.getByTestId(`b2b-verify-${DRAFT_B2B_SLUG}`).click();

    await page.goto(`/b2b/${DRAFT_B2B_SLUG}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 });
  });

  test('customer cannot access admin B2B management', async ({ page, request }) => {
    await page.goto('/admin/login');
    await page.locator('#admin-login-phone').fill(demoUsers.customer.phoneNational);
    await page.locator('#admin-login-password').fill(E2E_PASSWORD);
    await page.locator('[data-testid="admin-login-submit"]').click();
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 30_000 });

    await loginMarketplaceUi(page, demoUsers.customer.phoneNational);
    const response = await request.get(`${apiBaseUrl()}/admin/b2b/companies`, {
      failOnStatusCode: false,
    });
    expect([401, 403]).toContain(response.status());
  });
});

test.describe('B2B customer RFQ journey', () => {
  test('authenticated customer submits RFQ successfully', async ({ page, request }) => {
    const companyApi = await request.get(`${apiBaseUrl()}/b2b/companies/${PUBLISHED_B2B_SLUG}`);
    expect(companyApi.ok()).toBeTruthy();

    await loginMarketplaceUi(page, demoUsers.customer.phoneNational);
    await page.goto(`/b2b/${PUBLISHED_B2B_SLUG}`, { waitUntil: 'networkidle' });

    await expect(page.getByTestId('b2b-rfq-open')).toBeVisible({ timeout: 30_000 });
    await page.getByTestId('b2b-rfq-open').click();
    await page.getByTestId('b2b-rfq-project-type').fill(`تأثيث مكتب E2E ${Date.now()}`);
    await page.getByTestId('b2b-rfq-details').fill(
      'نحتاج تأثيث مكتب كامل يشمل 20 مكتباً و40 كرسياً للاختبار الآلي.',
    );
    await page.getByTestId('b2b-rfq-submit').click();

    await expect(page.getByTestId('b2b-rfq-success')).toBeVisible({ timeout: 30_000 });
  });
});
