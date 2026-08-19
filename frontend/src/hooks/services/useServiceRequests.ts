import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as serviceRequestsApi from '../../api/serviceRequests.ts';
import type { CreateServiceRequestPayload } from '../../types/serviceRequests.ts';

export const serviceRequestKeys = {
  all: ['service-requests'] as const,
  list: (page: number, status: string, perPage = 10) =>
    [...serviceRequestKeys.all, 'list', page, status, perPage] as const,
  detail: (id: string) => [...serviceRequestKeys.all, 'detail', id] as const,
};

export function useServiceRequests(page = 1, status = 'all', perPage = 10, enabled = true) {
  return useQuery({
    queryKey: serviceRequestKeys.list(page, status, perPage),
    queryFn: () => serviceRequestsApi.fetchServiceRequests(page, status, perPage),
    enabled,
  });
}

export function useServiceRequest(id: string | undefined) {
  return useQuery({
    queryKey: serviceRequestKeys.detail(id ?? ''),
    queryFn: () => serviceRequestsApi.fetchServiceRequest(id!),
    enabled: Boolean(id),
  });
}

export function useCreateServiceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateServiceRequestPayload) =>
      serviceRequestsApi.createServiceRequest(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: serviceRequestKeys.all });
    },
  });
}

export function useUploadServiceRequestAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, file }: { requestId: string; file: File }) =>
      serviceRequestsApi.uploadServiceRequestAttachment(requestId, file),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: serviceRequestKeys.detail(variables.requestId),
      });
    },
  });
}

export function useAcceptServiceOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      offerId,
      payload,
    }: {
      offerId: string;
      payload?: { location?: string; scheduled_date?: string; customer_notes?: string };
    }) => serviceRequestsApi.acceptServiceOffer(offerId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: serviceRequestKeys.all });
    },
  });
}

export function useRejectServiceOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (offerId: string) => serviceRequestsApi.rejectServiceOffer(offerId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: serviceRequestKeys.all });
    },
  });
}

export function useSimulateServiceBookingPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, outcome }: { bookingId: string; outcome: 'paid' | 'failed' }) =>
      serviceRequestsApi.simulateServiceBookingPayment(bookingId, outcome),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: serviceRequestKeys.all });
    },
  });
}
