import { AdminTablePagination } from '../components/AdminTablePagination.tsx';
import { AdminResourceTable } from '../components/AdminResourceTable.tsx';
import { AdminStatusBadge } from '../components/AdminStatusBadge.tsx';
import { useAdminListQuery } from '../hooks/useAdminListQuery.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';

type AdminOrder = {
  id: string;
  order_number: string;
  status: string;
  grand_total: string;
  created_at?: string;
};

export default function AdminOrdersPage() {
  const { t } = useLocale();
  const {
    data,
    isLoading,
    isError,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
  } = useAdminListQuery<AdminOrder>({
    resourceKey: 'admin-orders',
    endpoint: '/admin/orders',
    itemsKey: 'orders',
  });

  const orders = data?.items ?? [];
  const meta = data?.meta;

  return (
    <AdminResourceTable
      title={t('admin.nav.orders')}
      subtitle={t('admin.orders.subtitle')}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder={t('admin.tables.searchOrders')}
      filters={
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
        >
          <option value="">{t('admin.tables.allStatuses')}</option>
          <option value="pending">{t('admin.tables.pending')}</option>
          <option value="paid">{t('admin.tables.paid')}</option>
          <option value="cancelled">{t('admin.tables.cancelled')}</option>
        </select>
      }
      isLoading={isLoading}
      isError={isError}
      isEmpty={orders.length === 0}
      emptyTitle={t('admin.orders.empty')}
      columns={
        <tr>
          <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.orderNumber')}</th>
          <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.status')}</th>
          <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.amount')}</th>
          <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.createdAt')}</th>
          <th className="px-4 py-3 text-end font-semibold">{t('admin.tables.actions')}</th>
        </tr>
      }
      footer={
        <AdminTablePagination
          meta={meta}
          page={page}
          onPageChange={setPage}
          isLoading={isLoading}
        />
      }
    >
      {orders.map((order) => (
        <tr key={order.id} className="hover:bg-[#f7f4f1]/50">
          <td className="px-4 py-3 font-mono text-sm font-semibold text-diyar-dark">
            {order.order_number}
          </td>
          <td className="px-4 py-3">
            <AdminStatusBadge status={order.status} />
          </td>
          <td className="px-4 py-3 text-sm text-gray-700">{order.grand_total}</td>
          <td className="px-4 py-3 text-sm text-gray-500">
            {order.created_at ? new Date(order.created_at).toLocaleString() : '—'}
          </td>
          <td className="px-4 py-3">
            <div className="flex justify-end">
              <Link
                to={`/admin/orders/${order.id}`}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:border-diyar-brown hover:text-diyar-brown"
                aria-label={t('admin.tables.view')}
              >
                <Eye size={14} />
                <span className="hidden sm:inline">{t('admin.tables.view')}</span>
              </Link>
            </div>
          </td>
        </tr>
      ))}
    </AdminResourceTable>
  );
}
