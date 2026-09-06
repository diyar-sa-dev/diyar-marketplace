import { adminApi } from './client.ts';
import type { ApiSuccessResponse } from '../types/api.ts';
import type { AnalyticsPeriodPreset } from './vendorAnalytics.ts';

export type AdminFunnelStage = {
  key: string;
  label_key: string;
  count: number;
  available: boolean;
  conversion_from_previous: number | null;
  note?: string | null;
};

export type AdminFunnelAnalytics = {
  period: { from: string; to: string };
  stages: AdminFunnelStage[];
  unavailable: AdminFunnelStage[];
};

export type AdminCohortAnalytics = {
  months: number;
  metric: string;
  cohorts: Record<
    string,
    {
      customers?: Record<number, number>;
      orders?: Record<number, number>;
      revenue?: Record<number, string>;
    }
  >;
  note?: string;
};

export type AdminSearchAnalytics = {
  period: { from: string; to: string };
  totals: {
    searches: number;
    zero_result_searches: number;
    zero_result_rate: number;
    avg_duration_ms: number;
  };
  top_queries: Array<{ query: string; searches: number; avg_results: number }>;
  searches_by_day: Array<{ day: string; count: number }>;
};

export async function fetchAdminSearchAnalytics(
  period: AnalyticsPeriodPreset = '30d',
): Promise<AdminSearchAnalytics> {
  const { data } = await adminApi.get<ApiSuccessResponse<{ analytics: AdminSearchAnalytics }>>(
    '/admin/analytics/search',
    { params: { period } },
  );
  return data.data.analytics;
}

export async function fetchAdminFunnelAnalytics(
  period: AnalyticsPeriodPreset = '30d',
): Promise<AdminFunnelAnalytics> {
  const { data } = await adminApi.get<ApiSuccessResponse<{ analytics: AdminFunnelAnalytics }>>(
    '/admin/analytics/funnel',
    { params: { period } },
  );
  return data.data.analytics;
}

export async function fetchAdminCohortAnalytics(months = 6): Promise<AdminCohortAnalytics> {
  const { data } = await adminApi.get<ApiSuccessResponse<{ analytics: AdminCohortAnalytics }>>(
    '/admin/analytics/cohorts',
    { params: { months } },
  );
  return data.data.analytics;
}
