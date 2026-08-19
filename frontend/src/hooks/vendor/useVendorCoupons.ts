import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as vendorCouponsApi from '../../api/vendorCoupons.ts';
import type { VendorCouponPayload } from '../../api/vendorCoupons.ts';

export const vendorCouponKeys = {
  all: ['vendor-coupons'] as const,
  list: (page: number) => [...vendorCouponKeys.all, 'list', page] as const,
};

export function useVendorCoupons(page = 1) {
  return useQuery({
    queryKey: vendorCouponKeys.list(page),
    queryFn: () => vendorCouponsApi.fetchVendorCoupons(page),
  });
}

export function useCreateVendorCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: VendorCouponPayload) => vendorCouponsApi.createVendorCoupon(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vendorCouponKeys.all });
    },
  });
}

export function useUpdateVendorCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<VendorCouponPayload> }) =>
      vendorCouponsApi.updateVendorCoupon(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vendorCouponKeys.all });
    },
  });
}

export function useToggleVendorCouponActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      active
        ? vendorCouponsApi.activateVendorCoupon(id)
        : vendorCouponsApi.deactivateVendorCoupon(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vendorCouponKeys.all });
    },
  });
}
