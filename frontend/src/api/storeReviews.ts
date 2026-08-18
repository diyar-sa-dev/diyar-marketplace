import { apiClient } from './client.ts';
import { ensureCsrfCookie } from '../lib/csrf.ts';
import type { ApiSuccessResponse } from '../types/api.ts';
import type { PaginationMeta } from '../types/catalog.ts';

export interface StoreReview {
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

export interface StoreReviewDistribution {
  stars: number;
  count: number;
  percentage: number;
}

export interface StoreReviewSummary {
  average_rating: number | null;
  review_count: number;
  distribution: StoreReviewDistribution[];
}

export interface PaginatedStoreReviews {
  items: StoreReview[];
  pagination: PaginationMeta;
  summary: StoreReviewSummary;
}

export type StoreReviewEligibilityStatus = 'eligible' | 'already_reviewed' | 'not_eligible';

export interface StoreReviewEligibilityItem {
  vendor_account_id: string;
  vendor_order_id: string;
  vendor_name: string | null;
  vendor_slug: string | null;
  status: StoreReviewEligibilityStatus;
  review: Pick<StoreReview, 'id' | 'rating' | 'comment' | 'created_at'> | null;
}

export async function fetchStoreReviews(
  slug: string,
  page = 1,
  perPage = 5,
): Promise<PaginatedStoreReviews> {
  const { data } = await apiClient.get<ApiSuccessResponse<PaginatedStoreReviews>>(
    `/vendors/${slug}/reviews`,
    { params: { page, per_page: perPage } },
  );
  return data.data;
}

export async function fetchOrderStoreReviewEligibility(
  orderId: string,
): Promise<StoreReviewEligibilityItem[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<{ items: StoreReviewEligibilityItem[] }>>(
    `/orders/${orderId}/store-review-eligibility`,
  );
  return data.data.items;
}

export async function submitStoreReview(
  slug: string,
  payload: { order_id: string; rating: number; comment?: string },
): Promise<StoreReview> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<{ review: StoreReview }>>(
    `/vendors/${slug}/reviews`,
    payload,
  );
  return data.data.review;
}

export async function updateStoreReview(
  reviewId: string,
  payload: { rating: number; comment?: string },
): Promise<StoreReview> {
  await ensureCsrfCookie();
  const { data } = await apiClient.patch<ApiSuccessResponse<{ review: StoreReview }>>(
    `/store-reviews/${reviewId}`,
    payload,
  );
  return data.data.review;
}

export async function deleteStoreReview(reviewId: string): Promise<void> {
  await ensureCsrfCookie();
  await apiClient.delete(`/store-reviews/${reviewId}`);
}
