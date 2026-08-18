import { useQuery } from '@tanstack/react-query';
import { fetchCustomerReviewDetail } from '../../api/customerReviews.ts';

export function useCustomerReviewDetail(type: 'product' | 'store', id: string | undefined) {
  return useQuery({
    queryKey: ['customer-reviews', 'detail', type, id],
    queryFn: () => fetchCustomerReviewDetail(type, id!),
    enabled: Boolean(id),
  });
}
