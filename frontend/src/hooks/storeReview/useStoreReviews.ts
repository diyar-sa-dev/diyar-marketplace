import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as storeReviewApi from '../../api/storeReviews.ts';
import { orderKeys } from '../checkout/useCheckout.ts';
import { customerReviewKeys } from '../reviews/useCustomerReviews.ts';

export const storeReviewKeys = {
  list: (slug: string, page: number, perPage: number) =>
    ['store-reviews', slug, page, perPage] as const,
  eligibility: (orderId: string) => ['store-review-eligibility', orderId] as const,
};

export function useStoreReviews(slug: string | undefined, page = 1, perPage = 5) {
  return useQuery({
    queryKey: storeReviewKeys.list(slug ?? '', page, perPage),
    queryFn: () => storeReviewApi.fetchStoreReviews(slug!, page, perPage),
    enabled: Boolean(slug),
  });
}

export function useOrderStoreReviewEligibility(orderId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: storeReviewKeys.eligibility(orderId ?? ''),
    queryFn: () => storeReviewApi.fetchOrderStoreReviewEligibility(orderId!),
    enabled: Boolean(orderId) && enabled,
  });
}

export function useSubmitStoreReview(slug: string, orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { rating: number; comment?: string }) =>
      storeReviewApi.submitStoreReview(slug, {
        order_id: orderId,
        rating: payload.rating,
        comment: payload.comment,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['store-reviews', slug] });
      void queryClient.invalidateQueries({ queryKey: storeReviewKeys.eligibility(orderId) });
      void queryClient.invalidateQueries({ queryKey: orderKeys.list() });
      void queryClient.invalidateQueries({ queryKey: ['vendors'] });
      void queryClient.invalidateQueries({ queryKey: customerReviewKeys.all });
    },
  });
}
