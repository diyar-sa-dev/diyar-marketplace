import { test, expect } from '@playwright/test';

test.describe('Smart filter suggestions', () => {
  test('product search loads suggestion section and API contract', async ({ page }) => {
    const suggestionsApi = await page.request.get(
      '/api/v1/catalog/search/filter-suggestions?type=products&category_slug=bedroom',
      { headers: { 'Accept-Language': 'en' } },
    );

    expect(suggestionsApi.ok()).toBeTruthy();

    const payload = (await suggestionsApi.json()).data.products;
    expect(payload).toHaveProperty('display_mode');
    expect(payload).toHaveProperty('initialized_filters');
    expect(
      payload.suggestions.length + payload.initialized_filters.length,
    ).toBeGreaterThan(0);

    await page.goto('/search?type=products&category_slug=bedroom');
    await expect(page.getByText(/Suggested filters|Start narrowing your results/i).first()).toBeVisible({
      timeout: 60_000,
    });
  });

  test('service search exposes initialized fallback contract when ranked is empty', async ({ page }) => {
    const suggestionsApi = await page.request.get(
      '/api/v1/catalog/search/filter-suggestions?type=services',
      { headers: { 'Accept-Language': 'en' } },
    );

    expect(suggestionsApi.ok()).toBeTruthy();

    const section = (await suggestionsApi.json()).data.services;
    expect(['ranked', 'initialized', 'unavailable']).toContain(section.display_mode);

    if (section.display_mode === 'initialized') {
      expect(section.suggestions).toEqual([]);
      expect(section.initialized_filters.length).toBeGreaterThan(0);
    }

    await page.goto('/services');
    await expect(
      page.getByText(/Suggested filters|Start narrowing your results|No suitable filters/i).first(),
    ).toBeVisible({ timeout: 60_000 });
  });
});
