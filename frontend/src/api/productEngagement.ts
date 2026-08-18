import { apiClient } from './client.ts';
import { ensureCsrfCookie } from '../lib/csrf.ts';
import type { ApiSuccessResponse } from '../types/api.ts';
import type { PaginationMeta } from '../types/catalog.ts';

export interface ProductReview {
  id: string;
  rating: number;
  comment: string | null;
  author_name?: string;
  author_avatar_url?: string | null;
  is_owner?: boolean;
  vendor_reply?: string | null;
  vendor_replied_at?: string | null;
  vendor_replied_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedReviews {
  items: ProductReview[];
  pagination: PaginationMeta;
  my_review?: ProductReview | null;
  vendor_store?: {
    name: string;
    logo_url?: string | null;
  } | null;
}

export async function fetchProductReviews(
  productId: string,
  page = 1,
  perPage = 5,
): Promise<PaginatedReviews> {
  const { data } = await apiClient.get<ApiSuccessResponse<PaginatedReviews>>(
    `/products/${productId}/reviews`,
    { params: { page, per_page: perPage } },
  );
  return data.data;
}

export async function toggleProductLike(
  productId: string,
): Promise<{ liked: boolean; likes_count: number }> {
  const { data } = await apiClient.post<
    ApiSuccessResponse<{ liked: boolean; likes_count: number }>
  >(`/products/${productId}/like`);
  return data.data;
}

export async function toggleProductWishlist(productId: string): Promise<{ saved: boolean }> {
  const { data } = await apiClient.post<ApiSuccessResponse<{ saved: boolean }>>(
    `/products/${productId}/wishlist`,
  );
  return data.data;
}

async function withCsrf<T>(action: () => Promise<T>): Promise<T> {
  await ensureCsrfCookie();
  return action();
}

export async function submitProductReview(
  productId: string,
  payload: { rating: number; comment?: string },
): Promise<ProductReview> {
  const { data } = await withCsrf(() =>
    apiClient.post<ApiSuccessResponse<{ review: ProductReview }>>(
      `/products/${productId}/reviews`,
      payload,
    ),
  );
  return data.data.review;
}

export async function updateProductReview(
  productId: string,
  payload: { rating: number; comment?: string },
): Promise<ProductReview> {
  const { data } = await withCsrf(() =>
    apiClient.patch<ApiSuccessResponse<{ review: ProductReview }>>(
      `/products/${productId}/reviews`,
      payload,
    ),
  );
  return data.data.review;
}

export async function deleteProductReview(productId: string): Promise<void> {
  await withCsrf(() => apiClient.delete(`/products/${productId}/reviews`));
}
