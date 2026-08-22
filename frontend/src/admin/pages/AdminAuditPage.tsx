import { useMemo, useState } from 'react';
import { AdminTablePagination } from '../components/AdminTablePagination.tsx';
import { AdminResourceTable } from '../components/AdminResourceTable.tsx';
import { useAdminListQuery } from '../hooks/useAdminListQuery.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import {
  AUDIT_ACTION_FILTER_OPTIONS,
  localizedAuditAction,
  localizedAuditResource,
} from '../utils/localizedAudit.ts';

type AuditLog = {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  created_at?: string;
  actor?: { name?: string };
};

export default function AdminAuditPage() {
  const { t } = useLocale();
  const [actionFilter, setActionFilter] = useState('');
  const { data, isLoading, isError, search, setSearch, page, setPage } =
    useAdminListQuery<AuditLog>({
      resourceKey: 'admin-audit',
      endpoint: '/admin/audit-logs',
      itemsKey: 'audit_logs',
      extraParams: actionFilter ? { action: actionFilter } : undefined,
    });

  const logs = data?.items ?? [];
  const meta = data?.meta;

  const actionOptions = useMemo(
    () =>
      AUDIT_ACTION_FILTER_OPTIONS.map((action) => ({
        value: action,
        label: localizedAuditAction(action, t),
      })),
    [t],
  );

  return (
    <AdminResourceTable
      title={t('admin.nav.audit')}
      subtitle={t('admin.audit.subtitle')}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder={t('admin.tables.searchAudit')}
      filters={
        <select
          value={actionFilter}
          onChange={(event) => {
            setActionFilter(event.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
        >
          <option value="">{t('admin.audit.allActions')}</option>
          {actionOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      }
      isLoading={isLoading}
      isError={isError}
      isEmpty={logs.length === 0}
      emptyTitle={t('admin.audit.empty')}
      columns={
        <tr>
          <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.action')}</th>
          <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.resource')}</th>
          <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.actor')}</th>
          <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.createdAt')}</th>
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
      {logs.map((log) => (
        <tr key={log.id} className="hover:bg-[#f7f4f1]/50">
          <td className="px-4 py-3 text-sm font-semibold text-diyar-dark">
            {localizedAuditAction(log.action, t)}
          </td>
          <td className="px-4 py-3 text-sm text-gray-600">
            <span className="font-semibold">{localizedAuditResource(log.resource_type, t)}</span>
            <span className="mx-1 text-gray-400">·</span>
            <span className="font-mono text-xs">{log.resource_id}</span>
          </td>
          <td className="px-4 py-3 text-sm text-gray-700">{log.actor?.name ?? '—'}</td>
          <td className="px-4 py-3 text-sm text-gray-500">
            {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
          </td>
        </tr>
      ))}
    </AdminResourceTable>
  );
}
