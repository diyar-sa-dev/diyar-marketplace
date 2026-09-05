import { test, expect } from '@playwright/test';
import {
  dismissHomeAdIfVisible,
  openSidebarProjects,
  waitForHomeAdIfExpected,
  waitForStorefrontShell,
} from './helpers/sidebar.ts';

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
    await dismissHomeAdIfVisible(page);
    await openSidebarProjects(page);

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
    await waitForStorefrontShell(page);
    await waitForHomeAdIfExpected(page);
    await openSidebarProjects(page);

    await expect(
      page.getByRole('heading', { level: 4, name: firstProject!.title }),
    ).toBeVisible({ timeout: 30_000 });
  });
});
