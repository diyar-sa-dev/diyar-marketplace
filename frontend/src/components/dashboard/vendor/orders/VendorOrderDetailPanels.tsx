import { Package, Truck } from 'lucide-react';
import { useLocale } from '../../../../hooks/useLocale.ts';
import type { VendorOrder } from '../../../../types/order.ts';

export function VendorOrderProductsPanel({ order }: { order: VendorOrder }) {
  const { t } = useLocale();
  const items = order.items ?? [];

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 p-6">
        <h3 className="flex items-center gap-2 font-bold text-diyar-dark">
          <Package size={18} className="text-gray-400" />
          {t('vendorOrders.productsTitle', { count: items.length })}
        </h3>
      </div>

      <div className="divide-y divide-gray-100">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 p-6 transition-colors hover:bg-gray-50/30"
          >
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-100">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.product_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                  DIYAR
                </div>
              )}
            </div>
            <div className="flex-1">
              <h4 className="mb-1 font-bold text-diyar-dark">{item.product_name}</h4>
              {(item.category_name || item.color?.name) && (
                <div className="mb-2 text-sm text-gray-500">
                  {item.category_name
                    ? `${t('vendorOrders.categoryLabel')}: ${item.category_name}`
                    : null}
                  {item.category_name && item.color?.name ? ' • ' : null}
                  {item.color?.name ? `${t('vendorOrders.colorLabel')}: ${item.color.name}` : null}
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-diyar-brown tabular-nums">
                  {item.unit_price} {t('common.currency')}
                </span>
                <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-sm">
                  {t('vendorOrders.quantityLabel', { count: item.quantity })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 bg-gray-50/50 p-6 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">{t('vendorOrders.productsSubtotal')}</span>
          <span className="font-bold text-diyar-dark tabular-nums">
            {order.subtotal} {t('common.currency')}
          </span>
        </div>
        {Number(order.shipping_cost) > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{t('vendorOrders.shippingCost')}</span>
            <span className="font-bold text-diyar-dark tabular-nums">
              {order.shipping_cost} {t('common.currency')}
            </span>
          </div>
        )}
        {Number(order.discount_amount) > 0 && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-emerald-800">
                {t('vendorOrders.couponDiscount')}
                {order.coupon_code ? (
                  <span className="ms-1 font-mono text-xs text-emerald-700">{order.coupon_code}</span>
                ) : null}
              </span>
              <span className="font-bold text-emerald-700 tabular-nums">
                -{order.discount_amount} {t('common.currency')}
              </span>
            </div>
            {order.coupon_percent != null && order.coupon_code ? (
              <p className="text-xs text-emerald-700">
                {t('vendorOrders.couponApplied', {
                  code: order.coupon_code,
                  percent: order.coupon_percent,
                })}
              </p>
            ) : null}
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">{t('vendorOrders.vatAmount')}</span>
          <span className="font-bold text-diyar-dark tabular-nums">
            {order.vat_amount} {t('common.currency')}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-gray-200 pt-3">
          <span className="font-bold text-diyar-dark">{t('vendorOrders.orderTotal')}</span>
          <span className="text-2xl font-bold text-diyar-dark tabular-nums">
            {order.vendor_total} {t('common.currency')}
          </span>
        </div>
      </div>
    </div>
  );
}

export function VendorOrderTrackingTimeline({ order }: { order: VendorOrder }) {
  const { t } = useLocale();
  const status = order.status;
  const tracking = order.shipment?.tracking_number;
  const carrier = order.shipment?.carrier;

  const steps = [
    {
      key: 'delivered',
      active: status === 'delivered',
      reached: status === 'delivered',
      color: 'green',
      title: t('vendorOrders.timeline.delivered'),
      hint: status === 'delivered' ? t('vendorOrders.timeline.deliveredHint') : undefined,
    },
    {
      key: 'shipped',
      active: status === 'shipped' || status === 'delivered',
      reached: ['shipped', 'delivered'].includes(status),
      color: 'purple',
      title: t('vendorOrders.timeline.shipped'),
      hint:
        ['shipped', 'delivered'].includes(status) && tracking
          ? t('vendorOrders.timeline.shippedHint', { carrier: carrier ?? '—', tracking })
          : undefined,
    },
    {
      key: 'processing',
      active: ['processing', 'accepted', 'shipped', 'delivered'].includes(status),
      reached: ['processing', 'accepted', 'shipped', 'delivered'].includes(status),
      color: 'blue',
      title: t('vendorOrders.timeline.processing'),
      hint: ['processing', 'accepted', 'shipped', 'delivered'].includes(status)
        ? t('vendorOrders.timeline.processingHint')
        : undefined,
    },
    {
      key: 'placed',
      active: true,
      reached: true,
      color: 'amber',
      title: t('vendorOrders.timeline.placed'),
      hint: t('vendorOrders.timeline.placedHint'),
    },
  ];

  const dotColor = (color: string, reached: boolean) => {
    if (!reached) {
      return 'bg-gray-200';
    }

    if (color === 'green') return 'bg-green-500';
    if (color === 'purple') return 'bg-purple-500';
    if (color === 'blue') return 'bg-blue-500';
    return 'bg-amber-500';
  };

  const textColor = (color: string, reached: boolean) => {
    if (!reached) {
      return 'text-gray-400';
    }

    if (color === 'green') return 'text-green-600';
    if (color === 'purple') return 'text-purple-600';
    if (color === 'blue') return 'text-blue-600';
    return 'text-amber-600';
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="mb-6 flex items-center gap-2 font-bold text-diyar-dark">
        <Truck size={18} className="text-gray-400" />
        {t('vendorOrders.trackingTitle')}
      </h3>

      <div className="relative w-fit space-y-6 ps-4 before:absolute before:inset-y-0 before:inset-s-2.75 before:w-0.5 before:bg-gray-100">
        {steps.map((step) => (
          <div key={step.key} className="relative ps-6">
            <div
              className={`absolute -inset-s-3.5 top-1 h-4 w-4 rounded-full border-4 border-white ${dotColor(step.color, step.reached)}`}
            />
            <h4 className={`font-bold ${textColor(step.color, step.reached)}`}>{step.title}</h4>
            {step.hint && <p className="mt-1 text-xs text-gray-500">{step.hint}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
