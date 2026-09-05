import { expect, type Page } from '@playwright/test';

export async function waitForStorefrontShell(page: Page): Promise<void> {
  await expect(page.getByTestId('sidebar-menu-toggle')).toBeVisible({ timeout: 60_000 });
}

export async function dismissHomeAdIfVisible(page: Page): Promise<void> {
  const popup = page.getByTestId('home-ad-popup');
  if (await popup.isVisible().catch(() => false)) {
    await popup.getByRole('button', { name: /close|إغلاق/i }).click();
    await expect(popup).toBeHidden({ timeout: 10_000 });
  }
}

export async function waitForHomeAdIfExpected(page: Page): Promise<void> {
  await expect(page.getByTestId('home-ad-popup')).toBeVisible({ timeout: 15_000 });
}

export async function openSidebarProjects(page: Page): Promise<void> {
  await waitForStorefrontShell(page);
  await dismissHomeAdIfVisible(page);
  await page.getByTestId('sidebar-menu-toggle').click();
  await page.getByTestId('sidebar-projects-link').click();
}
