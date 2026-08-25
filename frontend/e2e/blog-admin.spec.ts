import { test, expect } from '@playwright/test';
import { demoUsers } from './fixtures/credentials.ts';
import { loginAdminUi } from './helpers/ui-auth.ts';

test.describe('Admin blog journey', () => {
  test('create draft article, publish, verify public, unpublish, verify 404', async ({ page }) => {
    const adminArticleSlug = `e2e-admin-flow-${Date.now()}`;

    await loginAdminUi(page, demoUsers.admin.phoneNational);

    await page.goto('/admin/blog/articles');
    await expect(page.getByTestId('admin-blog-create')).toBeVisible({ timeout: 30_000 });

    await page.getByTestId('admin-blog-create').click();
    await page.getByTestId('blog-article-title').fill('E2E Admin Flow Article');
    await page.getByTestId('blog-article-slug').fill(adminArticleSlug);
    await page.getByTestId('blog-article-content').fill('<p>E2E admin flow article body.</p>');
    await page.getByTestId('blog-article-author').fill('E2E Admin');
    await page.getByTestId('blog-article-submit').click();

    await expect(page.getByRole('cell', { name: adminArticleSlug, exact: true })).toBeVisible({
      timeout: 30_000,
    });

    await expect
      .poll(async () => {
        const draftPublic = await page.request.get(`/api/v1/blog/articles/${adminArticleSlug}`, {
          failOnStatusCode: false,
        });
        return draftPublic.status();
      })
      .toBe(404);

    await page.getByTestId(`blog-publish-${adminArticleSlug}`).click();
    await expect(page.getByTestId(`blog-unpublish-${adminArticleSlug}`)).toBeVisible({
      timeout: 30_000,
    });

    await page.goto(`/blog/${adminArticleSlug}`);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('E2E Admin Flow Article', {
      timeout: 30_000,
    });

    await page.goto('/admin/blog/articles');
    await page.getByTestId(`blog-unpublish-${adminArticleSlug}`).click();
    await expect(page.getByTestId(`blog-publish-${adminArticleSlug}`)).toBeVisible({
      timeout: 30_000,
    });

    const unpublishedPublic = await page.request.get(`/api/v1/blog/articles/${adminArticleSlug}`, {
      failOnStatusCode: false,
    });
    expect(unpublishedPublic.status()).toBe(404);

    await page.goto(`/blog/${adminArticleSlug}`);
    await expect(page.locator('body')).toContainText(/404|not found|غير موجود|تعذر/i, {
      timeout: 30_000,
    });
  });
});
