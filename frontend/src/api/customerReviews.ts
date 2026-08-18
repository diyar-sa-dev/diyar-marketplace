import { apiClient } from './client.ts';
import type { ApiSuccessResponse } from '../types/api.ts';
import type { PaginationMeta } from '../types/catalog.ts';

export type CustomerReviewType = 'product' | 'store' | 'service';
export type CustomerReviewStatus = 'published' | 'pending';
export type CustomerReviewFilterType = 'all' | CustomerReviewType;

export interface CustomerReviewSummary {
  published_count: number;
  pending_count: number;
  published_by_type: Record<CustomerReviewType, number>;
  pending_by_type: Record<CustomerReviewType, number>;
}

export interface CustomerReviewProductSubject {
  id: string | null;
  name: string | null;
  slug: string | null;
  image_url: string | null;
  available: boolean;
}

export interface CustomerReviewStoreSubject {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

export interface PublishedCustomerReview {
  type: Exclude<CustomerReviewType, 'service'>;
  id: string;
  rating: number;
  comment: string | null;
  created_at: string | null;
  updated_at?: string | null;
  vendor_reply?: string | null;
  vendor_replied_at?: string | null;
  vendor_replied_by?: string | null;
  product?: CustomerReviewProductSubject | null;
  store?: CustomerReviewStoreSubject | null;
  order_id?: string | null;
  order_number?: string | null;
}

export interface PendingCustomerReview {
  type: Exclude<CustomerReviewType, 'service'>;
  pending_key: string;
  sort_at?: string | null;
  order_id?: string | null;
  order_number?: string | null;
  order_item_id?: string;
  vendor_order_id?: string;
  product?: CustomerReviewProductSubject | null;
  store?: CustomerReviewStoreSubject | null;
}

export type CustomerReviewItem = PublishedCustomerReview | PendingCustomerReview;

export interface CustomerReviewsResponse {
  summary: CustomerReviewSummary;
  items: CustomerReviewItem[];
  pagination: PaginationMeta;
}

export interface CustomerReviewsQuery {
  status?: CustomerReviewStatus;
  type?: CustomerReviewFilterType;
  page?: number;
  per_page?: number;
}

export async function fetchCustomerReviews(
  query: CustomerReviewsQuery = {},
): Promise<CustomerReviewsResponse> {
  const { data } = await apiClient.get<ApiSuccessResponse<CustomerReviewsResponse>>(
    '/profile/reviews',
    {
      params: {
        status: query.status ?? 'published',
        type: query.type ?? 'all',
        page: query.page ?? 1,
        per_page: query.per_page ?? 10,
      },
    },
  );
  return data.data;
}

export async function fetchCustomerReviewDetail(
  type: Exclude<CustomerReviewType, 'service'>,
  id: string,
): Promise<PublishedCustomerReview> {
  const { data } = await apiClient.get<ApiSuccessResponse<{ review: PublishedCustomerReview }>>(
    `/profile/reviews/${type}/${id}`,
  );
  return data.data.review;
}
