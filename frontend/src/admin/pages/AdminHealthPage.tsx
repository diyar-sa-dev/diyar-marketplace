import { Activity, Database, HardDrive, Inbox, MessageSquare, Server, Bell } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale.ts';
import { useAdminOperationalHealth } from '../hooks/useAdminOperationalHealth.ts';
import { AdminPageSkeleton } from '../components/AdminPageSkeleton.tsx';

function StatusBadge({ status }: { status: string }) {
  const { t } = useLocale();
  const tone =
    status === 'HEALTHY'
      ? 'bg-emerald-100 text-emerald-800'
      : status === 'DEGRADED'
        ? 'bg-amber-100 text-amber-900'
        : status === 'CRITICAL'
          ? 'bg-red-100 text-red-800'
          : 'bg-gray-100 text-gray-700';

  const labelKey = `admin.healthCenter.status.${status.toLowerCase()}` as const;
  const label = t(labelKey);

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${tone}`}>
      {label === labelKey ? status : label}
    </span>
  );
}

function MetricCard({
  icon,
  title,
  status,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  status?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7f4f1] text-diyar-brown">
            {icon}
          </div>
          <h3 className="text-sm font-bold text-diyar-dark">{title}</h3>
        </div>
        {status ? <StatusBadge status={status} /> : null}
      </div>
      <dl className="mt-4 grid gap-2 text-sm">{children}</dl>
    </section>
  );
}

function MetricRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-[#f7f4f1]/60 px-3 py-2">
      <dt className="text-gray-600">{label}</dt>
      <dd className="font-semibold text-diyar-dark tabular-nums">{value}</dd>
    </div>
  );
}

export default function AdminHealthPage() {
  const { t } = useLocale();
  const { data, isLoading, isError, refetch, isFetching } = useAdminOperationalHealth();

  if (isLoading) {
    return <AdminPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-diyar-dark/5 text-diyar-dark">
              <Activity size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-diyar-dark">{t('admin.healthCenter.title')}</h1>
              <p className="mt-1 text-sm text-gray-500">{t('admin.healthCenter.subtitle')}</p>
            </div>
          </div>
          {data ? <StatusBadge status={data.overall_status} /> : null}
        </div>
        {isError ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{t('admin.health.unavailable')}</span>
            <button
              type="button"
              onClick={() => void refetch()}
              className="rounded-lg bg-white px-3 py-1 text-xs font-bold border border-red-200 cursor-pointer"
            >
              {t('admin.dashboard.retry')}
            </button>
          </div>
        ) : null}
      </section>

      {data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              icon={<Database size={18} />}
              title={t('admin.health.database')}
              status={data.platform.checks?.database?.ok ? 'HEALTHY' : 'CRITICAL'}
            >
              <MetricRow
                label={t('admin.health.drivers.mysql')}
                value={String(data.platform.checks?.database?.driver ?? '—')}
              />
            </MetricCard>
            <MetricCard
              icon={<HardDrive size={18} />}
              title={t('admin.health.cache')}
              status={data.platform.checks?.cache?.ok ? 'HEALTHY' : 'CRITICAL'}
            >
              <MetricRow
                label={t('admin.health.cache')}
                value={String(data.platform.checks?.cache?.driver ?? '—')}
              />
            </MetricCard>
            <MetricCard
              icon={<Server size={18} />}
              title={t('admin.healthCenter.queues')}
              status={data.operational.queues?.status ?? 'UNKNOWN'}
            >
              <MetricRow
                label={t('admin.healthCenter.pendingJobs')}
                value={data.operational.queues?.pending_jobs ?? '—'}
              />
              <MetricRow
                label={t('admin.healthCenter.failedJobs')}
                value={data.operational.queues?.failed_jobs ?? '—'}
              />
            </MetricCard>
            <MetricCard
              icon={<Bell size={18} />}
              title={t('admin.healthCenter.notifications')}
              status={data.operational.notifications?.status ?? 'UNKNOWN'}
            >
              <MetricRow
                label={t('admin.healthCenter.pendingDeliveries')}
                value={data.operational.notifications?.pending ?? 0}
              />
              <MetricRow
                label={t('admin.healthCenter.failedDeliveries')}
                value={data.operational.notifications?.failed ?? 0}
              />
            </MetricCard>
            <MetricCard
              icon={<MessageSquare size={18} />}
              title={t('admin.healthCenter.chat')}
              status={data.operational.chat?.status ?? 'UNKNOWN'}
            >
              <MetricRow
                label={t('admin.healthCenter.pendingReports')}
                value={data.operational.chat?.pending_reports ?? 0}
              />
              <MetricRow
                label={t('admin.healthCenter.messagesLastHour')}
                value={data.operational.chat?.messages_last_hour ?? 0}
              />
            </MetricCard>
            <MetricCard
              icon={<Inbox size={18} />}
              title={t('admin.healthCenter.outbox')}
              status={data.operational.outbox?.status ?? 'UNKNOWN'}
            >
              <MetricRow
                label={t('admin.healthCenter.outboxPending')}
                value={data.operational.outbox?.pending ?? '—'}
              />
              <MetricRow
                label={t('admin.healthCenter.outboxDeadLetter')}
                value={data.operational.outbox?.dead_letter ?? '—'}
              />
            </MetricCard>
          </div>
          <p className="text-xs text-gray-400">
            {t('admin.healthCenter.lastChecked', {
              time: new Date(data.timestamp).toLocaleString(),
            })}
            {isFetching ? ` · ${t('admin.healthCenter.refreshing')}` : ''}
          </p>
        </>
      ) : null}
    </div>
  );
}
