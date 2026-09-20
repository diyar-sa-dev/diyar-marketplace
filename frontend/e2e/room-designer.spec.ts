import { expect, test } from '@playwright/test';
import { demoUsers } from './fixtures/credentials.ts';
import { apiBaseUrl, loginMarketplaceApi, sessionRequestHeaders } from './helpers/api.ts';
import { loginMarketplaceUi } from './helpers/ui-auth.ts';

const sampleDocument = () => ({
  schema_version: 1,
  room: { width_m: 4.5, depth_m: 4, height_m: 2.8, origin: 'corner', preset_id: 'majlis' },
  items: [],
});

async function jsonSessionHeaders(
  request: import('@playwright/test').APIRequestContext,
): Promise<Record<string, string>> {
  return { ...(await sessionRequestHeaders(request)), 'Content-Type': 'application/json' };
}

async function backendReachable(request: import('@playwright/test').APIRequestContext): Promise<boolean> {
  try {
    const health = await request.get(`${apiBaseUrl()}/health`, { timeout: 5_000, failOnStatusCode: false });
    return health.ok();
  } catch {
    return false;
  }
}

async function aiSpatialEnabled(request: import('@playwright/test').APIRequestContext): Promise<boolean> {
  if (!(await roomDesignerEnabled(request))) {
    return false;
  }
  const user = demoUsers.customer.phoneNational;
  await loginMarketplaceApi(request, user);
  const headers = await jsonSessionHeaders(request);
  const create = await request.post(`${apiBaseUrl()}/room-designs`, {
    headers,
    data: { title: 'probe', document: sampleDocument() },
  });
  if (!create.ok()) {
    return false;
  }
  const designId = (
    (await create.json()) as { data: { room_design: { id: string } } }
  ).data.room_design.id;
  const probe = await request.post(`${apiBaseUrl()}/room-designs/${designId}/suggest-layout`, {
    headers,
    failOnStatusCode: false,
  });
  return probe.status() !== 403;
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
    let headers = await jsonSessionHeaders(request);

    const create = await request.post(`${apiBaseUrl()}/room-designs`, {
      headers,
      data: { title: 'E2E room', document: sampleDocument() },
    });
    expect(create.ok()).toBeTruthy();
    const created = (await create.json()) as {
      data: { room_design: { id: string; version: number } };
    };
    const designId = created.data.room_design.id;
    const version = created.data.room_design.version;

    const show = await request.get(`${apiBaseUrl()}/room-designs/${designId}`, { headers });
    expect(show.ok()).toBeTruthy();

    const updatedDoc = sampleDocument();
    updatedDoc.room.width_m = 5;
    const save = await request.put(`${apiBaseUrl()}/room-designs/${designId}`, {
      headers,
      data: { expected_version: version, document: updatedDoc },
    });
    expect(save.ok()).toBeTruthy();

    const stale = await request.put(`${apiBaseUrl()}/room-designs/${designId}`, {
      headers,
      data: { expected_version: version, document: sampleDocument() },
      failOnStatusCode: false,
    });
    expect(stale.status()).toBe(409);
    expect((await stale.json()).code).toBe('version_conflict');

    await loginMarketplaceApi(request, demoUsers.vendor.phoneNational);
    headers = await sessionRequestHeaders(request);
    const idor = await request.get(`${apiBaseUrl()}/room-designs/${designId}`, {
      headers,
      failOnStatusCode: false,
    });
    expect(idor.status()).toBe(404);
  });

  test('suggest-layout returns commands when AI spatial flag enabled', async ({ request }) => {
    test.skip(!(await aiSpatialEnabled(request)), 'AI spatial sub-flag off');

    await loginMarketplaceApi(request, demoUsers.customer.phoneNational);
    const headers = await jsonSessionHeaders(request);
    const products = await request.get(`${apiBaseUrl()}/products?per_page=1`);
    expect(products.ok()).toBeTruthy();
    const product = (await products.json())?.data?.items?.[0] as
      | { id: string; name: string; width_m?: number; depth_m?: number }
      | undefined;
    expect(product?.id).toBeTruthy();

    const create = await request.post(`${apiBaseUrl()}/room-designs`, {
      headers,
      data: {
        title: 'Layout probe',
        document: {
          ...sampleDocument(),
          items: [
            {
              id: '00000000-0000-4000-8000-000000000001',
              product_id: product!.id,
              position_m: { x: 1, z: 1 },
              rotation_deg: 0,
              locked: false,
              layer: 0,
              snapshot: {
                name: product!.name,
                width_m: product!.width_m ?? 1.2,
                depth_m: product!.depth_m ?? 0.8,
              },
            },
          ],
        },
      },
    });
    expect(create.ok()).toBeTruthy();
    const designId = (
      (await create.json()) as { data: { room_design: { id: string } } }
    ).data.room_design.id;

    const suggest = await request.post(`${apiBaseUrl()}/room-designs/${designId}/suggest-layout`, {
      headers,
      data: { intent: 'arrange' },
    });
    expect(suggest.ok()).toBeTruthy();
    const body = (await suggest.json()) as {
      data: { layout_suggestion: { commands: unknown[]; provider: string } };
    };
    expect(body.data.layout_suggestion.provider).toBe('stub');
    expect(body.data.layout_suggestion.commands.length).toBeGreaterThan(0);
  });

  test('suggest-layout forbidden when AI spatial sub-flag disabled', async ({ request }) => {
    test.skip(!(await roomDesignerEnabled(request)), 'Room designer off');
    test.skip(await aiSpatialEnabled(request), 'AI spatial already enabled — skip negative case');

    await loginMarketplaceApi(request, demoUsers.customer.phoneNational);
    const headers = await jsonSessionHeaders(request);
    const create = await request.post(`${apiBaseUrl()}/room-designs`, {
      headers,
      data: { title: 'Layout probe', document: sampleDocument() },
    });
    expect(create.ok()).toBeTruthy();
    const designId = (
      (await create.json()) as { data: { room_design: { id: string } } }
    ).data.room_design.id;

    const suggest = await request.post(`${apiBaseUrl()}/room-designs/${designId}/suggest-layout`, {
      headers,
      failOnStatusCode: false,
    });
    expect(suggest.status()).toBe(403);
  });
});

test.describe('Room Designer — UI', () => {
  test.describe.configure({ mode: 'serial' });

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
    // Aside uses Tailwind `lg` (1024px) — sub-lg uses sheet, not persistent aside.
    await page.setViewportSize({ width: 1100, height: 900 });
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
