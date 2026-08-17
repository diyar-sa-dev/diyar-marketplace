import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as checkoutApi from '../../api/checkout.ts';
import * as ordersApi from '../../api/orders.ts';
import type { CheckoutPreviewPayload } from '../../types/checkout.ts';

export const checkoutKeys = {
  all: ['checkout'] as const,
  preview: (payload: CheckoutPreviewPayload | null) => [...checkoutKeys.all, 'preview', payload] as const,
};

export const orderKeys = {
  all: ['orders'] as const,
  list: (page = 1) => [...orderKeys.all, 'list', page] as const,
  detail: (id: string) => [...orderKeys.all, 'detail', id] as const,
};

export function useCheckoutPreview(payload: CheckoutPreviewPayload | null, enabled: boolean) {
  return useQuery({
    queryKey: checkoutKeys.preview(payload),
    queryFn: () => checkoutApi.fetchCheckoutPreview(payload!),
    enabled: enabled && payload !== null,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, idempotencyKey }: { payload: CheckoutPreviewPayload; idempotencyKey: string }) =>
      ordersApi.createOrder(payload, idempotencyKey),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

export function useOrders(page = 1) {
  return useQuery({
    queryKey: orderKeys.list(page),
    queryFn: () => ordersApi.fetchOrders(page),
  });
}
