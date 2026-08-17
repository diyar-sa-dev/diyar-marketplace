import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as financeApi from '../../api/vendorFinance.ts';
import type { FinancePeriod, TransactionTypeFilter } from '../../api/vendorFinance.ts';

export const vendorFinanceKeys = {
  all: ['vendor-finance'] as const,
  report: (period: FinancePeriod) => [...vendorFinanceKeys.all, 'report', period] as const,
  analytics: (period: FinancePeriod) => [...vendorFinanceKeys.all, 'analytics', period] as const,
  transactions: (page: number, type: TransactionTypeFilter) =>
    [...vendorFinanceKeys.all, 'transactions', page, type] as const,
  payouts: (page: number) => [...vendorFinanceKeys.all, 'payouts', page] as const,
  overview: () => ['vendor-dashboard-overview'] as const,
};

export function useVendorFinanceReport(period: FinancePeriod = 'month') {
  return useQuery({
    queryKey: vendorFinanceKeys.report(period),
    queryFn: () => financeApi.fetchVendorFinanceReport(period),
  });
}

export function useVendorFinanceAnalytics(period: FinancePeriod = 'month') {
  return useQuery({
    queryKey: vendorFinanceKeys.analytics(period),
    queryFn: () => financeApi.fetchVendorFinanceAnalytics(period),
  });
}

export function useVendorTransactions(page = 1, type: TransactionTypeFilter = 'all') {
  return useQuery({
    queryKey: vendorFinanceKeys.transactions(page, type),
    queryFn: () => financeApi.fetchVendorTransactions(page, type),
  });
}

export function useVendorPayouts(page = 1) {
  return useQuery({
    queryKey: vendorFinanceKeys.payouts(page),
    queryFn: () => financeApi.fetchVendorPayouts(page),
  });
}

export function useVendorDashboardOverview() {
  return useQuery({
    queryKey: vendorFinanceKeys.overview(),
    queryFn: financeApi.fetchVendorDashboardOverview,
  });
}

export function useRequestVendorPayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (amount: string) => financeApi.requestVendorPayout(amount),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vendorFinanceKeys.all });
    },
  });
}

export function useDownloadVendorFinanceReport() {
  return useMutation({
    mutationFn: ({ period, type }: { period: FinancePeriod; type: TransactionTypeFilter }) =>
      financeApi.downloadVendorFinanceReport(period, type),
  });
}
