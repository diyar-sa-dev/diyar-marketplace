import { apiClient } from './client.ts';
import { ensureCsrfCookie } from '../lib/csrf.ts';
import type { ApiSuccessResponse } from '../types/api.ts';
import type { ServiceRequestCard, ServiceRequestDetail } from '../types/serviceRequests.ts';
import type {
  ProviderBooking,
  ProviderFinanceAnalyticsPoint,
  ProviderFinanceSummary,
  ProviderFinanceTransaction,
  ProviderInboxFilters,
  ProviderServiceFormPayload,
  ProviderSettings,
} from '../types/providerDashboard.ts';
import type { ServiceCard } from '../types/services.ts';

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

export type ProviderBookingFilters = {
  page?: number;
  per_page?: number;
  status?: 'all' | 'pending' | 'upcoming' | 'completed' | 'cancelled';
  q?: string;
};

export async function submitProviderServiceOffer(
  requestId: string,
  payload: {
    proposed_price: number;
    duration_days?: number;
    message: string;
    proposed_scheduled_date?: string;
    proposed_scheduled_time?: string;
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
  if (payload.proposed_scheduled_date) {
    formData.append('proposed_scheduled_date', payload.proposed_scheduled_date);
  }
  if (payload.proposed_scheduled_time) {
    formData.append('proposed_scheduled_time', payload.proposed_scheduled_time);
  }
  if (payload.quotation) {
    formData.append('quotation', payload.quotation);
  }
  await apiClient.post(`/service-requests/${requestId}/offers`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function fetchProviderBookings(
  filters: ProviderBookingFilters = {},
): Promise<Paginated<ProviderBooking>> {
  const { data } = await apiClient.get<ApiSuccessResponse<Paginated<ProviderBooking>>>(
    `/dashboard/provider/bookings${buildQuery(filters)}`,
  );
  return data.data;
}

export async function cancelProviderBooking(bookingId: string): Promise<ProviderBooking> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<{ booking: ProviderBooking }>>(
    `/dashboard/provider/bookings/${bookingId}/cancel`,
  );
  return data.data.booking;
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

export async function confirmProviderBooking(bookingId: string): Promise<ProviderBooking> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<{ booking: ProviderBooking }>>(
    `/dashboard/provider/bookings/${bookingId}/confirm`,
  );
  return data.data.booking;
}

export async function proposeProviderBookingSchedule(
  bookingId: string,
  payload: {
    proposed_scheduled_date: string;
    proposed_scheduled_time: string;
    provider_notes?: string;
  },
): Promise<ProviderBooking> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<{ booking: ProviderBooking }>>(
    `/dashboard/provider/bookings/${bookingId}/propose-schedule`,
    payload,
  );
  return data.data.booking;
}

export async function fetchProviderOwnServices(
  page = 1,
  perPage = 50,
  q?: string,
): Promise<Paginated<ServiceCard>> {
  const { data } = await apiClient.get<ApiSuccessResponse<Paginated<ServiceCard>>>(
    `/dashboard/provider/services${buildQuery({ page, per_page: perPage, q })}`,
  );
  return data.data;
}

export async function fetchProviderFinanceSummary(): Promise<ProviderFinanceSummary> {
  const { data } = await apiClient.get<ApiSuccessResponse<{ summary: ProviderFinanceSummary }>>(
    '/dashboard/provider/finance/summary',
  );
  return data.data.summary;
}

export async function fetchProviderFinanceAnalytics(): Promise<ProviderFinanceAnalyticsPoint[]> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{ analytics: ProviderFinanceAnalyticsPoint[] }>
  >('/dashboard/provider/finance/analytics');
  return data.data.analytics;
}

export async function fetchProviderFinanceTransactions(
  page = 1,
  perPage = 20,
  type?: string,
): Promise<Paginated<ProviderFinanceTransaction>> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{
      transactions: ProviderFinanceTransaction[];
      pagination: Paginated<ProviderFinanceTransaction>['pagination'];
    }>
  >(`/dashboard/provider/finance/transactions${buildQuery({ page, per_page: perPage, type })}`);
  return {
    items: data.data.transactions,
    pagination: data.data.pagination,
  };
}

export async function downloadProviderFinanceReport(): Promise<Blob> {
  const { data } = await apiClient.get<Blob>('/dashboard/provider/finance/export', {
    responseType: 'blob',
  });
  return data;
}

export async function requestProviderPayout(payload: {
  amount: number;
  bank_account_id?: string;
}): Promise<void> {
  await ensureCsrfCookie();
  await apiClient.post('/dashboard/provider/finance/payouts', payload);
}

export async function fetchProviderSettings(): Promise<ProviderSettings> {
  const { data } = await apiClient.get<ApiSuccessResponse<{ settings: ProviderSettings }>>(
    '/dashboard/provider/settings',
  );
  return data.data.settings;
}

export async function updateProviderProfileSettings(payload: {
  specialty?: string;
  bio?: string;
  work_areas?: string;
}): Promise<ProviderSettings> {
  await ensureCsrfCookie();
  const { data } = await apiClient.patch<ApiSuccessResponse<{ settings: ProviderSettings }>>(
    '/dashboard/provider/settings/profile',
    payload,
  );
  return data.data.settings;
}

export async function updateProviderWorkingHours(
  hours: ProviderSettings['working_hours'],
): Promise<ProviderSettings> {
  await ensureCsrfCookie();
  const { data } = await apiClient.put<ApiSuccessResponse<{ settings: ProviderSettings }>>(
    '/dashboard/provider/settings/working-hours',
    { hours },
  );
  return data.data.settings;
}

export async function updateProviderAccountSettings(payload: {
  name?: string;
  email?: string;
}): Promise<ProviderSettings> {
  await ensureCsrfCookie();
  const { data } = await apiClient.patch<ApiSuccessResponse<{ settings: ProviderSettings }>>(
    '/dashboard/provider/settings/account',
    payload,
  );
  return data.data.settings;
}

export async function updateProviderPasswordSettings(payload: {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}): Promise<void> {
  await ensureCsrfCookie();
  await apiClient.patch('/dashboard/provider/settings/password', payload);
}

export async function updateProviderNotificationSettings(
  payload: Partial<ProviderSettings['notifications']>,
): Promise<ProviderSettings> {
  await ensureCsrfCookie();
  const { data } = await apiClient.patch<ApiSuccessResponse<{ settings: ProviderSettings }>>(
    '/dashboard/provider/settings/notifications',
    payload,
  );
  return data.data.settings;
}

export async function updateProviderBankAccount(payload: {
  bank_code: string;
  beneficiary_name: string;
  iban: string;
}): Promise<ProviderSettings> {
  await ensureCsrfCookie();
  const { data } = await apiClient.patch<ApiSuccessResponse<{ settings: ProviderSettings }>>(
    '/dashboard/provider/settings/bank-account',
    payload,
  );
  return data.data.settings;
}

export async function uploadProviderAvatar(file: File): Promise<ProviderSettings> {
  await ensureCsrfCookie();
  const formData = new FormData();
  formData.append('avatar', file);
  const { data } = await apiClient.post<ApiSuccessResponse<{ settings: ProviderSettings }>>(
    '/dashboard/provider/settings/avatar',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data.data.settings;
}

export async function deleteProviderAvatar(): Promise<ProviderSettings> {
  await ensureCsrfCookie();
  const { data } = await apiClient.delete<ApiSuccessResponse<{ settings: ProviderSettings }>>(
    '/dashboard/provider/settings/avatar',
  );
  return data.data.settings;
}

function buildServiceFormData(payload: ProviderServiceFormPayload): FormData {
  const formData = new FormData();
  formData.append('title', payload.title);
  formData.append('starting_price', String(payload.starting_price));
  if (payload.service_category_id) {
    formData.append('service_category_id', payload.service_category_id);
  }
  if (payload.duration_label) formData.append('duration_label', payload.duration_label);
  if (payload.service_type_label) formData.append('service_type_label', payload.service_type_label);
  if (payload.location) formData.append('location', payload.location);
  if (payload.description) formData.append('description', payload.description);
  if (payload.is_active !== undefined) formData.append('is_active', payload.is_active ? '1' : '0');
  if (payload.cover) formData.append('cover', payload.cover);
  return formData;
}

export async function createProviderService(
  payload: ProviderServiceFormPayload,
): Promise<ServiceCard> {
  await ensureCsrfCookie();
  if (payload.cover) {
    const { data } = await apiClient.post<ApiSuccessResponse<{ service: ServiceCard }>>(
      '/dashboard/provider/services',
      buildServiceFormData(payload),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data.data.service;
  }

  const { cover, ...jsonPayload } = payload;
  void cover;
  const { data } = await apiClient.post<ApiSuccessResponse<{ service: ServiceCard }>>(
    '/dashboard/provider/services',
    jsonPayload,
  );
  return data.data.service;
}

export async function updateProviderService(
  serviceId: string,
  payload: ProviderServiceFormPayload,
): Promise<ServiceCard> {
  await ensureCsrfCookie();
  if (payload.cover) {
    const { data } = await apiClient.patch<ApiSuccessResponse<{ service: ServiceCard }>>(
      `/dashboard/provider/services/${serviceId}`,
      buildServiceFormData(payload),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data.data.service;
  }

  const { cover, ...jsonPayload } = payload;
  void cover;
  const { data } = await apiClient.patch<ApiSuccessResponse<{ service: ServiceCard }>>(
    `/dashboard/provider/services/${serviceId}`,
    jsonPayload,
  );
  return data.data.service;
}

export async function deleteProviderService(serviceId: string): Promise<void> {
  await ensureCsrfCookie();
  await apiClient.delete(`/dashboard/provider/services/${serviceId}`);
}
