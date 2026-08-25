import { apiClient } from './client.ts';
import { ensureCsrfCookie } from '../lib/csrf.ts';
import type { ApiSuccessResponse } from '../types/api.ts';
import type { PaginationMeta } from '../types/catalog.ts';

export interface B2bCompanyReview {
  id: string;
  rating: number;
  comment: string | null;
  author_name?: string;
  author_avatar_url?: string | null;
  is_owner?: boolean;
  company_reply?: string | null;
  company_replied_at?: string | null;
  project_type?: string | null;
  created_at?: string | null;
}

export interface B2bCompanyReviewsResponse {
  items: B2bCompanyReview[];
  pagination: PaginationMeta;
}

export async function fetchB2bCompanyReviews(
  slug: string,
  page = 1,
  perPage = 5,
): Promise<B2bCompanyReviewsResponse> {
  const { data } = await apiClient.get<ApiSuccessResponse<B2bCompanyReviewsResponse>>(
    `/b2b/companies/${slug}/reviews`,
    { params: { page, per_page: perPage } },
  );
  return data.data;
}

export async function submitB2bCompanyReview(
  slug: string,
  payload: { b2b_lead_id: string; rating: number; comment?: string },
): Promise<B2bCompanyReview> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<{ review: B2bCompanyReview }>>(
    `/b2b/companies/${slug}/reviews`,
    payload,
  );
  return data.data.review;
}

export async function fetchPartnerB2bReviews(
  portal: 'vendor' | 'provider',
  page = 1,
  perPage = 10,
): Promise<B2bCompanyReviewsResponse> {
  const base =
    portal === 'vendor' ? '/dashboard/vendor/b2b/reviews' : '/dashboard/service/b2b/reviews';
  const { data } = await apiClient.get<ApiSuccessResponse<B2bCompanyReviewsResponse>>(base, {
    params: { page, per_page: perPage },
  });
  return data.data;
}
