import { createAdminListPage } from '../components/createAdminListPage.tsx';
import { AdminStatusBadge } from '../components/AdminStatusBadge.tsx';

export default createAdminListPage({
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
    { key: 'type', labelKey: 'admin.tables.type' },
    {
      key: 'is_active',
      labelKey: 'admin.tables.status',
      render: (item) => <AdminStatusBadge status={item.is_active ? 'active' : 'inactive'} />,
    },
  ],
});
