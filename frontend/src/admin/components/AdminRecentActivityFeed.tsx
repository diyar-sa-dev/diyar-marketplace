import { Link } from 'react-router-dom';
import { Activity, ChevronRight } from 'lucide-react';
import { AdminTablePagination } from './AdminTablePagination.tsx';
import { TableLtrValue } from '../../components/common/TableLtrValue.tsx';
import { useLocale } from '../../hooks/useLocale.ts';
import { formatLocaleDateTime } from '../../lib/intlLocale.ts';
import type { TranslateFn } from '../../lib/i18n/types.ts';
import {
  auditActionBadgeClass,
  auditActionTone,
  localizedAuditAction,
  localizedAuditResource,
} from '../utils/localizedAudit.ts';

export type DashboardAuditLogRow = {
  id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  created_at?: string;
  actor?: { name?: string; email?: string | null };
};

type AdminRecentActivityFeedProps = {
  logs: DashboardAuditLogRow[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  page: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  isFetching: boolean;
  t: TranslateFn;
};

function shortResourceId(id: string | null | undefined): string {
  if (!id) return '—';
  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}

export function AdminRecentActivityFeed({
  logs,
  meta,
  page,
  onPageChange,
  isLoading,
  isFetching,
  t,
}: AdminRecentActivityFeedProps) {
  const { locale, dir } = useLocale();
  const isRtl = dir === 'rtl';

  if (isLoading) {
    return <p className="text-sm text-gray-500">{t('admin.dashboard.activityLoading')}</p>;
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-[#faf8f5]/50 px-6 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-gray-400 shadow-sm">
          <Activity size={22} />
        </div>
        <p className="mt-3 text-sm font-medium text-gray-600">{t('admin.dashboard.noRecentActivity')}</p>
      </div>
    );
  }

  return (
    <>
      <ul className="space-y-2">
        {logs.map((entry) => {
          const tone = auditActionTone(entry.action);

          return (
            <li
              key={entry.id}
              className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-linear-to-r from-white to-[#faf8f5]/60 px-4 py-3.5 transition hover:border-diyar-brown/15 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${auditActionBadgeClass(tone)}`}
                  >
                    {localizedAuditAction(entry.action, t)}
                  </span>
                  {entry.created_at ? (
                    <time
                      className="text-[11px] font-medium text-gray-400"
                      dateTime={entry.created_at}
                    >
                      {formatLocaleDateTime(entry.created_at, locale)}
                    </time>
                  ) : null}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600">
                  <span className="font-semibold text-diyar-dark">
                    {localizedAuditResource(entry.resource_type ?? '', t)}
                  </span>
                  {entry.resource_id ? (
                    <>
                      <span className="text-gray-300">·</span>
                      <TableLtrValue className="font-mono text-xs text-gray-400">
                        {shortResourceId(entry.resource_id)}
                      </TableLtrValue>
                    </>
                  ) : null}
                  {entry.actor?.name ? (
                    <>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-gray-500">{entry.actor.name}</span>
                    </>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/admin/audit"
          className="inline-flex items-center gap-1 text-xs font-bold text-diyar-brown hover:text-diyar-dark"
        >
          {t('admin.dashboard.viewAllActivity')}
          <ChevronRight size={14} className={isRtl ? 'rotate-180' : undefined} />
        </Link>
        <AdminTablePagination
          meta={meta}
          page={page}
          onPageChange={onPageChange}
          isLoading={isFetching}
        />
      </div>
    </>
  );
}
