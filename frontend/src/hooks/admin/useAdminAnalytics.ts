import { useQuery } from '@tanstack/react-query';
import type { AnalyticsPeriodPreset } from '../../api/vendorAnalytics.ts';
import {
  fetchAdminCohortAnalytics,
  fetchAdminFunnelAnalytics,
  fetchAdminSearchAnalytics,
} from '../../api/adminAnalytics.ts';

export const adminAnalyticsKeys = {
  all: ['admin-analytics'] as const,
  funnel: (period: AnalyticsPeriodPreset) => [...adminAnalyticsKeys.all, 'funnel', period] as const,
  cohorts: (months: number) => [...adminAnalyticsKeys.all, 'cohorts', months] as const,
  search: (period: AnalyticsPeriodPreset) => [...adminAnalyticsKeys.all, 'search', period] as const,
};

type QueryOptions = {
  enabled?: boolean;
};

export function useAdminFunnelAnalytics(
  period: AnalyticsPeriodPreset = '30d',
  options: QueryOptions = {},
) {
  return useQuery({
    queryKey: adminAnalyticsKeys.funnel(period),
    queryFn: () => fetchAdminFunnelAnalytics(period),
    staleTime: 120_000,
    enabled: options.enabled ?? true,
  });
}

export function useAdminCohortAnalytics(months = 6, options: QueryOptions = {}) {
  return useQuery({
    queryKey: adminAnalyticsKeys.cohorts(months),
    queryFn: () => fetchAdminCohortAnalytics(months),
    staleTime: 300_000,
    enabled: options.enabled ?? true,
  });
}

export function useAdminSearchAnalytics(
  period: AnalyticsPeriodPreset = '30d',
  options: QueryOptions = {},
) {
  return useQuery({
    queryKey: adminAnalyticsKeys.search(period),
    queryFn: () => fetchAdminSearchAnalytics(period),
    staleTime: 120_000,
    enabled: options.enabled ?? true,
  });
}
