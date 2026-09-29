import { apiClient } from './client.ts';
import { ensureCsrfCookie } from '../lib/csrf.ts';
import type { ApiSuccessResponse } from '../types/api.ts';

export type VendorCouponEffectiveStatus =
  'active' | 'inactive' | 'scheduled' | 'expired' | 'exhausted';

export type VendorCoupon = {
  id: string;
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  scope_type?: 'all' | 'categories' | 'products';
  value: number;
  fixed_amount: string | null;
  minimum_order: string;
  maximum_discount: string | null;
  starts_at: string | null;
  ends_at: string | null;
  usage_limit: number | null;
  usage_limit_per_user?: number | null;
  used_count: number;
  is_active: boolean;
  effective_status: VendorCouponEffectiveStatus;
  created_at: string;
  updated_at: string;
};

export type VendorCouponPayload = {
  code: string;
  type?: 'percentage' | 'fixed' | 'free_shipping';
  value?: number;
  fixed_amount?: number | null;
  minimum_order?: number;
  maximum_discount?: number | null;
  starts_at?: string | null;
  ends_at?: string | null;
  usage_limit?: number | null;
  usage_limit_per_user?: number | null;
  is_active?: boolean;
};

export type VendorCouponListResponse = {
  items: VendorCoupon[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export async function fetchVendorCoupons(
  page = 1,
  perPage = 10,
): Promise<VendorCouponListResponse> {
  const { data } = await apiClient.get<ApiSuccessResponse<VendorCouponListResponse>>(
    '/dashboard/vendor/coupons',
    { params: { page, per_page: perPage } },
  );
  return data.data;
}

export async function createVendorCoupon(payload: VendorCouponPayload): Promise<VendorCoupon> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<{ coupon: VendorCoupon }>>(
    '/dashboard/vendor/coupons',
    payload,
  );
  return data.data.coupon;
}

export async function updateVendorCoupon(
  id: string,
  payload: Partial<VendorCouponPayload>,
): Promise<VendorCoupon> {
  await ensureCsrfCookie();
  const { data } = await apiClient.patch<ApiSuccessResponse<{ coupon: VendorCoupon }>>(
    `/dashboard/vendor/coupons/${id}`,
    payload,
  );
  return data.data.coupon;
}

export async function activateVendorCoupon(id: string): Promise<VendorCoupon> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<{ coupon: VendorCoupon }>>(
    `/dashboard/vendor/coupons/${id}/activate`,
  );
  return data.data.coupon;
}

export async function deactivateVendorCoupon(id: string): Promise<VendorCoupon> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<{ coupon: VendorCoupon }>>(
    `/dashboard/vendor/coupons/${id}/deactivate`,
  );
  return data.data.coupon;
}
