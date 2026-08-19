import { apiClient } from './client.ts';
import { ensureCsrfCookie } from '../lib/csrf.ts';
import type { ApiSuccessResponse } from '../types/api.ts';
import type {
  CreateServiceRequestPayload,
  PaginatedServiceRequests,
  ServiceBooking,
  ServiceOffer,
  ServiceRequestDetail,
  ServiceRequestAttachment,
} from '../types/serviceRequests.ts';

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

export async function fetchServiceRequests(
  page = 1,
  status = 'all',
  perPage = 10,
): Promise<PaginatedServiceRequests> {
  const { data } = await apiClient.get<ApiSuccessResponse<PaginatedServiceRequests>>(
    `/service-requests${buildQuery({ page, status, per_page: perPage })}`,
  );
  return data.data;
}

export async function fetchServiceRequest(id: string): Promise<ServiceRequestDetail> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{ service_request: ServiceRequestDetail }>
  >(`/service-requests/${id}`);
  return data.data.service_request;
}

export async function createServiceRequest(
  payload: CreateServiceRequestPayload,
): Promise<ServiceRequestDetail> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<
    ApiSuccessResponse<{ service_request: ServiceRequestDetail }>
  >('/service-requests', payload);
  return data.data.service_request;
}

export async function uploadServiceRequestAttachment(
  requestId: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<ServiceRequestAttachment> {
  await ensureCsrfCookie();
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post<
    ApiSuccessResponse<{ attachment: ServiceRequestAttachment }>
  >(`/service-requests/${requestId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (event.total) {
        onProgress?.(Math.round((event.loaded * 100) / event.total));
      }
    },
  });
  return data.data.attachment;
}

export async function acceptServiceOffer(
  offerId: string,
  payload: { location?: string; scheduled_date?: string; customer_notes?: string } = {},
): Promise<ServiceOffer> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<{ offer: ServiceOffer }>>(
    `/service-offers/${offerId}/accept`,
    payload,
  );
  return data.data.offer;
}

export async function rejectServiceOffer(offerId: string): Promise<ServiceOffer> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<{ offer: ServiceOffer }>>(
    `/service-offers/${offerId}/reject`,
  );
  return data.data.offer;
}

export async function simulateServiceBookingPayment(
  bookingId: string,
  outcome: 'paid' | 'failed',
): Promise<ServiceBooking> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<{ booking: ServiceBooking }>>(
    `/service-bookings/${bookingId}/payment/simulate`,
    { outcome },
  );
  return data.data.booking;
}

export async function cancelServiceRequest(requestId: string): Promise<ServiceRequestDetail> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<
    ApiSuccessResponse<{ service_request: ServiceRequestDetail }>
  >(`/service-requests/${requestId}/cancel`);
  return data.data.service_request;
}
