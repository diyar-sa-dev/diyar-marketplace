import { useQuery } from '@tanstack/react-query';
import type { AnalyticsPeriodPreset } from '../../api/vendorAnalytics.ts';
import {
  fetchVendorAnalyticsOverview,
  fetchVendorAnalyticsProducts,
  fetchVendorAnalyticsSales,
} from '../../api/vendorAnalytics.ts';

export const vendorAnalyticsKeys = {
  all: ['vendor-analytics'] as const,
  overview: (period: AnalyticsPeriodPreset) => [...vendorAnalyticsKeys.all, 'overview', period] as const,
  sales: (period: AnalyticsPeriodPreset) => [...vendorAnalyticsKeys.all, 'sales', period] as const,
  products: (period: AnalyticsPeriodPreset, page: number) =>
    [...vendorAnalyticsKeys.all, 'products', period, page] as const,
};

export function useVendorAnalyticsOverview(period: AnalyticsPeriodPreset = '30d') {
  return useQuery({
    queryKey: vendorAnalyticsKeys.overview(period),
    queryFn: () => fetchVendorAnalyticsOverview(period),
    staleTime: 60_000,
  });
}

export function useVendorAnalyticsSales(period: AnalyticsPeriodPreset = '30d') {
  return useQuery({
    queryKey: vendorAnalyticsKeys.sales(period),
    queryFn: () => fetchVendorAnalyticsSales(period),
    staleTime: 120_000,
  });
}

export function useVendorAnalyticsProducts(period: AnalyticsPeriodPreset = '30d', page = 1) {
  return useQuery({
    queryKey: vendorAnalyticsKeys.products(period, page),
    queryFn: () => fetchVendorAnalyticsProducts(period, page),
    staleTime: 120_000,
  });
}
