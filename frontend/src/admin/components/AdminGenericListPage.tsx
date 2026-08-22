import { Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminResourceTable } from '../components/AdminResourceTable.tsx';
import { AdminTablePagination } from './AdminTablePagination.tsx';
import { useAdminListQuery } from '../hooks/useAdminListQuery.ts';
import { useLocale } from '../../hooks/useLocale.ts';

export type ListPageConfig<T> = {
  titleKey: string;
  subtitleKey: string;
  emptyKey: string;
  searchPlaceholderKey: string;
  resourceKey: string;
  endpoint: string;
  itemsKey: string;
  detailPath?: (item: T) => string;
  columns: Array<{ key: string; labelKey: string; render?: (item: T) => React.ReactNode }>;
};

function AdminGenericListPage<T extends Record<string, unknown>>({
  config,
}: {
  config: ListPageConfig<T>;
}) {
  const { t } = useLocale();
  const { data, isLoading, isError, search, setSearch, page, setPage } = useAdminListQuery<T>({
    resourceKey: config.resourceKey,
    endpoint: config.endpoint,
    itemsKey: config.itemsKey,
  });

  const items = data?.items ?? [];
  const meta = data?.meta;

  return (
    <AdminResourceTable
      title={t(config.titleKey as never)}
      subtitle={t(config.subtitleKey as never)}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder={t(config.searchPlaceholderKey as never)}
      isLoading={isLoading}
      isError={isError}
      isEmpty={items.length === 0}
      emptyTitle={t(config.emptyKey as never)}
      columns={
        <tr>
          {config.columns.map((column) => (
            <th key={column.key} className="px-4 py-3 text-start font-semibold">
              {t(column.labelKey as never)}
            </th>
          ))}
          {config.detailPath ? (
            <th className="px-4 py-3 text-end font-semibold">{t('admin.tables.actions')}</th>
          ) : null}
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
          {config.columns.map((column) => (
            <td key={column.key} className="px-4 py-3 text-sm text-gray-700">
              {column.render ? column.render(item) : String(item[column.key] ?? '—')}
            </td>
          ))}
          {config.detailPath ? (
            <td className="px-4 py-3">
              <div className="flex justify-end">
                <Link
                  to={config.detailPath(item)}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:border-diyar-brown hover:text-diyar-brown"
                >
                  <Eye size={14} />
                  <span className="hidden sm:inline">{t('admin.tables.view')}</span>
                </Link>
              </div>
            </td>
          ) : null}
        </tr>
      ))}
    </AdminResourceTable>
  );
}

export default AdminGenericListPage;
