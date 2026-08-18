import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as customerReviewsApi from '../../api/customerReviews.ts';
import type {
  CustomerReviewFilterType,
  CustomerReviewStatus,
  CustomerReviewsQuery,
} from '../../api/customerReviews.ts';

export const customerReviewKeys = {
  all: ['customer-reviews'] as const,
  list: (query: CustomerReviewsQuery) => [...customerReviewKeys.all, query] as const,
  summary: () => [...customerReviewKeys.all, 'summary'] as const,
};

export function useCustomerReviews(
  status: CustomerReviewStatus,
  type: CustomerReviewFilterType,
  page: number,
  perPage = 10,
) {
  const query: CustomerReviewsQuery = { status, type, page, per_page: perPage };

  return useQuery({
    queryKey: customerReviewKeys.list(query),
    queryFn: () => customerReviewsApi.fetchCustomerReviews(query),
  });
}

export function useInvalidateCustomerReviews() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: customerReviewKeys.all });
  };
}
