import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as providerDashboardApi from '../../api/providerDashboard.ts';
import type { ProviderBookingFilters } from '../../api/providerDashboard.ts';
import type { FinancePeriod } from '../../api/vendorFinance.ts';
import type { ProviderInboxFilters } from '../../types/providerDashboard.ts';

export const providerDashboardKeys = {
  all: ['provider-dashboard'] as const,
  inbox: (filters: ProviderInboxFilters) =>
    [...providerDashboardKeys.all, 'inbox', filters] as const,
  request: (id: string) => [...providerDashboardKeys.all, 'request', id] as const,
  bookings: (filters: ProviderBookingFilters) =>
    [...providerDashboardKeys.all, 'bookings', filters] as const,
  ownServices: (page: number, perPage: number, q?: string) =>
    [...providerDashboardKeys.all, 'own-services', page, perPage, q ?? ''] as const,
  financeSummary: (period: FinancePeriod) =>
    [...providerDashboardKeys.all, 'finance-summary', period] as const,
  financeAnalytics: (period: FinancePeriod) =>
    [...providerDashboardKeys.all, 'finance-analytics', period] as const,
  financeTransactions: (page: number, perPage: number, type?: string, period?: FinancePeriod) =>
    [
      ...providerDashboardKeys.all,
      'finance-transactions',
      page,
      perPage,
      type ?? 'all',
      period ?? 'month',
    ] as const,
  settings: () => [...providerDashboardKeys.all, 'settings'] as const,
};

export function useProviderServiceRequests(filters: ProviderInboxFilters = {}) {
  return useQuery({
    queryKey: providerDashboardKeys.inbox(filters),
    queryFn: () => providerDashboardApi.fetchProviderServiceRequests(filters),
  });
}

export function useProviderServiceRequest(id: string | undefined) {
  return useQuery({
    queryKey: providerDashboardKeys.request(id ?? ''),
    queryFn: () => providerDashboardApi.fetchProviderServiceRequest(id!),
    enabled: Boolean(id),
  });
}

export function useSubmitProviderServiceOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      payload,
    }: {
      requestId: string;
      payload: {
        proposed_price: number;
        duration_days?: number;
        message: string;
        proposed_scheduled_date?: string;
        proposed_scheduled_time?: string;
        quotation?: File;
      };
    }) => providerDashboardApi.submitProviderServiceOffer(requestId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: providerDashboardKeys.all });
    },
  });
}

export function useProviderBookings(
  filters: ProviderBookingFilters = {},
  options?: { refetchOnMount?: boolean | 'always' },
) {
  return useQuery({
    queryKey: providerDashboardKeys.bookings(filters),
    queryFn: () => providerDashboardApi.fetchProviderBookings(filters),
    refetchOnMount: options?.refetchOnMount ?? true,
  });
}

export function useProviderBookingActions() {
  const queryClient = useQueryClient();

  const start = useMutation({
    mutationFn: (bookingId: string) => providerDashboardApi.startProviderBooking(bookingId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: providerDashboardKeys.all });
    },
  });

  const complete = useMutation({
    mutationFn: (bookingId: string) => providerDashboardApi.completeProviderBooking(bookingId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: providerDashboardKeys.all });
    },
  });

  const cancel = useMutation({
    mutationFn: (bookingId: string) => providerDashboardApi.cancelProviderBooking(bookingId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: providerDashboardKeys.all });
    },
  });

  const confirm = useMutation({
    mutationFn: (bookingId: string) => providerDashboardApi.confirmProviderBooking(bookingId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: providerDashboardKeys.all });
    },
  });

  const proposeSchedule = useMutation({
    mutationFn: ({
      bookingId,
      payload,
    }: {
      bookingId: string;
      payload: {
        proposed_scheduled_date: string;
        proposed_scheduled_time: string;
        provider_notes?: string;
      };
    }) => providerDashboardApi.proposeProviderBookingSchedule(bookingId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: providerDashboardKeys.all });
    },
  });

  return { start, complete, cancel, confirm, proposeSchedule };
}

export function useProviderOwnServices(page = 1, perPage = 50, q?: string) {
  return useQuery({
    queryKey: providerDashboardKeys.ownServices(page, perPage, q),
    queryFn: () => providerDashboardApi.fetchProviderOwnServices(page, perPage, q),
  });
}

export function useProviderFinanceSummary(period: FinancePeriod = 'month') {
  return useQuery({
    queryKey: providerDashboardKeys.financeSummary(period),
    queryFn: () => providerDashboardApi.fetchProviderFinanceSummary(period),
    refetchOnMount: 'always',
  });
}

export function useProviderFinanceAnalytics(period: FinancePeriod = 'month') {
  return useQuery({
    queryKey: providerDashboardKeys.financeAnalytics(period),
    queryFn: () => providerDashboardApi.fetchProviderFinanceAnalytics(period),
    refetchOnMount: 'always',
  });
}

export function useProviderFinanceTransactions(
  page = 1,
  type?: string,
  perPage = 20,
  period: FinancePeriod = 'month',
) {
  return useQuery({
    queryKey: providerDashboardKeys.financeTransactions(page, perPage, type, period),
    queryFn: () => providerDashboardApi.fetchProviderFinanceTransactions(page, perPage, type, period),
    refetchOnMount: 'always',
  });
}

export function useRequestProviderPayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: providerDashboardApi.requestProviderPayout,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: providerDashboardKeys.all });
    },
  });
}

export function useDownloadProviderFinanceReport() {
  return useMutation({
    mutationFn: (period: FinancePeriod = 'month') =>
      providerDashboardApi.downloadProviderFinanceReport(period),
  });
}

export function useProviderSettings(enabled = true) {
  return useQuery({
    queryKey: providerDashboardKeys.settings(),
    queryFn: providerDashboardApi.fetchProviderSettings,
    enabled,
  });
}

export function useUpdateProviderProfileSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: providerDashboardApi.updateProviderProfileSettings,
    onSuccess: (settings) => {
      queryClient.setQueryData(providerDashboardKeys.settings(), settings);
    },
  });
}

export function useUpdateProviderWorkingHours() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: providerDashboardApi.updateProviderWorkingHours,
    onSuccess: (settings) => {
      queryClient.setQueryData(providerDashboardKeys.settings(), settings);
    },
  });
}

export function useUpdateProviderAccountSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: providerDashboardApi.updateProviderAccountSettings,
    onSuccess: (settings) => {
      queryClient.setQueryData(providerDashboardKeys.settings(), settings);
    },
  });
}

export function useUpdateProviderPasswordSettings() {
  return useMutation({
    mutationFn: providerDashboardApi.updateProviderPasswordSettings,
  });
}

export function useUpdateProviderNotificationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: providerDashboardApi.updateProviderNotificationSettings,
    onSuccess: (settings) => {
      queryClient.setQueryData(providerDashboardKeys.settings(), settings);
    },
  });
}

export function useUploadProviderAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: providerDashboardApi.uploadProviderAvatar,
    onSuccess: (settings) => {
      queryClient.setQueryData(providerDashboardKeys.settings(), settings);
    },
  });
}

export function useDeleteProviderAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: providerDashboardApi.deleteProviderAvatar,
    onSuccess: (settings) => {
      queryClient.setQueryData(providerDashboardKeys.settings(), settings);
    },
  });
}

export function useUpdateProviderBankAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: providerDashboardApi.updateProviderBankAccount,
    onSuccess: (settings) => {
      queryClient.setQueryData(providerDashboardKeys.settings(), settings);
    },
  });
}

export function useCreateProviderService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: providerDashboardApi.createProviderService,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: providerDashboardKeys.all });
    },
  });
}

export function useUpdateProviderService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      serviceId,
      payload,
    }: {
      serviceId: string;
      payload: Parameters<typeof providerDashboardApi.updateProviderService>[1];
    }) => providerDashboardApi.updateProviderService(serviceId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: providerDashboardKeys.all });
    },
  });
}

export function useDeleteProviderService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: providerDashboardApi.deleteProviderService,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: providerDashboardKeys.all });
    },
  });
}
