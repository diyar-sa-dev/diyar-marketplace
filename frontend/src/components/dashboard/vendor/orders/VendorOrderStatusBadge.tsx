import type { VendorOrder } from '../../../../types/order.ts';
import { useLocale } from '../../../../hooks/useLocale.ts';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  accepted: 'bg-blue-100 text-blue-700 border-blue-200',
  processing: 'bg-blue-100 text-blue-700 border-blue-200',
  shipped: 'bg-purple-100 text-purple-700 border-purple-200',
  delivered: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

export function VendorOrderStatusBadge({ status }: { status: VendorOrder['status'] }) {
  const { t } = useLocale();
  const label = t(
    `vendorOrders.statuses.${status as 'pending' | 'accepted' | 'processing' | 'shipped' | 'delivered' | 'cancelled'}`,
  );
  const styles = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${styles}`}>
      {label}
    </span>
  );
}

export function VendorOrderPaymentBadge({ status }: { status?: string | null }) {
  const { t } = useLocale();
  const paymentStatus = status ?? 'pending';

  const styles =
    paymentStatus === 'paid'
      ? 'bg-green-50 text-green-600'
      : paymentStatus === 'refunded'
        ? 'bg-gray-100 text-gray-600'
        : 'bg-red-50 text-red-600';

  const label =
    paymentStatus === 'paid'
      ? t('vendorOrders.payment.paid')
      : paymentStatus === 'refunded'
        ? t('vendorOrders.payment.refunded')
        : t('vendorOrders.payment.unpaid');

  return <span className={`text-xs px-2 py-1 rounded-md font-bold ${styles}`}>{label}</span>;
}
