import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as vendorReviewInboxApi from '../../api/vendorReviewInbox.ts';

export const vendorReviewInboxKeys = {
  all: ['vendor-review-inbox'] as const,
  list: (page: number, perPage: number, type?: 'product' | 'store') =>
    [...vendorReviewInboxKeys.all, page, perPage, type ?? 'all'] as const,
};

export function useVendorReviewInbox(page = 1, perPage = 10, type?: 'product' | 'store') {
  return useQuery({
    queryKey: vendorReviewInboxKeys.list(page, perPage, type),
    queryFn: () => vendorReviewInboxApi.fetchVendorReviewInbox(page, perPage, type),
  });
}

export function useReplyVendorReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      type,
      reviewId,
      reply,
    }: {
      type: 'product' | 'store';
      reviewId: string;
      reply: string;
    }) => vendorReviewInboxApi.replyVendorReview(type, reviewId, reply),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: vendorReviewInboxKeys.all });
    },
  });
}
