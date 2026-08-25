import { test, expect } from '@playwright/test';
import { apiBaseUrl } from './helpers/api.ts';

/** Published company from B2bContentSeeder — always present after DatabaseSeeder. */
const PUBLISHED_B2B_SLUG = 'modernwood';

test.describe.configure({ mode: 'serial' });

test.describe('B2B directory journey', () => {
  test('listing loads and opens company detail', async ({ page, request }) => {
    const companyApi = await request.get(`${apiBaseUrl()}/b2b/companies/${PUBLISHED_B2B_SLUG}`);
    expect(companyApi.ok()).toBeTruthy();
    const payload = await companyApi.json();
    const companyName = payload?.data?.company?.name as string;

    await page.goto('/b2b', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('b2b-page-title')).toBeVisible({ timeout: 30_000 });

    const card = page.getByTestId(`b2b-company-card-${PUBLISHED_B2B_SLUG}`);
    if (await card.isVisible().catch(() => false)) {
      await card.getByRole('link', { name: 'زيارة ملف الشركة' }).click();
    } else {
      await page.goto(`/b2b/${PUBLISHED_B2B_SLUG}`);
    }

    await expect(page).toHaveURL(new RegExp(`/b2b/${PUBLISHED_B2B_SLUG}$`));
    await expect(page.getByRole('heading', { level: 1 })).toContainText(companyName, {
      timeout: 30_000,
    });
  });

  test('guest can browse but cannot submit RFQ without login', async ({ page, request }) => {
    const companyApi = await request.get(`${apiBaseUrl()}/b2b/companies/${PUBLISHED_B2B_SLUG}`);
    expect(companyApi.ok()).toBeTruthy();

    await page.goto(`/b2b/${PUBLISHED_B2B_SLUG}`, { waitUntil: 'networkidle' });
    await expect(page.getByTestId('b2b-rfq-open')).toBeVisible({ timeout: 30_000 });
    await page.getByTestId('b2b-rfq-open').click();
    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 });
  });
});
