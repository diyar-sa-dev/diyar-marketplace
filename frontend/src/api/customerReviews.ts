import { apiClient } from './client.ts';
import type { ApiSuccessResponse } from '../types/api.ts';
import type { PaginationMeta } from '../types/catalog.ts';

export type CustomerReviewType = 'product' | 'store' | 'service' | 'b2b';
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

export interface CustomerReviewServiceSubject {
  id: string;
  title: string;
  slug: string;
}

export interface CustomerReviewB2bSubject {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

export interface CustomerReviewProviderSubject {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

interface BasePublishedCustomerReview {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string | null;
  updated_at?: string | null;
}

export interface PublishedProductCustomerReview extends BasePublishedCustomerReview {
  type: 'product';
  vendor_reply?: string | null;
  vendor_replied_at?: string | null;
  vendor_replied_by?: string | null;
  product?: CustomerReviewProductSubject | null;
  store?: CustomerReviewStoreSubject | null;
  order_id?: string | null;
  order_number?: string | null;
}

export interface PublishedStoreCustomerReview extends BasePublishedCustomerReview {
  type: 'store';
  vendor_reply?: string | null;
  vendor_replied_at?: string | null;
  vendor_replied_by?: string | null;
  store?: CustomerReviewStoreSubject | null;
  order_id?: string | null;
  order_number?: string | null;
}

export interface PublishedServiceCustomerReview extends BasePublishedCustomerReview {
  type: 'service';
  title?: string | null;
  provider_response?: string | null;
  provider_responded_at?: string | null;
  provider_responded_by?: string | null;
  service?: CustomerReviewServiceSubject | null;
  provider?: CustomerReviewProviderSubject | null;
  booking_id?: string | null;
  booking_reference?: string | null;
}

export interface PublishedB2bCustomerReview extends BasePublishedCustomerReview {
  type: 'b2b';
  company_reply?: string | null;
  company_replied_at?: string | null;
  company_replied_by?: string | null;
  company?: CustomerReviewB2bSubject | null;
  b2b_lead_id?: string | null;
  project_type?: string | null;
}

export type PublishedCustomerReview =
  | PublishedProductCustomerReview
  | PublishedStoreCustomerReview
  | PublishedServiceCustomerReview
  | PublishedB2bCustomerReview;

export interface PendingProductCustomerReview {
  type: 'product';
  pending_key: string;
  sort_at?: string | null;
  order_id?: string | null;
  order_number?: string | null;
  order_item_id?: string;
  product?: CustomerReviewProductSubject | null;
}

export interface PendingStoreCustomerReview {
  type: 'store';
  pending_key: string;
  sort_at?: string | null;
  order_id?: string | null;
  order_number?: string | null;
  vendor_order_id?: string;
  store?: CustomerReviewStoreSubject | null;
}

export interface PendingServiceCustomerReview {
  type: 'service';
  pending_key: string;
  sort_at?: string | null;
  booking_id?: string | null;
  booking_reference?: string | null;
  service?: CustomerReviewServiceSubject | null;
  provider?: CustomerReviewProviderSubject | null;
}

export interface PendingB2bCustomerReview {
  type: 'b2b';
  pending_key: string;
  sort_at?: string | null;
  b2b_lead_id?: string | null;
  project_type?: string | null;
  company?: CustomerReviewB2bSubject | null;
}

export type PendingCustomerReview =
  | PendingProductCustomerReview
  | PendingStoreCustomerReview
  | PendingServiceCustomerReview
  | PendingB2bCustomerReview;

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
  type: CustomerReviewType,
  id: string,
): Promise<PublishedCustomerReview> {
  const { data } = await apiClient.get<ApiSuccessResponse<{ review: PublishedCustomerReview }>>(
    `/profile/reviews/${type}/${id}`,
  );
  return data.data.review;
}
