import { Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminResourceTable } from '../components/AdminResourceTable.tsx';
import { AdminTablePagination } from '../components/AdminTablePagination.tsx';
import { AdminStatusBadge } from '../components/AdminStatusBadge.tsx';
import { useAdminListQuery } from '../hooks/useAdminListQuery.ts';
import { useLocale } from '../../hooks/useLocale.ts';

type VendorAccount = {
  id: string;
  business_name: string;
  slug: string;
  status: string;
};

export default function AdminVendorsPage() {
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
  } = useAdminListQuery<VendorAccount>({
    resourceKey: 'admin-vendors',
    endpoint: '/admin/vendor-accounts',
    itemsKey: 'vendor_accounts',
  });

  const vendors = data?.items ?? [];
  const meta = data?.meta;

  return (
    <AdminResourceTable
      title={t('admin.nav.vendors')}
      subtitle={t('admin.vendors.subtitle')}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder={t('admin.tables.searchVendors')}
      filters={
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
        >
          <option value="">{t('admin.tables.allStatuses')}</option>
          <option value="active">{t('admin.tables.active')}</option>
          <option value="suspended">{t('admin.tables.suspended')}</option>
          <option value="pending">{t('admin.tables.pending')}</option>
        </select>
      }
      isLoading={isLoading}
      isError={isError}
      isEmpty={vendors.length === 0}
      emptyTitle={t('admin.vendors.empty')}
      columns={
        <tr>
          <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.business')}</th>
          <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.slug')}</th>
          <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.status')}</th>
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
      {vendors.map((vendor) => (
        <tr key={vendor.id} className="hover:bg-[#f7f4f1]/50">
          <td className="px-4 py-3 text-start font-semibold text-diyar-dark">
            {vendor.business_name}
          </td>
          <td className="px-4 py-3 text-start font-mono text-xs text-gray-500">{vendor.slug}</td>
          <td className="px-4 py-3 text-start">
            <AdminStatusBadge status={vendor.status} />
          </td>
          <td className="px-4 py-3 text-end">
            <div className="flex justify-end">
              <Link
                to={`/admin/vendors/${vendor.id}`}
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
