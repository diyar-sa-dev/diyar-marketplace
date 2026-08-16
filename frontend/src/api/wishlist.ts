import { apiClient } from './client.ts';
import { ensureCsrfCookie } from '../lib/csrf.ts';
import type { ApiSuccessResponse } from '../types/api.ts';
import type { PaginatedProducts } from '../types/catalog.ts';

export async function fetchWishlist(page = 1, perPage = 12): Promise<PaginatedProducts> {
  const { data } = await apiClient.get<ApiSuccessResponse<PaginatedProducts>>('/profile/wishlist', {
    params: { page, per_page: perPage },
  });
  return data.data;
}

export async function clearWishlist(): Promise<{ removed: number }> {
  await ensureCsrfCookie();
  const { data } =
    await apiClient.delete<ApiSuccessResponse<{ removed: number }>>('/profile/wishlist');
  return data.data;
}
