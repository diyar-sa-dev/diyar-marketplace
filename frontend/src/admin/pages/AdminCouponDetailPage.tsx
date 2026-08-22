import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { adminApi } from '../../api/client.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { AdminPageSkeleton } from '../components/AdminPageSkeleton.tsx';
import { AdminStatusBadge } from '../components/AdminStatusBadge.tsx';
import { DetailHeader } from '../components/DetailHeader.tsx';
import { PermissionGate } from '../components/PermissionGate.tsx';
import { useAdminDetailQuery } from '../hooks/useAdminDetailQuery.ts';

type CouponDetail = {
  id: string;
  code: string;
  status: string;
  discount_type?: string;
  discount_value?: string;
  vendor_account?: { business_name?: string };
  created_at?: string;
};

export default function AdminCouponDetailPage() {
  const { couponId } = useParams<{ couponId: string }>();
  const { t } = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: coupon,
    isLoading,
    isError,
  } = useAdminDetailQuery<CouponDetail>({
    resourceKey: 'admin-coupon-detail',
    endpoint: `/admin/coupons/${couponId}`,
    dataKey: 'coupon',
    enabled: Boolean(couponId),
  });

  const toggleMutation = useMutation({
    mutationFn: async (action: 'activate' | 'deactivate') =>
      adminApi.post(`/admin/coupons/${couponId}/${action}`),
    onSuccess: async () => {
      toast.success(t('admin.coupons.updated'));
      await queryClient.invalidateQueries({ queryKey: ['admin-coupon-detail'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
    onError: () => toast.error(t('admin.coupons.updateError')),
  });

  if (isLoading) return <AdminPageSkeleton />;

  if (isError || !coupon) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
        {t('admin.coupons.loadError')}
      </div>
    );
  }

  const isActive = coupon.status === 'active';

  return (
    <div className="space-y-6">
      <DetailHeader
        backTo="/admin/coupons"
        backLabel={t('admin.detail.backToCoupons')}
        title={coupon.code}
        subtitle={coupon.vendor_account?.business_name ?? t('admin.nav.coupons')}
        status={coupon.status}
        actions={
          <PermissionGate permission="coupons.manage">
            {isActive ? (
              <button
                type="button"
                disabled={toggleMutation.isPending}
                onClick={() => toggleMutation.mutate('deactivate')}
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 cursor-pointer"
              >
                {t('admin.coupons.deactivate')}
              </button>
            ) : (
              <button
                type="button"
                disabled={toggleMutation.isPending}
                onClick={() => toggleMutation.mutate('activate')}
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 cursor-pointer"
              >
                {t('admin.coupons.activate')}
              </button>
            )}
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
              <AdminStatusBadge status={coupon.status} />
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {t('admin.tables.code')}
            </dt>
            <dd className="mt-1 font-mono font-semibold" dir="ltr">
              {coupon.code}
            </dd>
          </div>
          {coupon.discount_value ? (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t('admin.tables.amount')}
              </dt>
              <dd className="mt-1 tabular-nums" dir="ltr">
                {coupon.discount_value} {coupon.discount_type ?? ''}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>
    </div>
  );
}
