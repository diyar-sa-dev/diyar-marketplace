import { useState } from 'react';
import { Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLocale } from '../../hooks/useLocale.ts';
import { AdminResourceTable } from '../components/AdminResourceTable.tsx';
import { AdminStatusBadge } from '../components/AdminStatusBadge.tsx';
import { AdminTablePagination } from '../components/AdminTablePagination.tsx';
import { DetailTabs } from '../components/DetailTabs.tsx';
import { useAdminListQuery } from '../hooks/useAdminListQuery.ts';

const TAB_CONFIG = [
  {
    id: 'requests',
    labelKey: 'admin.nav.serviceRequests',
    endpoint: '/admin/service-requests',
    itemsKey: 'service_requests',
    searchKey: 'admin.tables.searchServiceRequests',
  },
  {
    id: 'bookings',
    labelKey: 'admin.nav.bookings',
    endpoint: '/admin/service-bookings',
    itemsKey: 'service_bookings',
    searchKey: 'admin.tables.searchBookings',
  },
] as const;

type ServiceRow = {
  id: string;
  reference?: string;
  title?: string;
  status?: string;
};

export default function AdminServicesHubPage() {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState<(typeof TAB_CONFIG)[number]['id']>('requests');
  const config = TAB_CONFIG.find((tab) => tab.id === activeTab) ?? TAB_CONFIG[0];

  const { data, isLoading, isError, search, setSearch, page, setPage } =
    useAdminListQuery<ServiceRow>({
      resourceKey: `admin-services-${config.id}`,
      endpoint: config.endpoint,
      itemsKey: config.itemsKey,
    });

  const items = data?.items ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-diyar-dark">
          {t('admin.nav.groups.services')}
        </h2>
        <p className="mt-1 text-sm text-gray-500">{t('admin.services.subtitle')}</p>
      </div>

      <DetailTabs
        tabs={TAB_CONFIG.map((tab) => ({ id: tab.id, label: t(tab.labelKey as never) }))}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as typeof activeTab)}
      />

      <AdminResourceTable
        title={t(config.labelKey as never)}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t(config.searchKey as never)}
        isLoading={isLoading}
        isError={isError}
        isEmpty={items.length === 0}
        emptyTitle={t('admin.services.empty')}
        columns={
          <tr>
            <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.reference')}</th>
            <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.name')}</th>
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
        {items.map((item) => (
          <tr key={item.id} className="hover:bg-[#f7f4f1]/50">
            <td className="px-4 py-3 text-start font-mono text-xs text-gray-600">
              {item.reference ?? item.id.slice(0, 8)}
            </td>
            <td className="px-4 py-3 text-start font-semibold text-diyar-dark">
              {item.title ?? '—'}
            </td>
            <td className="px-4 py-3 text-start">
              {item.status ? <AdminStatusBadge status={item.status} /> : '—'}
            </td>
            <td className="px-4 py-3 text-end">
              <div className="flex justify-end">
                <Link
                  to={`/admin/services/${activeTab}/${item.id}`}
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
    </div>
  );
}
