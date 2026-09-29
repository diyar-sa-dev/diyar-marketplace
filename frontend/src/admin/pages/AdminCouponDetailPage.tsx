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
  type: 'percentage' | 'fixed' | 'free_shipping';
  scope_type?: string;
  is_active: boolean;
  effective_status?: string;
  value: number;
  fixed_amount?: string | null;
  minimum_order?: string | null;
  maximum_discount?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  usage_limit?: number | null;
  usage_limit_per_user?: number | null;
  used_count: number;
  vendor_account?: { id?: string; business_name?: string };
  created_at?: string;
};

export default function AdminCouponDetailPage() {
  const { couponId } = useParams<{ couponId: string }>();
  const { t } = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currency = t('common.currency');

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

  const isActive = coupon.is_active;
  const statusLabel = coupon.effective_status ?? (isActive ? 'active' : 'inactive');

  const discountDisplay =
    coupon.type === 'free_shipping'
      ? t('vendor.coupons.types.free_shipping')
      : coupon.type === 'fixed'
        ? `${coupon.fixed_amount ?? coupon.value} ${currency}`
        : `${coupon.value}%`;

  return (
    <div className="space-y-6">
      <DetailHeader
        backTo="/admin/coupons"
        backLabel={t('admin.detail.backToCoupons')}
        title={coupon.code}
        subtitle={coupon.vendor_account?.business_name ?? t('admin.nav.coupons')}
        status={statusLabel}
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
              <AdminStatusBadge status={statusLabel} />
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
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {t('admin.tables.vendor')}
            </dt>
            <dd className="mt-1 font-semibold text-gray-800">
              {coupon.vendor_account?.business_name ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {t('admin.tables.type')}
            </dt>
            <dd className="mt-1 font-semibold text-gray-800">
              {t(`vendor.coupons.types.${coupon.type ?? 'percentage'}`)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {t('admin.tables.amount')}
            </dt>
            <dd className="mt-1 font-bold text-diyar-brown tabular-nums" dir="ltr">
              {discountDisplay}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {t('vendor.coupons.form.minimumOrder')}
            </dt>
            <dd className="mt-1 tabular-nums text-gray-700" dir="ltr">
              {Number(coupon.minimum_order) > 0 ? `${coupon.minimum_order} ${currency}` : '—'}
            </dd>
          </div>
          {coupon.maximum_discount ? (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t('vendor.coupons.form.maximumDiscount')}
              </dt>
              <dd className="mt-1 tabular-nums text-gray-700" dir="ltr">
                {coupon.maximum_discount} {currency}
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {t('vendor.coupons.form.usageLimit')}
            </dt>
            <dd className="mt-1 tabular-nums text-gray-700" dir="ltr">
              {coupon.used_count} / {coupon.usage_limit ?? '∞'}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
