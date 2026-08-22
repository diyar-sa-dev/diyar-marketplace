import { Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminResourceTable } from '../components/AdminResourceTable.tsx';
import { AdminStatusBadge } from '../components/AdminStatusBadge.tsx';
import { AdminTablePagination } from '../components/AdminTablePagination.tsx';
import { useAdminListQuery } from '../hooks/useAdminListQuery.ts';
import { useLocale } from '../../hooks/useLocale.ts';

type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  status: string;
  price?: string;
};

export default function AdminProductsPage() {
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
  } = useAdminListQuery<AdminProduct>({
    resourceKey: 'admin-products',
    endpoint: '/admin/products',
    itemsKey: 'products',
  });

  const products = data?.items ?? [];
  const meta = data?.meta;

  return (
    <AdminResourceTable
      title={t('admin.nav.products')}
      subtitle={t('admin.products.subtitle')}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder={t('admin.tables.searchProducts')}
      filters={
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
        >
          <option value="">{t('admin.tables.allStatuses')}</option>
          <option value="active">{t('admin.tables.active')}</option>
          <option value="draft">{t('admin.tables.inactive')}</option>
        </select>
      }
      isLoading={isLoading}
      isError={isError}
      isEmpty={products.length === 0}
      emptyTitle={t('admin.products.empty')}
      columns={
        <tr>
          <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.name')}</th>
          <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.slug')}</th>
          <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.status')}</th>
          <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.amount')}</th>
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
      {products.map((product) => (
        <tr key={product.id} className="hover:bg-[#f7f4f1]/50">
          <td className="px-4 py-3 font-semibold text-diyar-dark">{product.name}</td>
          <td className="px-4 py-3 font-mono text-xs text-gray-500">{product.slug}</td>
          <td className="px-4 py-3">
            <AdminStatusBadge status={product.status} />
          </td>
          <td className="px-4 py-3 text-sm text-gray-700">{product.price ?? '—'}</td>
          <td className="px-4 py-3">
            <div className="flex justify-end">
              <Link
                to={`/admin/products/${product.id}`}
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
