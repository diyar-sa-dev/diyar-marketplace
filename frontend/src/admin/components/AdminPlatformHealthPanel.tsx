import type { ReactNode } from 'react';
import { Activity, Database, HardDrive, Globe2, Server } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale.ts';
import { useAdminHealth } from '../hooks/useAdminHealth.ts';
import type { HealthData } from '../../types/api.ts';

function driverLabel(driver: string | undefined, t: ReturnType<typeof useLocale>['t']): string {
  if (!driver) return '—';
  const key = `admin.health.drivers.${driver}` as const;
  const translated = t(key);
  return translated === key ? driver : translated;
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
        ok ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
      {label}
    </span>
  );
}

function HealthRow({
  icon,
  title,
  ok,
  detail,
}: {
  icon: ReactNode;
  title: string;
  ok: boolean;
  detail: string;
}) {
  const { t } = useLocale();

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-[#f7f4f1]/40 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-diyar-brown shadow-sm">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-diyar-dark">{title}</p>
          <p className="truncate text-xs text-gray-500">{detail}</p>
        </div>
      </div>
      <StatusPill
        ok={ok}
        label={ok ? t('admin.health.statusOkShort') : t('admin.health.statusDegradedShort')}
      />
    </div>
  );
}

function buildRows(data: HealthData, t: ReturnType<typeof useLocale>['t']) {
  const dbOk = data.checks?.database?.ok ?? false;
  const cacheOk = data.checks?.cache?.ok ?? false;
  const maintenanceOn = data.maintenance?.marketplace_enabled ?? false;

  return [
    {
      key: 'database',
      icon: <Database size={18} />,
      title: t('admin.health.database'),
      ok: dbOk,
      detail: driverLabel(data.checks?.database?.driver, t),
    },
    {
      key: 'cache',
      icon: <HardDrive size={18} />,
      title: t('admin.health.cache'),
      ok: cacheOk,
      detail: driverLabel(data.checks?.cache?.driver, t),
    },
    {
      key: 'api',
      icon: <Server size={18} />,
      title: t('admin.health.api'),
      ok: true,
      detail: t('admin.health.apiReachable'),
    },
    {
      key: 'storefront',
      icon: <Globe2 size={18} />,
      title: t('admin.health.maintenance'),
      ok: !maintenanceOn,
      detail: maintenanceOn ? t('admin.health.maintenanceOn') : t('admin.health.maintenanceOff'),
    },
  ];
}

export function AdminPlatformHealthPanel() {
  const { t } = useLocale();
  const { data, isPending, isError } = useAdminHealth();

  const overallOk =
    data?.status === 'ok' &&
    (data.checks?.database?.ok ?? false) &&
    (data.checks?.cache?.ok ?? false) &&
    !(data.maintenance?.marketplace_enabled ?? false);

  return (
    <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-diyar-dark/5 text-diyar-dark">
            <Activity size={22} />
          </div>
          <div>
            <h4 className="text-lg font-extrabold text-diyar-dark">
              {t('admin.settings.platformHealthTitle')}
            </h4>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-gray-600">
              {t('admin.settings.platformHealthSubtitle')}
            </p>
          </div>
        </div>
        {!isPending && !isError && data ? (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
              overallOk ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
            }`}
          >
            {overallOk ? t('admin.health.statusOk') : t('admin.health.statusDegraded')}
          </span>
        ) : null}
      </div>

      <div className="grid gap-3 p-6 sm:grid-cols-2">
        {isPending ? (
          [...Array(4)].map((_, index) => (
            <div key={index} className="h-18 animate-pulse rounded-2xl bg-gray-100" />
          ))
        ) : isError || !data ? (
          <p className="col-span-full text-sm text-gray-500">{t('admin.health.unavailable')}</p>
        ) : (
          buildRows(data, t).map((row) => (
            <HealthRow
              key={row.key}
              icon={row.icon}
              title={row.title}
              ok={row.ok}
              detail={row.detail}
            />
          ))
        )}
      </div>
    </section>
  );
}
