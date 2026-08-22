import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { adminApi } from '../../api/client.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { AdminPageSkeleton } from '../components/AdminPageSkeleton.tsx';
import { AdminStatusBadge } from '../components/AdminStatusBadge.tsx';
import { DetailHeader } from '../components/DetailHeader.tsx';
import { PermissionGate } from '../components/PermissionGate.tsx';
import { useAdminDetailQuery } from '../hooks/useAdminDetailQuery.ts';

type RefundDetail = {
  id: string;
  reference: string;
  status: string;
  reason: string;
  customer_note?: string | null;
  vendor_note?: string | null;
  order_id?: string;
  order_number?: string;
  vendor_name?: string;
  created_at?: string;
};

export default function AdminRefundDetailPage() {
  const { refundId } = useParams<{ refundId: string }>();
  const { t } = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: refund,
    isLoading,
    isError,
  } = useAdminDetailQuery<RefundDetail>({
    resourceKey: 'admin-refund-detail',
    endpoint: `/admin/return-requests/${refundId}`,
    dataKey: 'return_request',
    enabled: Boolean(refundId),
  });

  const mutation = useMutation({
    mutationFn: async (action: string) =>
      adminApi.post(`/admin/return-requests/${refundId}/${action}`),
    onSuccess: async () => {
      toast.success(t('admin.refunds.updated'));
      await queryClient.invalidateQueries({ queryKey: ['admin-refund-detail'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-refunds'] });
    },
    onError: () => toast.error(t('admin.refunds.updateError')),
  });

  if (isLoading) return <AdminPageSkeleton />;

  if (isError || !refund) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
        {t('admin.refunds.loadError')}
      </div>
    );
  }

  const status = refund.status;
  const canApprove = ['requested', 'under_review'].includes(status);
  const canReject = ['requested', 'under_review'].includes(status);
  const canMarkReceived = ['approved', 'awaiting_return'].includes(status);
  const canMarkInspected = status === 'received';
  const canProcessRefund = status === 'inspected';

  return (
    <div className="space-y-6">
      <DetailHeader
        backTo="/admin/refunds"
        backLabel={t('admin.detail.backToRefunds')}
        title={refund.reference}
        subtitle={refund.reason}
        status={refund.status}
        actions={
          <PermissionGate permission="refunds.approve">
            <div className="flex flex-wrap gap-2">
              {canApprove ? (
                <button
                  type="button"
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate('approve')}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 cursor-pointer"
                >
                  {t('admin.refunds.approve')}
                </button>
              ) : null}
              {canReject ? (
                <button
                  type="button"
                  disabled={mutation.isPending}
                  onClick={() => {
                    if (window.confirm(t('admin.refunds.rejectConfirm'))) {
                      mutation.mutate('reject');
                    }
                  }}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 cursor-pointer"
                >
                  {t('admin.refunds.reject')}
                </button>
              ) : null}
              {canMarkReceived ? (
                <button
                  type="button"
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate('mark-received')}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 cursor-pointer"
                >
                  {t('admin.refunds.markReceived')}
                </button>
              ) : null}
              {canMarkInspected ? (
                <button
                  type="button"
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate('mark-inspected')}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 cursor-pointer"
                >
                  {t('admin.refunds.markInspected')}
                </button>
              ) : null}
              {canProcessRefund ? (
                <button
                  type="button"
                  disabled={mutation.isPending}
                  onClick={() => {
                    if (window.confirm(t('admin.refunds.processConfirm'))) {
                      mutation.mutate('process-refund');
                    }
                  }}
                  className="rounded-xl bg-diyar-dark px-4 py-2 text-sm font-semibold text-white cursor-pointer"
                >
                  {t('admin.refunds.processRefund')}
                </button>
              ) : null}
            </div>
          </PermissionGate>
        }
      />

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {t('admin.tables.status')}
            </dt>
            <dd className="mt-1">
              <AdminStatusBadge status={refund.status} />
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {t('admin.tables.reason')}
            </dt>
            <dd className="mt-1 text-gray-700">{refund.reason}</dd>
          </div>
          {refund.order_id ? (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t('admin.nav.orders')}
              </dt>
              <dd className="mt-1">
                <Link
                  to={`/admin/orders/${refund.order_id}`}
                  className="font-semibold text-diyar-brown hover:text-diyar-dark"
                >
                  {refund.order_number ?? refund.order_id.slice(0, 8)}
                </Link>
              </dd>
            </div>
          ) : null}
          {refund.vendor_name ? (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t('admin.nav.vendors')}
              </dt>
              <dd className="mt-1 text-gray-700">{refund.vendor_name}</dd>
            </div>
          ) : null}
          {refund.customer_note ? (
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t('admin.refunds.customerNote')}
              </dt>
              <dd className="mt-1 text-gray-700">{refund.customer_note}</dd>
            </div>
          ) : null}
        </dl>
      </div>
    </div>
  );
}
