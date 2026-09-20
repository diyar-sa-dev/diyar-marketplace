import { test, expect } from '@playwright/test';

test.describe('Smart filter suggestions', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

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

    await page.goto('/search?type=products&category_slug=bedroom', { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('heading', {
        name: /Suggested filters|Start narrowing your results|فلاتر مقترحة لك|ابدأ بتضييق النتائج/i,
      }),
    ).toBeVisible({
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

    await page.goto('/search?type=services&q=service', { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('heading', {
        name: /Suggested filters|Start narrowing your results|فلاتر مقترحة لك|ابدأ بتضييق النتائج|لا تتوفر/i,
      }),
    ).toBeVisible({ timeout: 60_000 });
  });
});
