import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as shippingApi from '../../../api/shippingSettings.ts';
import type { VendorShippingSettingsPayload } from '../../../types/shipping.ts';

export const shippingSettingsKeys = {
  all: ['shipping-settings'] as const,
  detail: () => [...shippingSettingsKeys.all, 'detail'] as const,
};

export function useVendorShippingSettings() {
  return useQuery({
    queryKey: shippingSettingsKeys.detail(),
    queryFn: shippingApi.fetchVendorShippingSettings,
  });
}

export function useUpdateVendorShippingSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: VendorShippingSettingsPayload) =>
      shippingApi.updateVendorShippingSettings(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: shippingSettingsKeys.all }),
  });
}
