import { apiClient } from './client.ts';
import type {
  PaginatedServices,
  ProviderFollowResponse,
  ProviderPublic,
  ProviderResponse,
  RelatedServicesResponse,
  ServiceCategoriesResponse,
  ServiceDetail,
  ServiceDetailResponse,
  ServiceListFilters,
  ServicesResponse,
} from '../types/services.ts';

function buildQuery(filters: ServiceListFilters = {}): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });
  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function fetchServiceCategories() {
  const response = await apiClient.get<ServiceCategoriesResponse>('/service-categories');
  return response.data.data.categories;
}

export async function fetchServices(filters: ServiceListFilters = {}): Promise<PaginatedServices> {
  const response = await apiClient.get<ServicesResponse>(`/services${buildQuery(filters)}`);
  return response.data.data;
}

export async function fetchService(identifier: string): Promise<ServiceDetail> {
  const response = await apiClient.get<ServiceDetailResponse>(`/services/${identifier}`);
  return response.data.data.service;
}

export async function fetchRelatedServices(identifier: string) {
  const response = await apiClient.get<RelatedServicesResponse>(`/services/${identifier}/related`);
  return response.data.data.items;
}

export async function fetchProvider(slug: string): Promise<ProviderPublic> {
  const response = await apiClient.get<ProviderResponse>(`/providers/${slug}`);
  return response.data.data.provider;
}

export async function fetchProviderServices(slug: string, filters: ServiceListFilters = {}) {
  const response = await apiClient.get<ServicesResponse>(
    `/providers/${slug}/services${buildQuery(filters)}`,
  );
  return response.data.data;
}

export async function followProvider(slug: string) {
  const response = await apiClient.post<ProviderFollowResponse>(`/providers/${slug}/follow`);
  return response.data.data.follow;
}

export async function unfollowProvider(slug: string) {
  const response = await apiClient.delete<ProviderFollowResponse>(`/providers/${slug}/follow`);
  return response.data.data.follow;
}
