import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as serviceBookingsApi from '../../api/serviceBookings.ts';
import { simulateServiceBookingPayment } from '../../api/serviceRequests.ts';

export const serviceBookingKeys = {
  customerList: (page: number, perPage: number) =>
    ['customer-service-bookings', page, perPage] as const,
};

export function useCustomerServiceBookings(page = 1, perPage = 10) {
  return useQuery({
    queryKey: serviceBookingKeys.customerList(page, perPage),
    queryFn: () => serviceBookingsApi.fetchCustomerServiceBookings(page, perPage),
  });
}

export function useDirectBookingPreview(serviceSlug: string | undefined) {
  return useMutation({
    mutationFn: (payload: {
      scheduled_date: string;
      scheduled_time: string;
      location?: string;
      customer_notes?: string;
    }) => serviceBookingsApi.fetchDirectBookingPreview(serviceSlug!, payload),
  });
}

export function useCreateDirectBooking(serviceSlug: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      scheduled_date: string;
      scheduled_time: string;
      location?: string;
      customer_notes?: string;
      idempotency_key?: string;
    }) => serviceBookingsApi.createDirectBooking(serviceSlug!, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customer-service-bookings'] });
    },
  });
}

export function useDirectBookingPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, outcome }: { bookingId: string; outcome: 'paid' | 'failed' }) =>
      simulateServiceBookingPayment(bookingId, outcome),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customer-service-bookings'] });
    },
  });
}

export function useAcceptBookingSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => serviceBookingsApi.acceptBookingSchedule(bookingId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customer-service-bookings'] });
    },
  });
}

export function useDeclineBookingSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => serviceBookingsApi.declineBookingSchedule(bookingId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customer-service-bookings'] });
    },
  });
}

export function useCancelCustomerBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => serviceBookingsApi.cancelCustomerBooking(bookingId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customer-service-bookings'] });
    },
  });
}
