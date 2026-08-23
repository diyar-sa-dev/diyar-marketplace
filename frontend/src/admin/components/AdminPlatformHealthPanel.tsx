import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  HardDrive,
  Loader2,
  Server,
  Store,
} from 'lucide-react';
import { useLocale } from '../../hooks/useLocale.ts';
import { useAdminHealth } from '../hooks/useAdminHealth.ts';

type HealthChecks = NonNullable<import('../../types/api.ts').HealthData['checks']>;

function localizeDriverLabel(driver: string, t: (key: never) => string): string {
  const key = `admin.health.drivers.${driver}` as never;
  const translated = t(key);
  return translated === key ? driver : translated;
}

function StatusPill({
  label,
  value,
  ok,
  icon,
  localizeValue = false,
}: {
  label: string;
  value: string;
  ok: boolean;
  icon: React.ReactNode;
  localizeValue?: boolean;
}) {
  const { t } = useLocale();
  const displayValue = localizeValue ? localizeDriverLabel(value, t) : value;

  return (
    <div
      className={`flex min-w-40 flex-1 items-center gap-3 rounded-2xl border px-4 py-3 ${
        ok
          ? 'border-emerald-100 bg-emerald-50/80'
          : 'border-amber-100 bg-amber-50/80'
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          ok ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        <p className="truncate text-sm font-bold text-diyar-dark" dir="ltr">
          {displayValue}
        </p>
      </div>
      <span
        className={`ms-auto h-2.5 w-2.5 shrink-0 rounded-full ${
          ok ? 'bg-emerald-500' : 'bg-amber-500'
        }`}
        aria-hidden
      />
    </div>
  );
}

function MaintenanceStatusPill({ enabled }: { enabled: boolean }) {
  const { t } = useLocale();

  return (
    <div
      className={`flex min-w-40 flex-1 items-center gap-3 rounded-2xl border px-4 py-3 ${
        enabled
          ? 'border-amber-200 bg-linear-to-br from-amber-50 to-orange-50'
          : 'border-emerald-100 bg-linear-to-br from-emerald-50 to-teal-50'
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          enabled ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
        }`}
      >
        {enabled ? <AlertTriangle size={18} /> : <Store size={18} />}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {t('admin.health.maintenance')}
        </p>
        <p className="text-sm font-bold text-diyar-dark">
          {enabled ? t('admin.health.maintenanceOn') : t('admin.health.maintenanceOff')}
        </p>
        <p className="mt-0.5 text-[11px] text-gray-500">
          {enabled
            ? t('admin.settings.maintenance.storefrontBlocked')
            : t('admin.settings.maintenance.storefrontLive')}
        </p>
      </div>
    </div>
  );
}

type AdminPlatformHealthPanelProps = {
  variant?: 'settings' | 'sidebar';
};

export function AdminPlatformHealthPanel({ variant = 'settings' }: AdminPlatformHealthPanelProps) {
  const { t } = useLocale();
  const { data, isLoading, isError } = useAdminHealth();

  const checks: HealthChecks | undefined = data?.checks;
  const maintenanceOn = data?.maintenance?.marketplace_enabled === true;
  const apiOk = data?.status === 'ok';

  if (variant === 'sidebar') {
    return (
      <div className="border-b border-white/10 bg-[#173532] px-4 py-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-diyar-cream/70">
            <Activity size={12} />
            {t('admin.health.summaryTitle')}
          </div>
          {isLoading ? (
            <span className="text-xs text-white/50">{t('admin.health.loading')}</span>
          ) : isError ? (
            <span className="text-xs text-amber-300">{t('admin.health.unavailable')}</span>
          ) : (
            <>
              {checks ? (
                <>
                  <SidebarChip
                    label={t('admin.health.database')}
                    detail={localizeDriverLabel(checks.database.driver, t)}
                    ok={checks.database.ok}
                  />
                  <SidebarChip
                    label={t('admin.health.cache')}
                    detail={localizeDriverLabel(checks.cache.driver, t)}
                    ok={checks.cache.ok}
                  />
                </>
              ) : null}
              <SidebarChip
                label={t('admin.health.api')}
                detail={data?.status ?? '—'}
                ok={apiOk}
              />
              <SidebarChip
                label={t('admin.health.maintenance')}
                detail={
                  maintenanceOn ? t('admin.health.maintenanceOn') : t('admin.health.maintenanceOff')
                }
                ok={!maintenanceOn}
              />
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-diyar-dark/10 bg-linear-to-br from-[#f7f4f1] via-white to-emerald-50/40 shadow-sm">
      <div className="border-b border-diyar-dark/5 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-diyar-brown">
              <Activity size={18} />
              <h3 className="text-lg font-extrabold text-diyar-dark">
                {t('admin.settings.platformHealthTitle')}
              </h3>
            </div>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-500">
              {t('admin.settings.platformHealthSubtitle')}
            </p>
          </div>
          {isLoading ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-500 shadow-sm">
              <Loader2 size={14} className="animate-spin" />
              {t('admin.health.loading')}
            </span>
          ) : apiOk ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800">
              <CheckCircle2 size={14} />
              {t('admin.health.statusOk')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800">
              <AlertTriangle size={14} />
              {t('admin.health.statusDegraded')}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-3 p-6 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
            <Loader2 size={18} className="animate-spin" />
            {t('admin.health.loading')}
          </div>
        ) : isError ? (
          <div className="col-span-full rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {t('admin.health.unavailable')}
          </div>
        ) : (
          <>
            {checks ? (
              <>
                <StatusPill
                  label={t('admin.health.database')}
                  value={checks.database.driver}
                  ok={checks.database.ok}
                  icon={<Database size={18} />}
                  localizeValue
                />
                <StatusPill
                  label={t('admin.health.cache')}
                  value={checks.cache.driver}
                  ok={checks.cache.ok}
                  icon={<Server size={18} />}
                  localizeValue
                />
              </>
            ) : null}
            <StatusPill
              label={t('admin.health.api')}
              value={data?.status ?? '—'}
              ok={apiOk}
              icon={<HardDrive size={18} />}
            />
            <MaintenanceStatusPill enabled={maintenanceOn} />
          </>
        )}
      </div>
    </section>
  );
}

function SidebarChip({
  label,
  detail,
  ok,
}: {
  label: string;
  detail: string;
  ok: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-white/80">
      <span
        className={`inline-block h-2 w-2 rounded-full ${ok ? 'bg-emerald-400' : 'bg-amber-400'}`}
        aria-hidden
      />
      <span className="font-semibold text-white/90">{label}</span>
      <span className="text-white/55" dir="ltr">
        {detail}
      </span>
    </div>
  );
}
