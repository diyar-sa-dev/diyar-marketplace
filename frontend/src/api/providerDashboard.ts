import { apiClient } from './client.ts';
import { ensureCsrfCookie } from '../lib/csrf.ts';
import type { ApiSuccessResponse } from '../types/api.ts';
import type { ServiceRequestCard, ServiceRequestDetail } from '../types/serviceRequests.ts';
import type { ProviderBooking, ProviderInboxFilters } from '../types/providerDashboard.ts';

type Paginated<T> = {
  items: T[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

type ProviderInboxItem = ServiceRequestCard & {
  customer?: { name: string };
  attachments_count?: number;
  provider_has_offer?: boolean;
};

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

export async function fetchProviderServiceRequests(
  filters: ProviderInboxFilters = {},
): Promise<Paginated<ProviderInboxItem>> {
  const { data } = await apiClient.get<ApiSuccessResponse<Paginated<ProviderInboxItem>>>(
    `/dashboard/provider/service-requests${buildQuery(filters)}`,
  );
  return data.data;
}

export async function fetchProviderServiceRequest(id: string): Promise<ServiceRequestDetail> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{ service_request: ServiceRequestDetail }>
  >(`/dashboard/provider/service-requests/${id}`);
  return data.data.service_request;
}

export async function submitProviderServiceOffer(
  requestId: string,
  payload: {
    proposed_price: number;
    duration_days?: number;
    message: string;
    quotation?: File;
  },
): Promise<void> {
  await ensureCsrfCookie();
  const formData = new FormData();
  formData.append('proposed_price', String(payload.proposed_price));
  formData.append('message', payload.message);
  if (payload.duration_days) {
    formData.append('duration_days', String(payload.duration_days));
  }
  if (payload.quotation) {
    formData.append('quotation', payload.quotation);
  }
  await apiClient.post(`/service-requests/${requestId}/offers`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function fetchProviderBookings(
  page = 1,
  perPage = 20,
): Promise<Paginated<ProviderBooking>> {
  const { data } = await apiClient.get<ApiSuccessResponse<Paginated<ProviderBooking>>>(
    `/dashboard/provider/bookings${buildQuery({ page, per_page: perPage })}`,
  );
  return data.data;
}

export async function startProviderBooking(bookingId: string): Promise<ProviderBooking> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<{ booking: ProviderBooking }>>(
    `/dashboard/provider/bookings/${bookingId}/start`,
  );
  return data.data.booking;
}

export async function completeProviderBooking(bookingId: string): Promise<ProviderBooking> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<{ booking: ProviderBooking }>>(
    `/dashboard/provider/bookings/${bookingId}/complete`,
  );
  return data.data.booking;
}
