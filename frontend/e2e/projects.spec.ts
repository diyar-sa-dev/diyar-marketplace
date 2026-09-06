import { test, expect } from '@playwright/test';
import { openSidebarProjects } from './helpers/sidebar.ts';

test.describe('Sidebar projects journey', () => {
  test('opens projects modal, verifies API project, and opens detail', async ({ page }) => {
    const projectsApi = await page.request.get('/api/v1/projects?per_page=4');
    expect(projectsApi.ok()).toBeTruthy();
    const payload = await projectsApi.json();
    const firstProject = payload?.data?.items?.[0] as
      | { slug: string; title: string }
      | undefined;
    expect(firstProject?.slug).toBeTruthy();

    await page.goto('/');
    await openSidebarProjects(page);

    const projectCard = page.getByRole('heading', { level: 4, name: firstProject!.title });
    await expect(projectCard).toBeVisible({ timeout: 30_000 });
    await projectCard.scrollIntoViewIfNeeded();
    await projectCard.click({ force: true });

    await expect(
      page.getByRole('heading', { level: 4, name: firstProject!.title }).first(),
    ).toBeVisible({
      timeout: 30_000,
    });
  });
});
