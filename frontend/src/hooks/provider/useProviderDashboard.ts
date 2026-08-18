import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as providerDashboardApi from '../../api/providerDashboard.ts';
import type { ProviderInboxFilters } from '../../types/providerDashboard.ts';

export const providerDashboardKeys = {
  all: ['provider-dashboard'] as const,
  inbox: (filters: ProviderInboxFilters) =>
    [...providerDashboardKeys.all, 'inbox', filters] as const,
  request: (id: string) => [...providerDashboardKeys.all, 'request', id] as const,
  bookings: (page: number, perPage: number) =>
    [...providerDashboardKeys.all, 'bookings', page, perPage] as const,
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
        quotation?: File;
      };
    }) => providerDashboardApi.submitProviderServiceOffer(requestId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: providerDashboardKeys.all });
    },
  });
}

export function useProviderBookings(page = 1, perPage = 20) {
  return useQuery({
    queryKey: providerDashboardKeys.bookings(page, perPage),
    queryFn: () => providerDashboardApi.fetchProviderBookings(page, perPage),
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

  return { start, complete };
}
