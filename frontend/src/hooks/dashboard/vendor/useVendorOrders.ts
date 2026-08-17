import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ordersApi from '../../../api/orders.ts';
import type { CreateManualVendorOrderPayload, VendorOrderFilters } from '../../../types/order.ts';

export const vendorOrderKeys = {
  all: ['vendor-orders'] as const,
  list: (filters: VendorOrderFilters) => [...vendorOrderKeys.all, 'list', filters] as const,
  detail: (id: string) => [...vendorOrderKeys.all, 'detail', id] as const,
};

export function useVendorOrders(filters: VendorOrderFilters = {}) {
  return useQuery({
    queryKey: vendorOrderKeys.list(filters),
    queryFn: () => ordersApi.fetchVendorOrders(filters),
  });
}

export function useVendorOrder(vendorOrderId: string | null) {
  return useQuery({
    queryKey: vendorOrderKeys.detail(vendorOrderId ?? ''),
    queryFn: () => ordersApi.fetchVendorOrder(vendorOrderId!),
    enabled: Boolean(vendorOrderId),
  });
}

export function useCreateManualVendorOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateManualVendorOrderPayload) => ordersApi.createManualVendorOrder(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vendorOrderKeys.all });
    },
  });
}
