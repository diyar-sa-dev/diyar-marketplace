import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as providerReviewApi from '../../api/providerReviews.ts';

export const providerReviewKeys = {
  public: (slug: string, page: number, perPage: number) =>
    ['provider-reviews', slug, page, perPage] as const,
  inbox: (page: number, perPage: number) => ['provider-review-inbox', page, perPage] as const,
};

export function useProviderReviews(slug: string | undefined, page = 1, perPage = 10) {
  return useQuery({
    queryKey: providerReviewKeys.public(slug ?? '', page, perPage),
    queryFn: () => providerReviewApi.fetchProviderReviews(slug!, page, perPage),
    enabled: Boolean(slug),
  });
}

export function useProviderReviewInbox(page = 1, perPage = 10) {
  return useQuery({
    queryKey: providerReviewKeys.inbox(page, perPage),
    queryFn: () => providerReviewApi.fetchProviderReviewInbox(page, perPage),
  });
}

export function useSubmitProviderReview(bookingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { rating: number; title?: string; comment?: string }) =>
      providerReviewApi.submitProviderReview(bookingId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['provider-reviews'] });
      void queryClient.invalidateQueries({ queryKey: ['provider-review-inbox'] });
      void queryClient.invalidateQueries({ queryKey: ['customer-service-bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['providers'] });
      void queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
}

export function useRespondToProviderReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, response }: { reviewId: string; response: string }) =>
      providerReviewApi.respondToProviderReview(reviewId, response),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['provider-reviews'] });
      void queryClient.invalidateQueries({ queryKey: ['provider-review-inbox'] });
    },
  });
}
