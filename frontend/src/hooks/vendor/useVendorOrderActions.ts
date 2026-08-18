import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../useToast.ts';
import { useLocale } from '../useLocale.ts';
import * as ordersApi from '../../api/orders.ts';
import { vendorOrderKeys } from './useVendorOrders.ts';
import type { VendorOrderAction } from '../../components/dashboard/vendor/orders/vendorOrderUtils.ts';
import type { VendorOrder } from '../../types/order.ts';

export function useVendorOrderActions(onUpdated?: (order: VendorOrder) => void) {
  const { t } = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      action,
      payload,
    }: {
      orderId: string;
      action: VendorOrderAction;
      payload?: { tracking_number: string; carrier?: string };
    }) => {
      switch (action) {
        case 'accept':
          return ordersApi.acceptVendorOrder(orderId);
        case 'process':
          return ordersApi.processVendorOrder(orderId);
        case 'ship':
          return ordersApi.shipVendorOrder(orderId, payload!);
        case 'deliver':
          return ordersApi.deliverVendorOrder(orderId);
        case 'cancel':
          return ordersApi.cancelVendorOrder(orderId);
      }
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: vendorOrderKeys.all });
      const refreshed = (await ordersApi.fetchVendorOrder(variables.orderId)) as VendorOrder;
      onUpdated?.(refreshed);
      toast.success(t('vendorOrders.actionSuccess'));
    },
    onError: () => {
      toast.error(t('vendorOrders.actionError'));
    },
  });
}
