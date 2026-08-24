import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteProductReview,
  fetchProductReviews,
  submitProductReview,
  toggleProductLike,
  toggleProductWishlist,
  updateProductReview,
} from '../../api/productEngagement.ts';
import { wishlistKeys } from '../profile/queryKeys.ts';
import { customerReviewKeys } from '../reviews/useCustomerReviews.ts';
import { productKeys } from './queryKeys.ts';

export const reviewKeys = {
  list: (productId: string, page: number) => ['product-reviews', productId, page] as const,
};

export function useProductReviews(productId: string | undefined, page = 1) {
  return useQuery({
    queryKey: reviewKeys.list(productId ?? '', page),
    queryFn: () => fetchProductReviews(productId!, page),
    enabled: Boolean(productId),
    staleTime: 60_000,
  });
}

export function useProductEngagementMutations(productId: string | undefined) {
  const queryClient = useQueryClient();

  const invalidateProduct = () => {
    if (productId) {
      void queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) });
      void queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
      void queryClient.invalidateQueries({ queryKey: customerReviewKeys.all });
    }
  };

  const like = useMutation({
    mutationFn: () => toggleProductLike(productId!),
    onSuccess: invalidateProduct,
  });

  const wishlist = useMutation({
    mutationFn: () => toggleProductWishlist(productId!),
    onSuccess: () => {
      invalidateProduct();
      void queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
    },
  });

  const review = useMutation({
    mutationFn: (payload: { rating: number; comment?: string }) =>
      submitProductReview(productId!, payload),
    onSuccess: invalidateProduct,
  });

  const updateReview = useMutation({
    mutationFn: (payload: { rating: number; comment?: string }) =>
      updateProductReview(productId!, payload),
    onSuccess: invalidateProduct,
  });

  const deleteReview = useMutation({
    mutationFn: () => deleteProductReview(productId!),
    onSuccess: invalidateProduct,
  });

  return { like, wishlist, review, updateReview, deleteReview };
}
