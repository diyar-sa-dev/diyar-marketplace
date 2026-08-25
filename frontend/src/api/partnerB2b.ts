import { apiClient } from './client.ts';
import { ensureCsrfCookie } from '../lib/csrf.ts';
import type { ApiSuccessResponse } from '../types/api.ts';
import type {
  B2bCategory,
  B2bTag,
  PartnerB2bCompanyPayload,
  PartnerB2bCompanyResponse,
  PartnerB2bLeadDetailResponse,
  PartnerB2bLeadListFilters,
  PartnerB2bLeadListResponse,
  PartnerB2bLeadStatus,
  PartnerB2bPortal,
} from '../types/b2b.ts';
import type { AxiosRequestConfig } from 'axios';

function partnerPortalPath(portal: PartnerB2bPortal): string {
  return portal === 'vendor' ? '/dashboard/vendor/b2b' : '/dashboard/provider/b2b';
}

function partnerBasePath(portal: PartnerB2bPortal): string {
  return `${partnerPortalPath(portal)}/company`;
}

function multipartUploadConfig(
  onProgress?: (percent: number) => void,
): AxiosRequestConfig {
  return {
    adapter: 'xhr',
    transformRequest: [
      (data, headers) => {
        if (data instanceof FormData && headers) {
          if (typeof headers.delete === 'function') {
            headers.delete('Content-Type');
          } else {
            delete (headers as Record<string, unknown>)['Content-Type'];
          }
        }
        return data;
      },
    ],
    onUploadProgress: onProgress
      ? (event) => {
          if (event.total) {
            onProgress(Math.round((event.loaded * 100) / event.total));
          }
        }
      : undefined,
  };
}

export async function fetchPartnerB2bCategories(portal: PartnerB2bPortal) {
  const { data } = await apiClient.get<ApiSuccessResponse<{ categories: B2bCategory[] }>>(
    `${partnerPortalPath(portal)}/categories`,
  );
  return data.data.categories;
}

export async function fetchPartnerB2bTags(portal: PartnerB2bPortal) {
  const { data } = await apiClient.get<ApiSuccessResponse<{ tags: B2bTag[] }>>(
    `${partnerPortalPath(portal)}/tags`,
  );
  return data.data.tags;
}

async function withCsrf<T>(action: () => Promise<T>): Promise<T> {
  await ensureCsrfCookie();
  return action();
}

export async function fetchPartnerB2bCompany(portal: PartnerB2bPortal) {
  const { data } = await apiClient.get<PartnerB2bCompanyResponse>(partnerBasePath(portal));
  return data.data.company;
}

export async function createPartnerB2bCompany(
  portal: PartnerB2bPortal,
  payload: PartnerB2bCompanyPayload,
) {
  const { data } = await withCsrf(() =>
    apiClient.post<PartnerB2bCompanyResponse>(partnerBasePath(portal), payload),
  );
  return data.data.company;
}

export async function updatePartnerB2bCompany(
  portal: PartnerB2bPortal,
  payload: Partial<PartnerB2bCompanyPayload>,
) {
  const { data } = await withCsrf(() =>
    apiClient.patch<PartnerB2bCompanyResponse>(partnerBasePath(portal), payload),
  );
  return data.data.company;
}

export async function uploadPartnerB2bImage(
  portal: PartnerB2bPortal,
  file: File,
  type: 'logo' | 'cover',
) {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('type', type);

  const { data } = await withCsrf(() =>
    apiClient.post<ApiSuccessResponse<{ path: string; url: string; type: string }>>(
      `${partnerBasePath(portal)}/media`,
      formData,
      multipartUploadConfig(),
    ),
  );

  return data.data;
}

type PartnerPortfolioUploadResponse = ApiSuccessResponse<{
  company: import('../types/b2b.ts').PartnerB2bCompanyDetail;
  image: { path: string; url: string };
}>;

export async function uploadPartnerB2bPortfolioImage(
  portal: PartnerB2bPortal,
  file: File,
  onProgress?: (percent: number) => void,
) {
  const formData = new FormData();
  formData.append('image', file);

  const { data } = await withCsrf(() =>
    apiClient.post<PartnerPortfolioUploadResponse>(
      `${partnerBasePath(portal)}/portfolio`,
      formData,
      multipartUploadConfig(onProgress),
    ),
  );

  return data.data;
}

export async function deletePartnerB2bPortfolioImage(portal: PartnerB2bPortal, imageId: string) {
  const { data } = await withCsrf(() =>
    apiClient.delete<ApiSuccessResponse<{ company: import('../types/b2b.ts').PartnerB2bCompanyDetail }>>(
      `${partnerBasePath(portal)}/portfolio/${imageId}`,
    ),
  );

  return data.data;
}

export async function fetchPartnerB2bLeads(
  portal: PartnerB2bPortal,
  filters: PartnerB2bLeadListFilters = {},
) {
  const { data } = await apiClient.get<PartnerB2bLeadListResponse>(
    `${partnerPortalPath(portal)}/leads`,
    {
      params: {
        page: filters.page ?? 1,
        per_page: filters.per_page ?? 10,
        status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        q: filters.q?.trim() || undefined,
      },
    },
  );
  return data.data;
}

export async function fetchPartnerB2bLead(portal: PartnerB2bPortal, leadId: string) {
  const { data } = await apiClient.get<PartnerB2bLeadDetailResponse>(
    `${partnerPortalPath(portal)}/leads/${leadId}`,
  );
  return data.data.lead;
}

export async function updatePartnerB2bLeadStatus(
  portal: PartnerB2bPortal,
  leadId: string,
  status: Exclude<PartnerB2bLeadStatus, 'new'>,
) {
  const { data } = await withCsrf(() =>
    apiClient.patch<PartnerB2bLeadDetailResponse>(
      `${partnerPortalPath(portal)}/leads/${leadId}`,
      { status },
    ),
  );
  return data.data.lead;
}
