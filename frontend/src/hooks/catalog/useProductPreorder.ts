import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as productPreorderApi from '../../api/productPreorder.ts';

export function useSubmitProductPreorder(productId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload?: { selected_color?: { name?: string; hex_code?: string } | null }) => {
      if (!productId) {
        throw new Error('Product id required');
      }
      return productPreorderApi.submitProductPreorder(productId, payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['product', productId] });
      void queryClient.invalidateQueries({ queryKey: ['vendor-preorders'] });
      void queryClient.invalidateQueries({ queryKey: ['vendor-dashboard-overview'] });
    },
  });
}

export function useVendorPreorders(page = 1, status = 'pending', perPage = 15) {
  return useQuery({
    queryKey: ['vendor-preorders', page, status, perPage],
    queryFn: () => productPreorderApi.fetchVendorPreorders(page, perPage, status),
  });
}

export function useCancelVendorPreorder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productPreorderApi.cancelVendorPreorder,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['vendor-preorders'] });
      void queryClient.invalidateQueries({ queryKey: ['vendor-dashboard-overview'] });
    },
  });
}
