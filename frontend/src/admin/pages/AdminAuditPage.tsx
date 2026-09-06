import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { TableLtrValue } from '../../components/common/TableLtrValue.tsx';
import { AdminTablePagination } from '../components/AdminTablePagination.tsx';
import { AdminResourceTable } from '../components/AdminResourceTable.tsx';
import { useAdminListQuery } from '../hooks/useAdminListQuery.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { formatLocaleDateTime } from '../../lib/intlLocale.ts';
import {
  AUDIT_ACTION_FILTER_OPTIONS,
  auditActionBadgeClass,
  auditActionTone,
  localizedAuditAction,
  localizedAuditResource,
} from '../utils/localizedAudit.ts';

type AuditLog = {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  created_at?: string;
  actor?: { name?: string; email?: string | null };
};

const FILTER_SELECT =
  'rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition hover:border-diyar-brown focus:border-diyar-brown cursor-pointer';

function shortResourceId(id: string | null | undefined): string {
  if (!id) {
    return '—';
  }

  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}

export default function AdminAuditPage() {
  const { t, locale } = useLocale();
  const {
    data,
    isLoading,
    isFetching,
    isError,
    search,
    setSearch,
    paramFilter: actionFilter,
    setParamFilter: setActionFilter,
    page,
    setPage,
    perPage,
    setPerPage,
  } = useAdminListQuery<AuditLog>({
    resourceKey: 'admin-audit',
    endpoint: '/admin/audit-logs',
    itemsKey: 'audit_logs',
    paramFilterKey: 'action',
  });

  const logs = data?.items ?? [];
  const meta = data?.meta;
  const showListSkeleton = isLoading || (isFetching && logs.length === 0);
  const isSearching = isFetching && search.trim().length > 0;

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
          onChange={(event) => setActionFilter(event.target.value)}
          className={FILTER_SELECT}
        >
          <option value="">{t('admin.audit.allActions')}</option>
          {actionOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      }
      actions={
        isSearching ? (
          <span className="inline-flex items-center gap-2 text-xs text-gray-500">
            <Loader2 size={14} className="animate-spin" />
            {t('admin.tables.searching')}
          </span>
        ) : null
      }
      isLoading={showListSkeleton}
      isError={isError}
      isEmpty={!showListSkeleton && logs.length === 0}
      emptyTitle={t('admin.audit.empty')}
      columns={
        <tr>
          <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
            {t('admin.tables.action')}
          </th>
          <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
            {t('admin.tables.resource')}
          </th>
          <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
            {t('admin.tables.actor')}
          </th>
          <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
            {t('admin.tables.createdAt')}
          </th>
        </tr>
      }
      footer={
        <AdminTablePagination
          meta={meta}
          page={page}
          onPageChange={setPage}
          perPage={perPage}
          onPerPageChange={setPerPage}
          isLoading={isFetching}
        />
      }
    >
      {logs.map((log) => {
        const tone = auditActionTone(log.action);

        return (
          <tr key={log.id} className="hover:bg-[#f7f4f1]/50 transition-colors">
            <td className="px-4 py-3">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${auditActionBadgeClass(tone)}`}
              >
                {localizedAuditAction(log.action, t)}
              </span>
            </td>
            <td className="px-4 py-3 text-sm text-gray-600">
              <p className="font-semibold text-diyar-dark">
                {localizedAuditResource(log.resource_type, t)}
              </p>
              <TableLtrValue className="mt-0.5 font-mono text-xs text-gray-400">
                {shortResourceId(log.resource_id)}
              </TableLtrValue>
            </td>
            <td className="px-4 py-3">
              <p className="text-sm font-medium text-gray-800">{log.actor?.name ?? '—'}</p>
              {log.actor?.email ? (
                <TableLtrValue className="text-xs text-gray-400">{log.actor.email}</TableLtrValue>
              ) : null}
            </td>
            <td className="px-4 py-3 text-sm text-gray-500">
              {log.created_at ? formatLocaleDateTime(log.created_at, locale) : '—'}
            </td>
          </tr>
        );
      })}
    </AdminResourceTable>
  );
}
