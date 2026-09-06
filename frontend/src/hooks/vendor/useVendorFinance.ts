import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as financeApi from '../../api/vendorFinance.ts';
import type { FinancePeriod, TransactionTypeFilter } from '../../api/vendorFinance.ts';
import { isForbidden, parseApiError } from '../../utils/errors.ts';

function shouldRetryVendorQuery(failureCount: number, error: unknown): boolean {
  if (isForbidden(parseApiError(error))) {
    return false;
  }

  return failureCount < 1;
}

export const vendorFinanceKeys = {
  all: ['vendor-finance'] as const,
  report: (period: FinancePeriod) => [...vendorFinanceKeys.all, 'report', period] as const,
  analytics: (period: FinancePeriod) => [...vendorFinanceKeys.all, 'analytics', period] as const,
  transactions: (
    page: number,
    type: TransactionTypeFilter,
    perPage: number,
    period: FinancePeriod,
  ) => [...vendorFinanceKeys.all, 'transactions', page, type, perPage, period] as const,
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

export function useVendorTransactions(
  page = 1,
  type: TransactionTypeFilter = 'all',
  perPage = 20,
  period: FinancePeriod = 'month',
) {
  return useQuery({
    queryKey: vendorFinanceKeys.transactions(page, type, perPage, period),
    queryFn: () => financeApi.fetchVendorTransactions(page, type, perPage, period),
  });
}

export function useVendorPayouts(page = 1) {
  return useQuery({
    queryKey: vendorFinanceKeys.payouts(page),
    queryFn: () => financeApi.fetchVendorPayouts(page),
  });
}

export function useVendorDashboardOverview(enabled = true) {
  return useQuery({
    queryKey: vendorFinanceKeys.overview(),
    queryFn: financeApi.fetchVendorDashboardOverview,
    enabled,
    staleTime: 90_000,
    retry: shouldRetryVendorQuery,
    refetchInterval: (query) => (query.state.fetchFailureCount > 0 ? false : 60_000),
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
