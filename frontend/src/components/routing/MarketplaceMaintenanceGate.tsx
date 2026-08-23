import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { fetchHealth } from '../../api/health.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import MaintenancePage from '../../pages/MaintenancePage.tsx';
import { readBooleanFlag } from '../../lib/readBooleanFlag.ts';

function isMaintenanceExemptPath(pathname: string): boolean {
  return pathname.startsWith('/admin');
}

export function MarketplaceMaintenanceGate({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { locale } = useLocale();
  const isExempt = isMaintenanceExemptPath(location.pathname);

  const { data } = useQuery({
    queryKey: ['health', 'maintenance'],
    queryFn: fetchHealth,
    enabled: !isExempt,
    staleTime: 0,
    refetchInterval: 30_000,
    retry: 1,
  });

  if (!isExempt && readBooleanFlag(data?.maintenance?.marketplace_enabled)) {
    const message =
      locale === 'ar'
        ? data.maintenance.message_ar || data.maintenance.message_en
        : data.maintenance.message_en || data.maintenance.message_ar;

    return <MaintenancePage message={message} />;
  }

  return children;
}
