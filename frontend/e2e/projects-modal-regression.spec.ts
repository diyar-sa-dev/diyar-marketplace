import { test, expect } from '@playwright/test';

async function dismissHomeAdIfVisible(page: import('@playwright/test').Page) {
  const popup = page.getByTestId('home-ad-popup');
  if (await popup.isVisible().catch(() => false)) {
    await popup.getByRole('button', { name: /close|إغلاق/i }).click();
    await expect(popup).toBeHidden({ timeout: 10_000 });
  }
}

test.describe('Projects modal regression (KI-028-041)', () => {
  test('sidebar projects opens when homepage ad popup is dismissed', async ({ page }) => {
    const projectsApi = await page.request.get('/api/v1/projects?per_page=4');
    expect(projectsApi.ok()).toBeTruthy();
    const payload = await projectsApi.json();
    const firstProject = payload?.data?.items?.[0] as
      | { slug: string; title: string }
      | undefined;
    test.skip(!firstProject?.slug, 'No published projects in API seed');

    await page.goto('/');
    await page.waitForTimeout(5500);
    await dismissHomeAdIfVisible(page);

    await page.locator('header button').first().click();
    await page.getByRole('button', { name: /المشاريع|projects/i }).click();

    const projectCard = page.getByRole('heading', { level: 4, name: firstProject!.title });
    await expect(projectCard).toBeVisible({ timeout: 30_000 });
  });

  test('sidebar projects remains reachable while homepage ad is visible (KI-028-041 fixed)', async ({
    page,
  }) => {
    const projectsApi = await page.request.get('/api/v1/projects?per_page=4');
    expect(projectsApi.ok()).toBeTruthy();
    const payload = await projectsApi.json();
    const firstProject = payload?.data?.items?.[0] as { slug: string; title: string } | undefined;
    test.skip(!firstProject?.slug, 'No published projects in API seed');

    await page.goto('/');
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 12_000 });

    await page.locator('header button').first().click();
    await page.getByRole('button', { name: /المشاريع|projects/i }).click();

    await expect(
      page.getByRole('heading', { level: 4, name: firstProject!.title }),
    ).toBeVisible({ timeout: 30_000 });
  });
});
