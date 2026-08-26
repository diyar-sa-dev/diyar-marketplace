import { test, expect } from '@playwright/test';
import { apiBaseUrl } from './helpers/api.ts';

const E2E_BLOG_SLUG = 'e2e-blog-article';

test.describe('Blog journey', () => {
  test('blog listing loads and opens article detail with related section', async ({ page }) => {
    const articleApi = await page.request.get(`${apiBaseUrl()}/blog/articles/${E2E_BLOG_SLUG}`);
    expect(articleApi.ok()).toBeTruthy();
    const articlePayload = await articleApi.json();
    const articleTitle = articlePayload?.data?.article?.title as string;

    await page.goto('/blog', { waitUntil: 'networkidle' });

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 });

    const articleLink = page.getByTestId(`blog-article-card-${E2E_BLOG_SLUG}`);
    await expect(articleLink).toBeVisible({ timeout: 60_000 });
    await articleLink.click();

    await expect(page).toHaveURL(new RegExp(`/blog/${E2E_BLOG_SLUG}$`));
    await expect(page.getByRole('heading', { level: 1 })).toContainText(articleTitle, {
      timeout: 30_000,
    });

    await expect(page.getByRole('heading', { level: 2, name: /مقالات ذات صلة|related/i })).toBeVisible({
      timeout: 30_000,
    });

    await page.getByRole('link', { name: /عرض المدونة|view blog/i }).click();
    await expect(page).toHaveURL(/\/blog$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 });
  });
});
