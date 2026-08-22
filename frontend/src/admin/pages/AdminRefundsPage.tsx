import { Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminResourceTable } from '../components/AdminResourceTable.tsx';
import { AdminStatusBadge } from '../components/AdminStatusBadge.tsx';
import { AdminTablePagination } from '../components/AdminTablePagination.tsx';
import { useAdminListQuery } from '../hooks/useAdminListQuery.ts';
import { useLocale } from '../../hooks/useLocale.ts';

type RefundRow = {
  id: string;
  reference: string;
  status: string;
  reason: string;
};

export default function AdminRefundsPage() {
  const { t } = useLocale();
  const { data, isLoading, isError, search, setSearch, page, setPage } =
    useAdminListQuery<RefundRow>({
      resourceKey: 'admin-refunds',
      endpoint: '/admin/return-requests',
      itemsKey: 'return_requests',
    });

  const items = data?.items ?? [];
  const meta = data?.meta;

  return (
    <AdminResourceTable
      title={t('admin.nav.refunds')}
      subtitle={t('admin.refunds.subtitle')}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder={t('admin.tables.searchRefunds')}
      isLoading={isLoading}
      isError={isError}
      isEmpty={items.length === 0}
      emptyTitle={t('admin.refunds.empty')}
      columns={
        <tr>
          <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.reference')}</th>
          <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.status')}</th>
          <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.reason')}</th>
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
      {items.map((item) => (
        <tr key={item.id} className="hover:bg-[#f7f4f1]/50">
          <td className="px-4 py-3 font-mono text-sm font-semibold text-diyar-dark">
            {item.reference}
          </td>
          <td className="px-4 py-3">
            <AdminStatusBadge status={item.status} />
          </td>
          <td className="px-4 py-3 text-sm text-gray-600">{item.reason}</td>
          <td className="px-4 py-3">
            <div className="flex justify-end">
              <Link
                to={`/admin/refunds/${item.id}`}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:border-diyar-brown hover:text-diyar-brown"
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
