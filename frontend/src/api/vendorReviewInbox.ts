import { apiClient } from './client.ts';
import type { ApiSuccessResponse } from '../types/api.ts';

export type VendorInboxReview = {
  id: string;
  type: 'product' | 'store';
  rating: number;
  comment: string | null;
  vendor_reply?: string | null;
  vendor_replied_at?: string | null;
  vendor_replied_by?: string | null;
  created_at: string | null;
  customer_name: string | null;
  customer_avatar_url?: string | null;
  target_label: string | null;
  target_slug: string | null;
  can_reply: boolean;
  can_edit: boolean;
  can_delete: boolean;
};

type InboxResponse = ApiSuccessResponse<{
  items: VendorInboxReview[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}>;

export async function fetchVendorReviewInbox(page = 1, perPage = 10, type?: 'product' | 'store') {
  const { data } = await apiClient.get<InboxResponse>('/dashboard/vendor/reviews/inbox', {
    params: { page, per_page: perPage, type },
  });
  return data.data;
}

export async function replyVendorReview(
  type: 'product' | 'store',
  reviewId: string,
  reply: string,
) {
  const { data } = await apiClient.post(
    `/dashboard/vendor/reviews/inbox/${type}/${reviewId}/reply`,
    {
      reply,
    },
  );
  return data;
}
