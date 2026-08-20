import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchVendorReturnPolicy,
  updateVendorReturnPolicy,
  vendorReturnAction,
  fetchVendorReturns,
} from '../../api/returns.ts';
import type { VendorReturnPolicyPayload } from '../../types/return.ts';

export const vendorReturnKeys = {
  all: ['vendor-returns'] as const,
  list: (status: string, page = 1, perPage = 10) =>
    [...vendorReturnKeys.all, 'list', status, page, perPage] as const,
  policy: ['vendor-return-policy'] as const,
};

export function useVendorReturns(status = 'all', page = 1, perPage = 10) {
  return useQuery({
    queryKey: vendorReturnKeys.list(status, page, perPage),
    queryFn: () => fetchVendorReturns(page, status, perPage),
  });
}

export function useVendorReturnActions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      returnId,
      action,
      body,
    }: {
      returnId: string;
      action: 'submit-review' | 'approve' | 'reject' | 'received' | 'inspect' | 'refund';
      body?: Record<string, unknown>;
    }) => vendorReturnAction(returnId, action, body ?? {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vendorReturnKeys.all });
    },
  });
}

export function useVendorReturnPolicy() {
  return useQuery({
    queryKey: vendorReturnKeys.policy,
    queryFn: fetchVendorReturnPolicy,
  });
}

export function useUpdateVendorReturnPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: VendorReturnPolicyPayload) => updateVendorReturnPolicy(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vendorReturnKeys.policy });
    },
  });
}
