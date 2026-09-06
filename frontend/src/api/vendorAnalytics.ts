import { apiClient } from './client.ts';
import type { ApiSuccessResponse } from '../types/api.ts';

export type AnalyticsPeriodPreset = 'today' | '7d' | '30d' | '90d' | 'year' | 'custom';

export type AnalyticsKpi = {
  value: string | number;
  previous_value: string | number;
  change_percent: number | null;
};

export type VendorAnalyticsOverview = {
  period: {
    preset: string;
    from: string;
    to: string;
    timezone: string;
  };
  currency: string;
  kpis: {
    gross_sales: AnalyticsKpi;
    net_sales: AnalyticsKpi;
    orders: AnalyticsKpi;
    items_sold: AnalyticsKpi;
    average_order_value: AnalyticsKpi;
    refund_amount: AnalyticsKpi;
    discount_amount: AnalyticsKpi;
    coupon_usage: AnalyticsKpi;
    payment_success_rate: AnalyticsKpi;
  };
};

export type VendorSalesSeriesPoint = {
  label: string;
  revenue: string;
  gross_sales: string;
  orders: number;
  refunds: string;
  average_order_value: string;
};

export type VendorProductAnalyticsRow = {
  product_id: string;
  product_name: string;
  units_sold: number;
  orders_count: number;
  revenue: string;
  currency: string;
};

export async function fetchVendorAnalyticsOverview(
  period: AnalyticsPeriodPreset = '30d',
): Promise<VendorAnalyticsOverview> {
  const { data } = await apiClient.get<ApiSuccessResponse<{ analytics: VendorAnalyticsOverview }>>(
    '/dashboard/vendor/analytics/overview',
    { params: { period } },
  );
  return data.data.analytics;
}

export async function fetchVendorAnalyticsSales(period: AnalyticsPeriodPreset = '30d') {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{
      analytics: {
        period: VendorAnalyticsOverview['period'];
        currency: string;
        series: VendorSalesSeriesPoint[];
      };
    }>
  >('/dashboard/vendor/analytics/sales', { params: { period } });
  return data.data.analytics;
}

export async function fetchVendorAnalyticsProducts(
  period: AnalyticsPeriodPreset = '30d',
  page = 1,
) {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{
      period: { from: string; to: string };
      products: VendorProductAnalyticsRow[];
      pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
      };
    }>
  >('/dashboard/vendor/analytics/products', { params: { period, page } });
  return data.data;
}
