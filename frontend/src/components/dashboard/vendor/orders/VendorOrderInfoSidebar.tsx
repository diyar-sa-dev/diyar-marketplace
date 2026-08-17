import { MapPin } from 'lucide-react';
import { VendorOrderStatusBadge } from './VendorOrderStatusBadge.tsx';
import { buildVendorShippingAddressLines, formatPhoneInternational } from './vendorOrderUtils.ts';
import { formatMemberSince } from '../../../../lib/formatMemberSince.ts';
import { useLocale } from '../../../../hooks/useLocale.ts';
import type { VendorOrder } from '../../../../types/order.ts';

function buildMapQuery(order: VendorOrder): string | null {
  const address = order.shipping_address;
  if (!address) {
    return null;
  }

  const parts = [
    address.city,
    address.district,
    address.street,
    address.building,
    address.apartment,
  ].filter((part) => part && part.trim() !== '' && part !== '—');

  if (parts.length === 0) {
    return null;
  }

  return parts.join(', ');
}

export function VendorOrderInfoSidebar({ order }: { order: VendorOrder }) {
  const { t, locale } = useLocale();
  const customerInitial = order.customer_name?.charAt(0) ?? '?';
  const mapQuery = buildMapQuery(order);
  const addressLines = buildVendorShippingAddressLines(order, locale);
  const memberSince = formatMemberSince(order.customer_member_since, locale);
  const paymentLabel =
    order.payment_method_label ??
    (order.payment_status === 'paid'
      ? t('vendorOrders.payment.paid')
      : t('vendorOrders.payment.unpaid'));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 border-b border-gray-100 pb-4 font-bold text-diyar-dark">
          {t('vendorOrders.orderStatusTitle')}
        </h3>
        <div className="space-y-4">
          <div>
            <div className="mb-1.5 text-xs text-gray-500">{t('vendorOrders.currentStatus')}</div>
            <VendorOrderStatusBadge status={order.status} />
          </div>
          <div>
            <div className="mb-1.5 text-xs text-gray-500">
              {t('vendorOrders.paymentStatusLabel')}
            </div>
            <div className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              {paymentLabel}
            </div>
          </div>
          {order.payment_reference ? (
            <div>
              <div className="mb-1.5 text-xs text-gray-500">
                {t('vendorOrders.confirmationNumber')}
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-1.5 font-mono text-sm font-medium text-gray-700">
                {order.payment_reference}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 border-b border-gray-100 pb-4 font-bold text-diyar-dark">
          {t('vendorOrders.customerInfoTitle')}
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-diyar-brown/10 text-lg font-bold text-diyar-brown">
              {customerInitial}
            </div>
            <div>
              <h4 className="text-sm font-bold text-diyar-dark">{order.customer_name ?? '—'}</h4>
              {memberSince ? <p className="text-xs text-gray-400">{memberSince}</p> : null}
            </div>
          </div>
          {order.customer_phone && order.customer_phone !== '—' ? (
            <div>
              <div className="mb-1 text-xs text-gray-400">{t('vendorOrders.customerPhone')}</div>
              <div className="text-sm font-medium text-gray-700" dir="ltr">
                {formatPhoneInternational(order.customer_phone)}
              </div>
            </div>
          ) : null}
          {order.customer_email ? (
            <div>
              <div className="mb-1 text-xs text-gray-400">{t('vendorOrders.customerEmail')}</div>
              <div className="text-sm font-medium text-gray-700" dir="ltr">
                {order.customer_email}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 border-b border-gray-100 pb-4 font-bold text-diyar-dark">
          {t('vendorOrders.shippingAddressTitle')}
        </h3>
        <div className="space-y-1 text-sm leading-relaxed text-gray-600">
          {addressLines.heading ? (
            <p className="font-bold text-diyar-dark">{addressLines.heading}</p>
          ) : null}
          {addressLines.city ? <p>{addressLines.city}</p> : null}
          {addressLines.districtStreet ? <p>{addressLines.districtStreet}</p> : null}
          {addressLines.buildingApartment ? <p>{addressLines.buildingApartment}</p> : null}
          {!addressLines.heading &&
          !addressLines.city &&
          !addressLines.districtStreet &&
          !addressLines.buildingApartment ? (
            <p>—</p>
          ) : null}
        </div>
        {order.shipping_method === 'pickup' && order.pickup_location_label && (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {t('checkout.pickupAt')}: {order.pickup_location_label}
          </p>
        )}
        {mapQuery ? (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-diyar-brown hover:underline"
          >
            <MapPin size={14} />
            {t('vendorOrders.viewOnMap')}
          </a>
        ) : null}
      </div>
    </div>
  );
}
