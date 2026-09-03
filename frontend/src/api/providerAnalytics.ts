import { apiClient } from './client.ts';
import type { ApiSuccessResponse } from '../types/api.ts';
import type { AnalyticsPeriodPreset } from './vendorAnalytics.ts';

export type ProviderAnalyticsOverview = {
  period: {
    preset: string;
    from: string;
    to: string;
    timezone: string;
  };
  currency: string;
  kpis: {
    bookings_created: number;
    bookings_confirmed: number;
    bookings_completed: number;
    bookings_cancelled: number;
    revenue: {
      value: string;
      previous_value: string;
      change_percent: number | null;
    };
    average_booking_value: string;
    rating: number | null;
    review_count: number;
    active_services: number;
  };
};

export type ProviderBookingsSeriesPoint = {
  label: string;
  bookings_created: number;
  bookings_completed: number;
  bookings_cancelled: number;
  revenue: string;
};

export type ProviderServiceAnalyticsRow = {
  service_id: string | null;
  service_title: string;
  bookings_count: number;
  completed_bookings: number;
  cancelled_bookings: number;
  revenue: string;
  average_booking_value: string;
  rating: number | null;
  review_count: number;
  completion_rate: number;
  currency: string;
};

export async function fetchProviderAnalyticsOverview(
  period: AnalyticsPeriodPreset = '30d',
): Promise<ProviderAnalyticsOverview> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{ analytics: ProviderAnalyticsOverview }>
  >('/dashboard/provider/analytics/overview', { params: { period } });
  return data.data.analytics;
}

export async function fetchProviderAnalyticsBookings(period: AnalyticsPeriodPreset = '30d') {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{
      analytics: {
        period: ProviderAnalyticsOverview['period'] & { granularity?: string };
        currency: string;
        series: ProviderBookingsSeriesPoint[];
      };
    }>
  >('/dashboard/provider/analytics/bookings', { params: { period } });
  return data.data.analytics;
}

export async function fetchProviderAnalyticsServices(
  period: AnalyticsPeriodPreset = '30d',
  page = 1,
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{
      period: { from: string; to: string };
      services: ProviderServiceAnalyticsRow[];
      pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
      };
    }>
  >('/dashboard/provider/analytics/services', { params: { period, page } });
  return data.data;
}
