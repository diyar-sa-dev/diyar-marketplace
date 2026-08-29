import { test, expect } from '@playwright/test';
import { demoUsers, E2E_PASSWORD } from './fixtures/credentials.ts';
import {
  apiBaseUrl,
  applyRequestSessionToPage,
  loginMarketplaceApi,
  sessionRequestHeaders,
} from './helpers/api.ts';

async function ensureCustomerAddress(request: import('@playwright/test').APIRequestContext): Promise<string> {
  const headers = await sessionRequestHeaders(request);
  const addresses = await request.get(`${apiBaseUrl()}/addresses`, { headers });
  const list = (await addresses.json())?.data?.addresses ?? [];

  if (list.length > 0) {
    return list[0].id as string;
  }

  const created = await request.post(`${apiBaseUrl()}/addresses`, {
    headers: { ...headers, 'Content-Type': 'application/json' },
    data: {
      label: 'E2E Home',
      city: 'Riyadh',
      district: 'Al Olaya',
      street: 'Test St',
      building: '1',
      is_default: true,
    },
  });
  expect(created.ok()).toBeTruthy();

  return (await created.json())?.data?.address?.id;
}

test.describe('Checkout journey', () => {
  test.beforeEach(async ({ request }) => {
    await loginMarketplaceApi(request, demoUsers.customer.phoneNational, E2E_PASSWORD);
    await ensureCustomerAddress(request);

    const headers = await sessionRequestHeaders(request);
    await request.delete(`${apiBaseUrl()}/cart`, { headers }).catch(() => undefined);
  });

  test('API checkout and fake payment completes order', async ({ request }) => {
    const headers = await sessionRequestHeaders(request);

    const products = await request.get(`${apiBaseUrl()}/products?per_page=1`);
    expect(products.ok()).toBeTruthy();
    const productId = (await products.json())?.data?.products?.[0]?.id;
    expect(productId).toBeTruthy();

    await request.post(`${apiBaseUrl()}/cart/items`, {
      headers: { ...headers, 'Content-Type': 'application/json' },
      data: { product_id: productId, quantity: 1 },
    });

    const cart = await request.get(`${apiBaseUrl()}/cart`, { headers });
    const vendorAccountId = (await cart.json())?.data?.cart?.items?.[0]?.product?.vendor?.vendor_account_id;
    const addressId = await ensureCustomerAddress(request);

    const payload = {
      shipping_address_id: addressId,
      vendor_delivery_selections: [{ vendor_account_id: vendorAccountId, method: 'carrier' }],
    };

    await request.post(`${apiBaseUrl()}/checkout/preview`, {
      headers: { ...headers, 'Content-Type': 'application/json' },
      data: payload,
    });

    const orderRes = await request.post(`${apiBaseUrl()}/orders`, {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'Idempotency-Key': crypto.randomUUID(),
      },
      data: payload,
    });
    expect(orderRes.ok()).toBeTruthy();
    const orderId = (await orderRes.json())?.data?.order?.id;
    expect(orderId).toBeTruthy();

    const idempotencyKey = crypto.randomUUID();
    const init = await request.post(`${apiBaseUrl()}/orders/${orderId}/payment`, {
      headers: { ...headers, 'Content-Type': 'application/json' },
      data: { idempotency_key: idempotencyKey },
    });
    expect(init.ok()).toBeTruthy();
    const initBody = await init.json();
    const sessionId = initBody?.data?.session?.session_id ?? initBody?.data?.session_id;
    const attemptId = initBody?.data?.attempt_id;

    await request.post(`${apiBaseUrl()}/orders/${orderId}/payment/submit`, {
      headers: { ...headers, 'Content-Type': 'application/json' },
      data: {
        session_id: sessionId,
        idempotency_key: idempotencyKey,
        payment_method: 'mada',
      },
    });

    const sim = await request.post(`${apiBaseUrl()}/orders/${orderId}/payment/simulate`, {
      headers: { ...headers, 'Content-Type': 'application/json' },
      data: { attempt_id: attemptId, outcome: 'success' },
    });
    expect(sim.ok()).toBeTruthy();
    expect((await sim.json())?.data?.status).toBe('paid');

    const order = await request.get(`${apiBaseUrl()}/orders/${orderId}`, { headers });
    expect(order.ok()).toBeTruthy();
    expect((await order.json())?.data?.order?.status).toMatch(/confirmed|paid|processing/i);
  });

  test('UI cart to fake payment simulator', async ({ page, request }) => {
    await applyRequestSessionToPage(request, page);

    const headers = await sessionRequestHeaders(request);
    const products = await request.get(`${apiBaseUrl()}/products?per_page=1`);
    const productId = (await products.json())?.data?.products?.[0]?.id;

    await request.post(`${apiBaseUrl()}/cart/items`, {
      headers: { ...headers, 'Content-Type': 'application/json' },
      data: { product_id: productId, quantity: 1 },
    });

    await page.goto('/checkout', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/checkout/);

    const placeOrder = page.getByRole('button', { name: /place order|تأكيد الطلب|إتمام/i });
    await expect(placeOrder).toBeVisible({ timeout: 30_000 });
    await placeOrder.click();

    await expect(page).toHaveURL(/\/checkout\/payment\/[^/]+/, { timeout: 60_000 });

    const payButton = page.getByRole('button', { name: /pay|ادفع/i });
    await expect(payButton).toBeVisible({ timeout: 30_000 });
    await payButton.click();

    await expect(page).toHaveURL(/\/checkout\/payment\/[^/]+\/simulate/, { timeout: 60_000 });

    const successButton = page.getByRole('button', { name: /success|نجاح/i });
    await expect(successButton).toBeVisible({ timeout: 30_000 });
    await successButton.click();

    await expect(page).toHaveURL(/\/orders/, { timeout: 60_000 });
  });
});
