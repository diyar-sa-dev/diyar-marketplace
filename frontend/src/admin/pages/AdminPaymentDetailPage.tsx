import { Link, useParams } from 'react-router-dom';
import { useLocale } from '../../hooks/useLocale.ts';
import { formatLocaleDateTime } from '../../lib/intlLocale.ts';
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

  return (
    <div className="space-y-6">
      <DetailHeader
        backTo="/admin/payments"
        backLabel={t('admin.detail.backToPayments')}
        title={payment.transaction_id ?? payment.id.slice(0, 12)}
        subtitle={payment.gateway ?? t('admin.nav.payments')}
        status={payment.status}
      />

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {t('admin.tables.status')}
            </dt>
            <dd className="mt-1">
              <AdminStatusBadge status={payment.status} />
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {t('admin.tables.amount')}
            </dt>
            <dd className="mt-1 font-semibold tabular-nums" dir="ltr">
              {payment.amount} {payment.currency ?? ''}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {t('admin.tables.gateway')}
            </dt>
            <dd className="mt-1 text-gray-700">{payment.gateway ?? '—'}</dd>
          </div>
          {payment.order_id ? (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t('admin.nav.orders')}
              </dt>
              <dd className="mt-1">
                <Link
                  to={`/admin/orders/${payment.order_id}`}
                  className="font-semibold text-diyar-brown hover:text-diyar-dark"
                >
                  {payment.order_number ?? payment.order_id.slice(0, 8)}
                </Link>
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {t('admin.tables.createdAt')}
            </dt>
            <dd className="mt-1 text-gray-700">
              {payment.created_at ? formatLocaleDateTime(payment.created_at, locale) : '—'}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
