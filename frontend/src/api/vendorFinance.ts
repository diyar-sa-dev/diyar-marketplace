import { apiClient } from './client.ts';
import type { ApiSuccessResponse } from '../types/api.ts';

export type FinancePeriod = 'day' | 'week' | 'month' | 'year';

export type VendorFinanceSummary = {
  currency: string;
  total_revenue: string;
  pending_escrow: string;
  available_balance: string;
  paid_out: string;
};

export type VendorFinancePeriodReport = {
  period: {
    type: FinancePeriod;
    from: string;
    to: string;
  };
  summary: VendorFinanceSummary & {
    gross_sales: string;
    commission: string;
    commission_base?: string;
    commission_rate_percent?: string | null;
    refunds: string;
    adjustments: string;
    net_earnings: string;
  };
  orders: {
    completed: number;
    average_order_value: string;
  };
  upcoming_payout: {
    amount: string | null;
    due_at: string | null;
    note: string | null;
  };
};

export type VendorFinanceAnalyticsPoint = {
  label: string;
  net_earnings: string;
  commission: string;
  gross_sales: string;
};

export type FinancialTransaction = {
  id: string;
  reference: string;
  transaction_type: string;
  amount: string;
  currency: string;
  direction: string;
  balance_bucket: string;
  description: string | null;
  order_id: string | null;
  order_number: string | null;
  payment_id: string | null;
  created_at: string | null;
};

export type VendorPayout = {
  id: string;
  reference: string;
  amount: string;
  currency: string;
  status: string;
  requested_at: string | null;
  processed_at: string | null;
  rejection_reason: string | null;
};

export type TransactionTypeFilter =
  'all' | 'revenue' | 'commission' | 'refund' | 'payout' | 'adjustment';

export async function fetchVendorFinanceReport(
  period: FinancePeriod = 'month',
): Promise<VendorFinancePeriodReport> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{ report: VendorFinancePeriodReport; summary: VendorFinanceSummary }>
  >('/dashboard/vendor/finance/summary', { params: { period } });
  return data.data.report;
}

export async function fetchVendorFinanceAnalytics(period: FinancePeriod = 'month'): Promise<{
  period: VendorFinancePeriodReport['period'];
  analytics: VendorFinanceAnalyticsPoint[];
}> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{
      period: VendorFinancePeriodReport['period'];
      analytics: VendorFinanceAnalyticsPoint[];
    }>
  >('/dashboard/vendor/finance/analytics', { params: { period } });
  return data.data;
}

export async function fetchVendorTransactions(
  page = 1,
  type: TransactionTypeFilter = 'all',
): Promise<{
  transactions: FinancialTransaction[];
  pagination: { current_page: number; last_page: number; total: number };
}> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{
      transactions: FinancialTransaction[];
      pagination: { current_page: number; last_page: number; total: number };
    }>
  >('/dashboard/vendor/finance/transactions', {
    params: { page, type: type === 'all' ? undefined : type },
  });
  return data.data;
}

export async function fetchVendorPayouts(page = 1): Promise<{
  payouts: VendorPayout[];
  pagination: { current_page: number; last_page: number; total: number };
}> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{
      payouts: VendorPayout[];
      pagination: { current_page: number; last_page: number; total: number };
    }>
  >('/dashboard/vendor/finance/payouts', { params: { page } });
  return data.data;
}

export async function downloadVendorFinanceReport(
  period: FinancePeriod = 'month',
  type: TransactionTypeFilter = 'all',
): Promise<Blob> {
  const response = await apiClient.get<ArrayBuffer>('/dashboard/vendor/finance/report', {
    params: { period, type: type === 'all' ? undefined : type },
    responseType: 'arraybuffer',
  });

  return new Blob([response.data], { type: 'text/csv;charset=utf-8' });
}

export async function requestVendorPayout(amount: string): Promise<VendorPayout> {
  const { data } = await apiClient.post<ApiSuccessResponse<{ payout: VendorPayout }>>(
    '/dashboard/vendor/finance/payouts',
    { amount },
  );
  return data.data.payout;
}

export type VendorDashboardOverview = {
  currency: string;
  period_sales: string;
  available_balance: string;
  pending_escrow: string;
  orders: {
    pending: number;
    completed: number;
    cancelled: number;
  };
  returns: {
    open: number;
  };
  preorders: {
    pending: number;
  };
  products: {
    active: number;
    low_stock: number;
  };
  sales_chart: Array<{ label: string; sales: string }>;
  recent_orders: Array<{
    id: string;
    order_number: string | null;
    status: string;
    vendor_total: string;
    product_name: string | null;
    created_at: string | null;
  }>;
  low_stock_products: Array<{
    id: string | null;
    name: string | null;
    image_url?: string | null;
    available_quantity: number;
    stock_quantity: number;
    status: 'out_of_stock' | 'low_stock';
  }>;
  top_selling_products: Array<{
    id: string | null;
    name: string | null;
    image_url?: string | null;
    orders_count: number;
    available_quantity: number;
    revenue: string;
  }>;
  store_reviews: {
    average_rating: number | null;
    review_count: number;
    distribution: Array<{ stars: number; count: number; percentage: number }>;
  };
};

export async function fetchVendorDashboardOverview(): Promise<VendorDashboardOverview> {
  const { data } = await apiClient.get<ApiSuccessResponse<{ overview: VendorDashboardOverview }>>(
    '/dashboard/vendor/overview',
  );
  return data.data.overview;
}
