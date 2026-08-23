import { adminApi } from '../../api/client.ts';
import type { ApiSuccessResponse } from '../../types/api.ts';

export type AdminFinancePeriod = 'day' | 'week' | 'month' | 'year';

export type AdminFinanceReport = {
  period: {
    type: AdminFinancePeriod;
    from: string;
    to: string;
  };
  summary: {
    currency: string;
    platform_earnings: string;
    gross_sales: string;
    platform_commission: string;
    affiliate_commission: string;
    refunds: string;
    net_earnings: string;
    pending_escrow: string;
    pending_vendor_payouts: string;
    pending_affiliate_payouts: string;
  };
  orders: {
    completed: number;
    average_order_value: string;
  };
};

export async function fetchAdminFinanceReport(
  period: AdminFinancePeriod = 'month',
): Promise<AdminFinanceReport> {
  const { data } = await adminApi.get<ApiSuccessResponse<{ report: AdminFinanceReport }>>(
    '/admin/finance/summary',
    { params: { period } },
  );

  return data.data.report;
}

export async function downloadAdminFinanceReport(
  period: AdminFinancePeriod = 'month',
): Promise<Blob> {
  const response = await adminApi.get<ArrayBuffer>('/admin/finance/report', {
    params: { period },
    responseType: 'arraybuffer',
  });

  return new Blob([response.data], { type: 'text/csv;charset=utf-8' });
}
