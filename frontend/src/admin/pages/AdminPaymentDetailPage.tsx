import { Calendar, CreditCard, Hash, Package, Receipt } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useLocale } from '../../hooks/useLocale.ts';
import { formatLocaleDateTime } from '../../lib/intlLocale.ts';
import { AdminDetailField } from '../components/AdminDetailField.tsx';
import { AdminPageSkeleton } from '../components/AdminPageSkeleton.tsx';
import { AdminStatusBadge } from '../components/AdminStatusBadge.tsx';
import { DetailHeader } from '../components/DetailHeader.tsx';
import { useAdminDetailQuery } from '../hooks/useAdminDetailQuery.ts';

type PaymentDetail = {
  id: string;
  status: string;
  amount: string;
  currency?: string;
  gateway?: string;
  transaction_id?: string | null;
  order_id?: string;
  order_number?: string;
  created_at?: string;
};

export default function AdminPaymentDetailPage() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const { t, locale } = useLocale();

  const {
    data: payment,
    isLoading,
    isError,
  } = useAdminDetailQuery<PaymentDetail>({
    resourceKey: 'admin-payment-detail',
    endpoint: `/admin/payments/${paymentId}`,
    dataKey: 'payment',
    enabled: Boolean(paymentId),
  });

  if (isLoading) return <AdminPageSkeleton />;

  if (isError || !payment) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
        {t('admin.payments.loadError')}
      </div>
    );
  }

  const displayReference = payment.transaction_id ?? payment.id.slice(0, 12);
  const currency = payment.currency?.trim() || 'SAR';
  const orderReference = payment.order_number ?? payment.order_id?.slice(0, 8);

  return (
    <div className="space-y-6">
      <DetailHeader
        backTo="/admin/payments"
        backLabel={t('admin.detail.backToPayments')}
        title={displayReference}
        subtitle={payment.gateway ?? t('admin.payments.detailSubtitle')}
        status={payment.status}
      />

      <section className="overflow-hidden rounded-3xl border border-diyar-dark/10 bg-linear-to-br from-diyar-dark via-[#2a4f4b] to-diyar-brown p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-white/70">{t('admin.tables.amount')}</p>
            <p className="text-4xl font-extrabold tabular-nums sm:text-5xl" dir="ltr">
              {payment.amount}{' '}
              <span className="text-2xl font-bold text-diyar-cream/90 sm:text-3xl">{currency}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <AdminStatusBadge status={payment.status} />
            {payment.gateway ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white">
                <CreditCard size={16} aria-hidden />
                {payment.gateway}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <h3 className="mb-4 text-base font-bold text-diyar-dark">
          {t('admin.payments.detailSubtitle')}
        </h3>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AdminDetailField label={t('admin.tables.status')} icon={<Receipt size={18} />}>
            <AdminStatusBadge status={payment.status} />
          </AdminDetailField>

          <AdminDetailField label={t('admin.tables.amount')} icon={<CreditCard size={18} />}>
            <span className="font-bold tabular-nums" dir="ltr">
              {payment.amount} {currency}
            </span>
          </AdminDetailField>

          <AdminDetailField
            label={t('admin.payments.gatewayLabel')}
            icon={<CreditCard size={18} />}
          >
            {payment.gateway ?? '—'}
          </AdminDetailField>

          <AdminDetailField label={t('admin.payments.paymentReference')} icon={<Hash size={18} />}>
            <span className="font-mono text-xs break-all" dir="ltr">
              {payment.id}
            </span>
          </AdminDetailField>

          {payment.transaction_id ? (
            <AdminDetailField
              label={t('admin.payments.transactionReference')}
              icon={<Hash size={18} />}
            >
              <span className="font-mono text-xs break-all" dir="ltr">
                {payment.transaction_id}
              </span>
            </AdminDetailField>
          ) : null}

          {orderReference ? (
            <AdminDetailField
              label={t('admin.payments.orderReference')}
              icon={<Package size={18} />}
            >
              <span className="font-mono text-xs" dir="ltr">
                {orderReference}
              </span>
            </AdminDetailField>
          ) : null}

          <AdminDetailField label={t('admin.tables.createdAt')} icon={<Calendar size={18} />}>
            {payment.created_at ? formatLocaleDateTime(payment.created_at, locale) : '—'}
          </AdminDetailField>
        </dl>
      </section>
    </div>
  );
}
