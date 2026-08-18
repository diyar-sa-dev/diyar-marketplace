import { apiClient } from './client.ts';
import { ensureCsrfCookie } from '../lib/csrf.ts';
import type { ApiSuccessResponse } from '../types/api.ts';
import type { PaginationMeta } from '../types/catalog.ts';

export interface ProductPreorderRequest {
  id: string;
  status: 'pending' | 'fulfilled' | 'cancelled';
  unit_price: string;
  selected_color?: { name?: string; hex_code?: string } | null;
  created_at?: string;
  fulfilled_at?: string | null;
  cancelled_at?: string | null;
  customer?: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    avatar_url?: string | null;
  };
  product?: {
    id: string;
    name: string;
    slug?: string;
    image_url?: string | null;
  };
}

export interface PaginatedVendorPreorders {
  items: ProductPreorderRequest[];
  pagination: PaginationMeta;
  summary: { pending: number };
}

export async function submitProductPreorder(
  productId: string,
  payload?: { selected_color?: { name?: string; hex_code?: string } | null },
): Promise<ProductPreorderRequest> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<{ preorder: ProductPreorderRequest }>>(
    `/products/${productId}/preorder`,
    payload ?? {},
  );
  return data.data.preorder;
}

export async function fetchVendorPreorders(
  page = 1,
  perPage = 15,
  status = 'pending',
): Promise<PaginatedVendorPreorders> {
  const { data } = await apiClient.get<ApiSuccessResponse<PaginatedVendorPreorders>>(
    '/dashboard/vendor/preorders',
    { params: { page, per_page: perPage, status } },
  );
  return data.data;
}

export async function cancelVendorPreorder(preorderId: string): Promise<ProductPreorderRequest> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<{ preorder: ProductPreorderRequest }>>(
    `/dashboard/vendor/preorders/${preorderId}/cancel`,
  );
  return data.data.preorder;
}
