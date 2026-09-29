import { createAdminListPage } from '../components/createAdminListPage.tsx';
import { AdminStatusBadge } from '../components/AdminStatusBadge.tsx';

type AdminCouponListItem = {
  id: string;
  code: string;
  type: string;
  value: number;
  fixed_amount?: string | null;
  is_active: boolean;
  effective_status?: string;
  vendor_account?: { id?: string; business_name?: string } | null;
};

export default createAdminListPage<AdminCouponListItem>({
  titleKey: 'admin.nav.coupons',
  subtitleKey: 'admin.coupons.subtitle',
  emptyKey: 'admin.coupons.empty',
  searchPlaceholderKey: 'admin.tables.searchCoupons',
  resourceKey: 'admin-coupons',
  endpoint: '/admin/coupons',
  itemsKey: 'coupons',
  detailPath: (item) => `/admin/coupons/${String(item.id)}`,
  columns: [
    { key: 'code', labelKey: 'admin.tables.code' },
    {
      key: 'vendor',
      labelKey: 'admin.tables.business',
      render: (item) => <span>{item.vendor_account?.business_name ?? '—'}</span>,
    },
    {
      key: 'type',
      labelKey: 'admin.tables.type',
      render: (item) => <span className="capitalize">{item.type}</span>,
    },
    {
      key: 'amount',
      labelKey: 'admin.tables.amount',
      render: (item) => (
        <span className="font-semibold tabular-nums">
          {item.type === 'free_shipping'
            ? 'Free shipping'
            : item.type === 'fixed'
              ? `${item.fixed_amount ?? item.value} SAR`
              : `${item.value}%`}
        </span>
      ),
    },
    {
      key: 'is_active',
      labelKey: 'admin.tables.status',
      render: (item) => (
        <AdminStatusBadge status={item.effective_status ?? (item.is_active ? 'active' : 'inactive')} />
      ),
    },
  ],
});
