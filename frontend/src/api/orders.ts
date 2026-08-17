import { apiClient } from './client.ts';
import { ensureCsrfCookie } from '../lib/csrf.ts';
import type { ApiSuccessResponse } from '../types/api.ts';
import type { CheckoutPreviewPayload } from '../types/checkout.ts';
import type {
  CreateManualVendorOrderPayload,
  Order,
  OrderListResponse,
  VendorOrder,
  VendorOrderFilters,
  VendorOrderListResponse,
} from '../types/order.ts';

export async function createOrder(
  payload: CheckoutPreviewPayload,
  idempotencyKey: string,
): Promise<Order> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<{ order: Order }>>('/orders', payload, {
    headers: { 'Idempotency-Key': idempotencyKey },
  });
  return data.data.order;
}

export async function fetchOrders(page = 1): Promise<OrderListResponse> {
  const { data } = await apiClient.get<ApiSuccessResponse<OrderListResponse>>('/orders', {
    params: { page },
  });
  return data.data;
}

export async function fetchOrder(orderId: string): Promise<Order> {
  const { data } = await apiClient.get<ApiSuccessResponse<{ order: Order }>>(`/orders/${orderId}`);
  return data.data.order;
}

export async function cancelOrder(orderId: string): Promise<Order> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<{ order: Order }>>(`/orders/${orderId}/cancel`);
  return data.data.order;
}

export async function fetchVendorOrders(filters: VendorOrderFilters = {}): Promise<VendorOrderListResponse> {
  const { data } = await apiClient.get<ApiSuccessResponse<VendorOrderListResponse>>(
    '/dashboard/vendor/orders',
    {
      params: {
        page: filters.page ?? 1,
        per_page: filters.per_page ?? 15,
        q: filters.q,
        status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        payment_status:
          filters.payment_status && filters.payment_status !== 'all'
            ? filters.payment_status
            : undefined,
      },
    },
  );
  return data.data;
}

export async function createManualVendorOrder(payload: CreateManualVendorOrderPayload): Promise<VendorOrder> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<{ vendor_order: VendorOrder }>>(
    '/dashboard/vendor/orders',
    payload,
  );
  return data.data.vendor_order;
}

export async function fetchVendorOrder(vendorOrderId: string) {
  const { data } = await apiClient.get<ApiSuccessResponse<{ vendor_order: VendorOrderListResponse['vendor_orders'][number] }>>(
    `/dashboard/vendor/orders/${vendorOrderId}`,
  );
  return data.data.vendor_order;
}

export async function acceptVendorOrder(vendorOrderId: string) {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<{ vendor_order: unknown }>>(
    `/dashboard/vendor/orders/${vendorOrderId}/accept`,
  );
  return data.data.vendor_order;
}

export async function processVendorOrder(vendorOrderId: string) {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<{ vendor_order: unknown }>>(
    `/dashboard/vendor/orders/${vendorOrderId}/process`,
  );
  return data.data.vendor_order;
}

export async function shipVendorOrder(
  vendorOrderId: string,
  payload: { tracking_number: string; carrier?: string },
) {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<{ vendor_order: unknown }>>(
    `/dashboard/vendor/orders/${vendorOrderId}/ship`,
    payload,
  );
  return data.data.vendor_order;
}

export async function deliverVendorOrder(vendorOrderId: string) {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<{ vendor_order: unknown }>>(
    `/dashboard/vendor/orders/${vendorOrderId}/deliver`,
  );
  return data.data.vendor_order;
}

export async function cancelVendorOrder(vendorOrderId: string) {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<{ vendor_order: unknown }>>(
    `/dashboard/vendor/orders/${vendorOrderId}/cancel`,
  );
  return data.data.vendor_order;
}
