import { apiClient } from './client.ts';
import { ensureCsrfCookie } from '../lib/csrf.ts';
import type { ApiSuccessResponse } from '../types/api.ts';
import type { PaginationMeta } from '../types/services.ts';

export interface ProviderReviewCustomer {
  name?: string;
  avatar_url?: string | null;
}

export interface ProviderReviewServiceRef {
  id: string;
  title: string;
  slug: string;
}

export interface ProviderReview {
  id: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  customer?: ProviderReviewCustomer;
  service?: ProviderReviewServiceRef;
  provider_response?: string | null;
  provider_responded_at?: string | null;
  provider_responded_by?: string | null;
  is_owner?: boolean;
  can_reply?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProviderReviewDistribution {
  stars: number;
  count: number;
  percentage: number;
}

export interface ProviderReviewSummary {
  average_rating: number | null;
  review_count: number;
  distribution: ProviderReviewDistribution[];
}

export interface PaginatedProviderReviews {
  items: ProviderReview[];
  pagination: PaginationMeta;
  summary: ProviderReviewSummary;
}

export async function fetchProviderReviews(
  slug: string,
  page = 1,
  perPage = 10,
): Promise<PaginatedProviderReviews> {
  const { data } = await apiClient.get<ApiSuccessResponse<PaginatedProviderReviews>>(
    `/providers/${slug}/reviews`,
    { params: { page, per_page: perPage } },
  );
  return data.data;
}

export async function fetchProviderReviewInbox(
  page = 1,
  perPage = 10,
): Promise<PaginatedProviderReviews> {
  const { data } = await apiClient.get<ApiSuccessResponse<PaginatedProviderReviews>>(
    '/dashboard/provider/reviews',
    { params: { page, per_page: perPage } },
  );
  return data.data;
}

export async function submitProviderReview(
  bookingId: string,
  payload: { rating: number; title?: string; comment?: string },
): Promise<ProviderReview> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<{ review: ProviderReview }>>(
    `/service-bookings/${bookingId}/review`,
    payload,
  );
  return data.data.review;
}

export async function updateProviderReview(
  reviewId: string,
  payload: { rating: number; title?: string; comment?: string },
): Promise<ProviderReview> {
  await ensureCsrfCookie();
  const { data } = await apiClient.patch<ApiSuccessResponse<{ review: ProviderReview }>>(
    `/provider-reviews/${reviewId}`,
    payload,
  );
  return data.data.review;
}

export async function respondToProviderReview(
  reviewId: string,
  response: string,
): Promise<ProviderReview> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<{ review: ProviderReview }>>(
    `/provider-reviews/${reviewId}/response`,
    { response },
  );
  return data.data.review;
}
