import { apiClient } from './client.ts';
import { ensureCsrfCookie } from '../lib/csrf.ts';
import type { ApiSuccessResponse } from '../types/api.ts';
import type { ServiceBooking } from '../types/serviceRequests.ts';
import type { PaginationMeta } from '../types/services.ts';

export interface DirectBookingPreview {
  service: {
    id: string;
    title: string;
    slug: string;
    duration_minutes: number;
    duration_label?: string | null;
  };
  provider: {
    id: string;
    display_name: string;
    slug: string;
  };
  price: string;
  currency: string;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  location?: string | null;
  customer_notes?: string | null;
}

export interface PaginatedCustomerBookings {
  items: ServiceBooking[];
  pagination: PaginationMeta;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

export async function fetchCustomerServiceBookings(
  page = 1,
  perPage = 10,
): Promise<PaginatedCustomerBookings> {
  const { data } = await apiClient.get<ApiSuccessResponse<PaginatedCustomerBookings>>(
    `/service-bookings${buildQuery({ page, per_page: perPage })}`,
  );
  return data.data;
}

export async function fetchDirectBookingPreview(
  serviceSlug: string,
  payload: {
    scheduled_date: string;
    scheduled_time: string;
    location?: string;
    customer_notes?: string;
  },
): Promise<DirectBookingPreview> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<{ preview: DirectBookingPreview }>>(
    `/services/${serviceSlug}/booking-preview`,
    payload,
  );
  return data.data.preview;
}

export async function createDirectBooking(
  serviceSlug: string,
  payload: {
    scheduled_date: string;
    scheduled_time: string;
    location?: string;
    customer_notes?: string;
    idempotency_key?: string;
  },
): Promise<ServiceBooking> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<{ booking: ServiceBooking }>>(
    `/services/${serviceSlug}/direct-booking`,
    payload,
  );
  return data.data.booking;
}

export async function acceptBookingSchedule(bookingId: string): Promise<ServiceBooking> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<{ booking: ServiceBooking }>>(
    `/service-bookings/${bookingId}/accept-schedule`,
  );
  return data.data.booking;
}

export async function declineBookingSchedule(bookingId: string): Promise<ServiceBooking> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<{ booking: ServiceBooking }>>(
    `/service-bookings/${bookingId}/decline-schedule`,
  );
  return data.data.booking;
}

export async function cancelCustomerBooking(bookingId: string): Promise<ServiceBooking> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<{ booking: ServiceBooking }>>(
    `/service-bookings/${bookingId}/cancel`,
  );
  return data.data.booking;
}
