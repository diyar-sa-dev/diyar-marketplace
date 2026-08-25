import { apiClient } from './client.ts';
import type {
  B2bCategoriesResponse,
  B2bCompaniesResponse,
  B2bCompanyDetailResponse,
  B2bCompanyListFilters,
  B2bLeadResponse,
  CustomerB2bLeadDetailResponse,
  CustomerB2bLeadsResponse,
  PaginatedB2bCompanies,
  PaginatedCustomerB2bLeads,
  SubmitB2bLeadPayload,
} from '../types/b2b.ts';

function buildQuery(filters: B2bCompanyListFilters = {}): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });
  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function fetchB2bCompanies(
  filters: B2bCompanyListFilters = {},
): Promise<PaginatedB2bCompanies> {
  const response = await apiClient.get<B2bCompaniesResponse>(`/b2b/companies${buildQuery(filters)}`);
  return response.data.data;
}

export async function fetchB2bCompany(slug: string) {
  const response = await apiClient.get<B2bCompanyDetailResponse>(`/b2b/companies/${slug}`);
  return response.data.data;
}

export async function fetchB2bCategories() {
  const response = await apiClient.get<B2bCategoriesResponse>('/b2b/categories');
  return response.data.data.categories;
}

export async function submitB2bLead(slug: string, payload: SubmitB2bLeadPayload) {
  const response = await apiClient.post<B2bLeadResponse>(`/b2b/companies/${slug}/leads`, payload);
  return response.data.data.lead;
}

export async function fetchCustomerB2bLeads(page = 1, perPage = 10): Promise<PaginatedCustomerB2bLeads> {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  const response = await apiClient.get<CustomerB2bLeadsResponse>(`/b2b/leads?${params.toString()}`);
  return response.data.data;
}

export async function fetchCustomerB2bLead(leadId: string) {
  const response = await apiClient.get<CustomerB2bLeadDetailResponse>(`/b2b/leads/${leadId}`);
  return response.data.data.lead;
}
