import { useState } from 'react';
import { useLocale } from '../../hooks/useLocale.ts';
import { AdminResourceTable } from '../components/AdminResourceTable.tsx';
import { AdminStatusBadge } from '../components/AdminStatusBadge.tsx';
import { AdminTablePagination } from '../components/AdminTablePagination.tsx';
import { DetailTabs } from '../components/DetailTabs.tsx';
import { useAdminListQuery } from '../hooks/useAdminListQuery.ts';

const TAB_CONFIG = [
  {
    id: 'inventory',
    labelKey: 'admin.nav.inventory',
    endpoint: '/admin/inventory/products',
    itemsKey: 'products',
    searchKey: 'admin.tables.searchProducts',
  },
  {
    id: 'movements',
    labelKey: 'admin.inventory.movements',
    endpoint: '/admin/inventory/movements',
    itemsKey: 'movements',
    searchKey: 'admin.tables.searchProducts',
  },
  {
    id: 'shipments',
    labelKey: 'admin.nav.shipments',
    endpoint: '/admin/shipments',
    itemsKey: 'shipments',
    searchKey: 'admin.tables.searchShipments',
  },
  {
    id: 'notifications',
    labelKey: 'admin.nav.notifications',
    endpoint: '/admin/notifications',
    itemsKey: 'notifications',
    searchKey: 'admin.tables.searchNotifications',
  },
] as const;

type OpsRow = Record<string, unknown> & {
  id?: string;
  name?: string;
  slug?: string;
  status?: string;
  reference?: string;
  title?: string;
  tracking_number?: string;
};

export default function AdminOperationsHubPage() {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState<(typeof TAB_CONFIG)[number]['id']>('inventory');
  const config = TAB_CONFIG.find((tab) => tab.id === activeTab) ?? TAB_CONFIG[0];

  const { data, isLoading, isError, search, setSearch, page, setPage } = useAdminListQuery<OpsRow>({
    resourceKey: `admin-ops-${config.id}`,
    endpoint: config.endpoint,
    itemsKey: config.itemsKey,
  });

  const items = data?.items ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-diyar-dark">
          {t('admin.nav.groups.operations')}
        </h2>
        <p className="mt-1 text-sm text-gray-500">{t('admin.operations.subtitle')}</p>
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
        emptyTitle={t('admin.operations.empty')}
        columns={
          <tr>
            <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.reference')}</th>
            <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.name')}</th>
            <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.status')}</th>
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
        {items.map((item, index) => (
          <tr key={String(item.id ?? index)} className="hover:bg-[#f7f4f1]/50">
            <td className="px-4 py-3 font-mono text-xs text-gray-600">
              {String(item.reference ?? item.tracking_number ?? item.id ?? '').slice(0, 12)}
            </td>
            <td className="px-4 py-3 text-sm text-gray-700">
              {String(item.name ?? item.title ?? item.slug ?? '—')}
            </td>
            <td className="px-4 py-3">
              {item.status ? <AdminStatusBadge status={String(item.status)} /> : '—'}
            </td>
          </tr>
        ))}
      </AdminResourceTable>
    </div>
  );
}
