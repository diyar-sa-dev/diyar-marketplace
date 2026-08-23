import { useQuery } from '@tanstack/react-query';
import { Activity, Database, HardDrive } from 'lucide-react';
import { adminApi } from '../../api/client.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import type { ApiSuccessResponse } from '../../types/api.ts';
import type { HealthData } from '../../types/api.ts';

type HealthChecks = NonNullable<HealthData['checks']>;

async function fetchAdminHealth(): Promise<HealthData> {
  const response = await adminApi.get<ApiSuccessResponse<HealthData>>('/health');
  return response.data.data;
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${ok ? 'bg-emerald-400' : 'bg-red-400'}`}
      aria-hidden
    />
  );
}

function CheckItem({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-white/80">
      <StatusDot ok={ok} />
      <span className="font-semibold text-white/90">{label}</span>
      <span className="text-white/55" dir="ltr">
        {detail}
      </span>
    </div>
  );
}

export function AdminSystemHealthBar() {
  const { t } = useLocale();

  const { data } = useQuery({
    queryKey: ['admin', 'health', 'summary'],
    queryFn: fetchAdminHealth,
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 1,
  });

  const checks: HealthChecks | undefined = data?.checks;
  const maintenanceOn = data?.maintenance?.marketplace_enabled === true;

  return (
    <div className="border-b border-white/10 bg-[#173532] px-4 py-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-diyar-cream/70">
          <Activity size={12} />
          {t('admin.health.summaryTitle')}
        </div>

        {checks ? (
          <>
            <CheckItem
              label={t('admin.health.database')}
              ok={checks.database.ok}
              detail={checks.database.driver}
            />
            <CheckItem
              label={t('admin.health.cache')}
              ok={checks.cache.ok}
              detail={checks.cache.driver}
            />
          </>
        ) : (
          <span className="text-xs text-white/50">{t('admin.health.loading')}</span>
        )}

        <div className="flex items-center gap-2 text-xs text-white/80">
          <HardDrive size={12} className="text-white/50" />
          <span className="font-semibold">{t('admin.health.api')}</span>
          <span className={data?.status === 'ok' ? 'text-emerald-300' : 'text-amber-300'} dir="ltr">
            {data?.status ?? '—'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/80">
          <Database size={12} className="text-white/50" />
          <span className="font-semibold">{t('admin.health.maintenance')}</span>
          <span className={maintenanceOn ? 'text-amber-300' : 'text-emerald-300'}>
            {maintenanceOn ? t('admin.health.maintenanceOn') : t('admin.health.maintenanceOff')}
          </span>
        </div>
      </div>
    </div>
  );
}
