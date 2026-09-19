import { expect, test } from '@playwright/test';
import { demoUsers } from './fixtures/credentials.ts';
import { apiBaseUrl, loginMarketplaceApi } from './helpers/api.ts';
import { loginMarketplaceUi } from './helpers/ui-auth.ts';

const sampleDocument = () => ({
  schema_version: 1,
  room: { width_m: 4.5, depth_m: 4, height_m: 2.8, origin: 'corner', preset_id: 'majlis' },
  items: [],
});

async function backendReachable(request: import('@playwright/test').APIRequestContext): Promise<boolean> {
  try {
    const health = await request.get(`${apiBaseUrl()}/health`, { timeout: 5_000, failOnStatusCode: false });
    return health.ok();
  } catch {
    return false;
  }
}

async function roomDesignerEnabled(request: import('@playwright/test').APIRequestContext): Promise<boolean> {
  if (!(await backendReachable(request))) {
    return false;
  }
  const probe = await request.get(`${apiBaseUrl()}/room-designs`, { failOnStatusCode: false });
  return probe.status() !== 403;
}

test.describe('Room Designer — API', () => {
  test('unauthenticated list is rejected', async ({ request }) => {
    test.skip(!(await backendReachable(request)), 'E2E backend unavailable');
    const response = await request.get(`${apiBaseUrl()}/room-designs`, { failOnStatusCode: false });
    expect([401, 403]).toContain(response.status());
  });

  test('authenticated create, update, conflict, and IDOR', async ({ request }) => {
    test.skip(!(await roomDesignerEnabled(request)), 'Room designer feature flag off');

    await loginMarketplaceApi(request, demoUsers.customer.phoneNational);

    const create = await request.post(`${apiBaseUrl()}/room-designs`, {
      data: { title: 'E2E room', document: sampleDocument() },
    });
    expect(create.ok()).toBeTruthy();
    const created = (await create.json()) as {
      data: { room_design: { id: string; version: number } };
    };
    const designId = created.data.room_design.id;
    const version = created.data.room_design.version;

    const show = await request.get(`${apiBaseUrl()}/room-designs/${designId}`);
    expect(show.ok()).toBeTruthy();

    const updatedDoc = sampleDocument();
    updatedDoc.room.width_m = 5;
    const save = await request.put(`${apiBaseUrl()}/room-designs/${designId}`, {
      data: { expected_version: version, document: updatedDoc },
    });
    expect(save.ok()).toBeTruthy();

    const stale = await request.put(`${apiBaseUrl()}/room-designs/${designId}`, {
      data: { expected_version: version, document: sampleDocument() },
      failOnStatusCode: false,
    });
    expect(stale.status()).toBe(409);
    expect((await stale.json()).code).toBe('version_conflict');

    await loginMarketplaceApi(request, demoUsers.vendor.phoneNational);
    const idor = await request.get(`${apiBaseUrl()}/room-designs/${designId}`, { failOnStatusCode: false });
    expect(idor.status()).toBe(404);
  });
});

test.describe('Room Designer — UI', () => {
  test.beforeEach(async ({ page, request }) => {
    test.skip(!(await roomDesignerEnabled(request)), 'Room designer feature flag off');
    await loginMarketplaceUi(page, demoUsers.customer.phoneNational);
  });

  test('desktop — shell loads after auto-create', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/profile/room-designer');
    await expect(page.getByTestId('room-designer-page')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('room-designer-shell')).toBeVisible();
    await expect(page.getByTestId('room-designer-canvas-host')).toBeVisible();
  });

  test('tablet — catalog aside visible', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 900 });
    await page.goto('/profile/room-designer');
    await expect(page.getByTestId('room-designer-shell')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('room-designer-catalog-panel')).toBeVisible();
  });

  test('mobile — catalog sheet opens', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/profile/room-designer');
    await expect(page.getByTestId('room-designer-shell')).toBeVisible({ timeout: 60_000 });
    await page.getByRole('button', { name: /المنتجات/i }).click();
    await expect(page.getByTestId('room-designer-catalog-panel')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: /المنتجات/i })).toBeHidden();
  });
});
