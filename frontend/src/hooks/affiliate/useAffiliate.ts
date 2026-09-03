import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as affiliateApi from '../../api/affiliate.ts';
import type {
  AffiliateReportPeriod,
  AffiliateSettingsPayload,
  CreateAffiliateLinkPayload,
  VendorProductAffiliatePayload,
} from '../../types/affiliate.ts';

export const affiliateKeys = {
  all: ['affiliate'] as const,
  overview: (from?: string, to?: string) => [...affiliateKeys.all, 'overview', from, to] as const,
  products: (page: number, perPage: number, search?: string) =>
    [...affiliateKeys.all, 'products', page, perPage, search ?? ''] as const,
  links: (page: number, perPage: number) => [...affiliateKeys.all, 'links', page, perPage] as const,
  reports: (period: AffiliateReportPeriod) => [...affiliateKeys.all, 'reports', period] as const,
  payouts: (page: number, perPage: number, period?: AffiliateReportPeriod) =>
    [...affiliateKeys.all, 'payouts', page, perPage, period ?? 'month'] as const,
  financeTransactions: (
    page: number,
    perPage: number,
    type?: string,
    period?: AffiliateReportPeriod,
  ) =>
    [
      ...affiliateKeys.all,
      'finance-transactions',
      page,
      perPage,
      type ?? 'all',
      period ?? 'month',
    ] as const,
  settings: () => [...affiliateKeys.all, 'settings'] as const,
  platformConfig: () => [...affiliateKeys.all, 'platform-config'] as const,
  vendorProductAffiliate: (productId: string) =>
    [...affiliateKeys.all, 'vendor-product', productId] as const,
};

export function useAffiliateOverview(from?: string, to?: string) {
  return useQuery({
    queryKey: affiliateKeys.overview(from, to),
    queryFn: () => affiliateApi.fetchAffiliateOverview({ from, to }),
  });
}

export function useAffiliateProducts(page = 1, perPage = 20, search?: string) {
  return useQuery({
    queryKey: affiliateKeys.products(page, perPage, search),
    queryFn: () => affiliateApi.fetchAffiliateProducts(page, perPage, search),
  });
}

export function useAffiliateLinks(page = 1, perPage = 20) {
  return useQuery({
    queryKey: affiliateKeys.links(page, perPage),
    queryFn: () => affiliateApi.fetchAffiliateLinks(page, perPage),
  });
}

export function useCreateAffiliateLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAffiliateLinkPayload) => affiliateApi.createAffiliateLink(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: affiliateKeys.links(1, 20) });
      void queryClient.invalidateQueries({ queryKey: affiliateKeys.overview() });
      void queryClient.invalidateQueries({ queryKey: affiliateKeys.reports('month') });
    },
  });
}

export function useDeactivateAffiliateLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (linkId: string) => affiliateApi.deactivateAffiliateLink(linkId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: affiliateKeys.links(1, 20) });
      void queryClient.invalidateQueries({ queryKey: affiliateKeys.overview() });
    },
  });
}

export function useAffiliateReports(period: AffiliateReportPeriod = 'month') {
  return useQuery({
    queryKey: affiliateKeys.reports(period),
    queryFn: () => affiliateApi.fetchAffiliateReports(period),
  });
}

export function useAffiliatePayouts(
  page = 1,
  perPage = 20,
  period: AffiliateReportPeriod = 'month',
) {
  return useQuery({
    queryKey: affiliateKeys.payouts(page, perPage, period),
    queryFn: () => affiliateApi.fetchAffiliatePayouts(page, perPage, period),
  });
}

export function useAffiliateFinanceTransactions(
  page = 1,
  perPage = 20,
  type?: string,
  period: AffiliateReportPeriod = 'month',
) {
  return useQuery({
    queryKey: affiliateKeys.financeTransactions(page, perPage, type, period),
    queryFn: () => affiliateApi.fetchAffiliateFinanceTransactions(page, perPage, type, period),
  });
}

export function useRequestAffiliatePayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ amount, idempotencyKey }: { amount: string; idempotencyKey?: string }) =>
      affiliateApi.requestAffiliatePayout(amount, idempotencyKey),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...affiliateKeys.all, 'payouts'] });
      void queryClient.invalidateQueries({
        queryKey: [...affiliateKeys.all, 'finance-transactions'],
      });
      void queryClient.invalidateQueries({ queryKey: affiliateKeys.overview() });
      void queryClient.invalidateQueries({ queryKey: affiliateKeys.reports('month') });
    },
  });
}

export function useAffiliatePlatformConfig() {
  return useQuery({
    queryKey: affiliateKeys.platformConfig(),
    queryFn: affiliateApi.fetchAffiliatePlatformConfig,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAffiliateSettings() {
  return useQuery({
    queryKey: affiliateKeys.settings(),
    queryFn: affiliateApi.fetchAffiliateSettings,
  });
}

export function useUpdateAffiliateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AffiliateSettingsPayload) =>
      affiliateApi.updateAffiliateSettings(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: affiliateKeys.settings() });
    },
  });
}

export function useVendorProductAffiliate(productId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: affiliateKeys.vendorProductAffiliate(productId ?? ''),
    queryFn: () => affiliateApi.fetchVendorProductAffiliate(productId!),
    enabled: enabled && Boolean(productId),
  });
}

export function useUpdateVendorProductAffiliate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      payload,
    }: {
      productId: string;
      payload: VendorProductAffiliatePayload;
    }) => affiliateApi.updateVendorProductAffiliate(productId, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: affiliateKeys.vendorProductAffiliate(variables.productId),
      });
      void queryClient.invalidateQueries({ queryKey: affiliateKeys.products(1, 20, '') });
    },
  });
}

export function useTrackAffiliateClick() {
  return useMutation({
    mutationFn: affiliateApi.trackAffiliateClick,
  });
}
