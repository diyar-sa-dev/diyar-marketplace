import { useState } from 'react';
import { CheckCircle, Edit, Eye, Package, Truck, XCircle } from 'lucide-react';
import { useLocale } from '../../../../hooks/useLocale.ts';
import { formatOrderDate } from '../../../../lib/formatOrderDate.ts';
import { VendorOrderPaymentBadge, VendorOrderStatusBadge } from './VendorOrderStatusBadge.tsx';
import { VendorOrderShipModal } from './VendorOrderShipModal.tsx';
import {
  vendorOrderDisplayNumber,
  vendorOrderItemCount,
  type VendorOrderAction,
} from './vendorOrderUtils.ts';
import type { VendorOrder } from '../../../../types/order.ts';

function VendorOrderRowActions({
  order,
  onView,
  onAction,
  isPending,
}: {
  order: VendorOrder;
  onView: () => void;
  onAction: (
    action: VendorOrderAction,
    payload?: { tracking_number: string; carrier?: string },
  ) => void;
  isPending: boolean;
}) {
  const { t } = useLocale();
  const [shipOpen, setShipOpen] = useState(false);

  const runAction = (action: VendorOrderAction) => {
    if (action === 'ship') {
      setShipOpen(true);
      return;
    }
    onAction(action);
  };

  return (
    <>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onView}
          className="cursor-pointer rounded-lg p-2 text-gray-400 transition hover:bg-amber-50 hover:text-diyar-brown"
          title={t('vendorOrders.viewDetails')}
        >
          <Eye size={18} />
        </button>

        {order.status !== 'delivered' && order.status !== 'cancelled' && (
          <div className="group/actions relative">
            <button
              type="button"
              disabled={isPending}
              className="cursor-pointer rounded-lg p-2 text-gray-400 transition hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              title={t('vendorOrders.updateStatus')}
            >
              <Edit size={18} />
            </button>

            <div className="invisible absolute inset-e-0 top-full z-10 mt-1 w-44 rounded-xl border border-gray-100 bg-white py-1 opacity-0 shadow-lg transition-all group-hover/actions:visible group-hover/actions:opacity-100 group-focus-within/actions:visible group-focus-within/actions:opacity-100">
              {order.status === 'pending' && (
                <button
                  type="button"
                  onClick={() => runAction('accept')}
                  className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                >
                  <CheckCircle size={14} /> {t('vendorOrders.actions.accept')}
                </button>
              )}
              {order.status === 'accepted' && (
                <button
                  type="button"
                  onClick={() => runAction('process')}
                  className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                >
                  <Package size={14} /> {t('vendorOrders.actions.process')}
                </button>
              )}
              {order.status === 'processing' && (
                <button
                  type="button"
                  onClick={() => runAction('ship')}
                  className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                >
                  <Truck size={14} /> {t('vendorOrders.actions.ship')}
                </button>
              )}
              {order.status === 'shipped' && (
                <button
                  type="button"
                  onClick={() => runAction('deliver')}
                  className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                >
                  <CheckCircle size={14} /> {t('vendorOrders.actions.deliver')}
                </button>
              )}
              {['pending', 'accepted', 'processing'].includes(order.status) && (
                <>
                  <div className="my-1 border-t border-gray-100" />
                  <button
                    type="button"
                    onClick={() => runAction('cancel')}
                    className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <XCircle size={14} /> {t('vendorOrders.actions.cancel')}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <VendorOrderShipModal
        open={shipOpen}
        onClose={() => setShipOpen(false)}
        onSubmit={(payload) => {
          onAction('ship', payload);
          setShipOpen(false);
        }}
      />
    </>
  );
}

export function VendorOrdersRowList({
  orders,
  onView,
  onAction,
  isPending,
}: {
  orders: VendorOrder[];
  onView: (order: VendorOrder) => void;
  onAction: (
    orderId: string,
    action: VendorOrderAction,
    payload?: { tracking_number: string; carrier?: string },
  ) => void;
  isPending: boolean;
}) {
  const { t, locale } = useLocale();

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <article
          key={order.id}
          className="cursor-pointer rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-diyar-brown/25 hover:shadow-md md:p-0"
          onClick={() => onView(order)}
        >
          <div className="hidden md:grid md:grid-cols-[1.1fr_1fr_0.9fr_0.7fr_0.8fr_0.7fr_0.9fr_0.5fr] md:items-center md:gap-3 md:px-6 md:py-4">
            <div className="font-bold text-diyar-dark tabular-nums">
              {vendorOrderDisplayNumber(order)}
            </div>
            <div className="font-medium text-gray-900">{order.customer_name ?? '—'}</div>
            <div className="text-gray-500">{formatOrderDate(order.created_at, locale)}</div>
            <div className="text-gray-600">
              {t('vendorOrders.itemCount', { count: vendorOrderItemCount(order) })}
            </div>
            <div className="font-bold text-diyar-brown tabular-nums">
              {order.vendor_total} {t('common.currency')}
            </div>
            <div onClick={(event) => event.stopPropagation()}>
              <VendorOrderPaymentBadge status={order.payment_status} />
            </div>
            <div>
              <VendorOrderStatusBadge status={order.status} />
            </div>
            <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
              <VendorOrderRowActions
                order={order}
                onView={() => onView(order)}
                onAction={(action, payload) => onAction(order.id, action, payload)}
                isPending={isPending}
              />
            </div>
          </div>

          <div className="md:hidden space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500">{t('vendorOrders.table.orderNumber')}</p>
                <p className="font-bold text-diyar-dark">{vendorOrderDisplayNumber(order)}</p>
              </div>
              <VendorOrderStatusBadge status={order.status} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">{t('vendorOrders.table.customer')}</p>
                <p className="font-medium">{order.customer_name ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t('vendorOrders.table.total')}</p>
                <p className="font-bold text-diyar-brown">
                  {order.vendor_total} {t('common.currency')}
                </p>
              </div>
            </div>
            <div
              className="flex items-center justify-between border-t border-gray-100 pt-3"
              onClick={(event) => event.stopPropagation()}
            >
              <VendorOrderPaymentBadge status={order.payment_status} />
              <VendorOrderRowActions
                order={order}
                onView={() => onView(order)}
                onAction={(action, payload) => onAction(order.id, action, payload)}
                isPending={isPending}
              />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
