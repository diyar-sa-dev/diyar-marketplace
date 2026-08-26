import { useQuery } from '@tanstack/react-query';
import type { AnalyticsPeriodPreset } from '../../api/vendorAnalytics.ts';
import {
  fetchProviderAnalyticsBookings,
  fetchProviderAnalyticsOverview,
  fetchProviderAnalyticsServices,
} from '../../api/providerAnalytics.ts';

export const providerAnalyticsKeys = {
  all: ['provider-analytics'] as const,
  overview: (period: AnalyticsPeriodPreset) => [...providerAnalyticsKeys.all, 'overview', period] as const,
  bookings: (period: AnalyticsPeriodPreset) => [...providerAnalyticsKeys.all, 'bookings', period] as const,
  services: (period: AnalyticsPeriodPreset, page: number) =>
    [...providerAnalyticsKeys.all, 'services', period, page] as const,
};

export function useProviderAnalyticsOverview(period: AnalyticsPeriodPreset = '30d') {
  return useQuery({
    queryKey: providerAnalyticsKeys.overview(period),
    queryFn: () => fetchProviderAnalyticsOverview(period),
    staleTime: 60_000,
  });
}

export function useProviderAnalyticsBookings(period: AnalyticsPeriodPreset = '30d') {
  return useQuery({
    queryKey: providerAnalyticsKeys.bookings(period),
    queryFn: () => fetchProviderAnalyticsBookings(period),
    staleTime: 120_000,
  });
}

export function useProviderAnalyticsServices(period: AnalyticsPeriodPreset = '30d', page = 1) {
  return useQuery({
    queryKey: providerAnalyticsKeys.services(period, page),
    queryFn: () => fetchProviderAnalyticsServices(period, page),
    staleTime: 120_000,
  });
}
