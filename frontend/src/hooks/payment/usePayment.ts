import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as paymentApi from '../../api/payment.ts';
import { orderKeys } from '../checkout/useCheckout.ts';

export const paymentKeys = {
  all: ['payments'] as const,
  order: (orderId: string) => [...paymentKeys.all, 'order', orderId] as const,
};

export function useOrderPayment(orderId: string, enabled = true) {
  return useQuery({
    queryKey: paymentKeys.order(orderId),
    queryFn: () => paymentApi.fetchOrderPayment(orderId),
    enabled: enabled && orderId !== '',
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'paid' || status === 'failed' || status === 'cancelled' || status === 'expired') {
        return false;
      }
      return 3000;
    },
  });
}

export function useInitiatePayment(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (idempotencyKey: string) => paymentApi.initiateOrderPayment(orderId, idempotencyKey),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: paymentKeys.order(orderId) });
    },
  });
}

export function useSubmitPayment(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      idempotencyKey,
      paymentMethod,
    }: {
      sessionId: string;
      idempotencyKey: string;
      paymentMethod?: string | null;
    }) => paymentApi.submitOrderPayment(orderId, sessionId, idempotencyKey, paymentMethod),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: paymentKeys.order(orderId) });
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}
