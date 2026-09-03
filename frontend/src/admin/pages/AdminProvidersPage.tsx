import { ExternalLink, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminResourceTable } from '../components/AdminResourceTable.tsx';
import { TableLtrValue } from '../../components/common/TableLtrValue.tsx';
import { AdminTablePagination } from '../components/AdminTablePagination.tsx';
import { AdminStatusBadge } from '../components/AdminStatusBadge.tsx';
import { useAdminListQuery } from '../hooks/useAdminListQuery.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { formatLocaleDate } from '../../lib/intlLocale.ts';

type ProviderAccount = {
  id: string;
  business_name: string;
  slug: string;
  status: string;
  location?: string | null;
  created_at?: string;
};

export default function AdminProvidersPage() {
  const { t, locale } = useLocale();
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
  } = useAdminListQuery<ProviderAccount>({
    resourceKey: 'admin-providers',
    endpoint: '/admin/provider-accounts',
    itemsKey: 'provider_accounts',
  });

  const providers = data?.items ?? [];
  const meta = data?.meta;

  return (
    <AdminResourceTable
      title={t('admin.nav.providers')}
      subtitle={t('admin.providers.subtitle')}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder={t('admin.tables.searchProviders')}
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
      isEmpty={providers.length === 0}
      emptyTitle={t('admin.providers.empty')}
      columns={
        <tr>
          <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.business')}</th>
          <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.slug')}</th>
          <th className="px-4 py-3 text-start font-semibold">
            {t('admin.detail.vendor.location')}
          </th>
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
      {providers.map((provider) => (
        <tr key={provider.id} className="hover:bg-[#f7f4f1]/50">
          <td className="px-4 py-3">
            <div className="min-w-0">
              <Link
                to={`/admin/providers/${provider.id}`}
                className="font-semibold text-diyar-dark hover:text-diyar-brown"
              >
                {provider.business_name}
              </Link>
              {provider.created_at && (
                <p className="mt-0.5 text-xs text-gray-400">
                  {formatLocaleDate(provider.created_at, locale, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              )}
            </div>
          </td>
          <td className="px-4 py-3 text-start">
            <TableLtrValue className="font-mono text-xs text-gray-500">{provider.slug}</TableLtrValue>
          </td>
          <td className="px-4 py-3 text-sm text-gray-600">{provider.location ?? '—'}</td>
          <td className="px-4 py-3">
            <AdminStatusBadge status={provider.status} />
          </td>
          <td className="px-4 py-3">
            <div className="flex justify-end gap-1.5">
              <Link
                to={`/provider/${provider.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:border-diyar-brown hover:text-diyar-brown"
                aria-label={t('admin.providers.viewStorefront')}
              >
                <ExternalLink size={14} />
                <span className="hidden lg:inline">{t('admin.providers.viewStorefront')}</span>
              </Link>
              <Link
                to={`/admin/providers/${provider.id}`}
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
