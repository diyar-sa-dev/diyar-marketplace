import { createAdminListPage } from '../components/createAdminListPage.tsx';
import { AdminStatusBadge } from '../components/AdminStatusBadge.tsx';

export default createAdminListPage({
  titleKey: 'admin.nav.payments',
  subtitleKey: 'admin.payments.subtitle',
  emptyKey: 'admin.payments.empty',
  searchPlaceholderKey: 'admin.tables.searchPayments',
  resourceKey: 'admin-payments',
  endpoint: '/admin/payments',
  itemsKey: 'payments',
  detailPath: (item) => `/admin/payments/${String(item.id)}`,
  columns: [
    { key: 'id', labelKey: 'admin.tables.reference' },
    {
      key: 'status',
      labelKey: 'admin.tables.status',
      render: (item) => <AdminStatusBadge status={String(item.status)} />,
    },
    { key: 'amount', labelKey: 'admin.tables.amount' },
    { key: 'gateway', labelKey: 'admin.tables.gateway' },
  ],
});
