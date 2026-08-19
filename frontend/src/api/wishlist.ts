import { apiClient } from './client.ts';
import { ensureCsrfCookie } from '../lib/csrf.ts';
import type { ApiSuccessResponse } from '../types/api.ts';
import type { PaginatedProducts, ProductCard } from '../types/catalog.ts';
import type { ServiceCard } from '../types/services.ts';

export type WishlistKind = 'products' | 'services';

export interface WishlistSummary {
  products: number;
  services: number;
  total: number;
}

export interface PaginatedWishlist<T> {
  kind: WishlistKind;
  items: T[];
  pagination: PaginatedProducts['pagination'];
}

export async function fetchWishlistSummary(): Promise<WishlistSummary> {
  const { data } = await apiClient.get<ApiSuccessResponse<WishlistSummary>>(
    '/profile/wishlist/summary',
  );
  return data.data;
}

export async function fetchWishlist(
  page = 1,
  perPage = 12,
  kind: WishlistKind = 'products',
): Promise<PaginatedWishlist<ProductCard | ServiceCard>> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<PaginatedWishlist<ProductCard | ServiceCard>>
  >('/profile/wishlist', {
    params: { page, per_page: perPage, kind },
  });
  return data.data;
}

export async function clearWishlist(): Promise<{ removed: number }> {
  await ensureCsrfCookie();
  const { data } =
    await apiClient.delete<ApiSuccessResponse<{ removed: number }>>('/profile/wishlist');
  return data.data;
}
