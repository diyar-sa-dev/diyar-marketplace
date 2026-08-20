import { apiClient } from './client.ts';
import { ensureCsrfCookie } from '../lib/csrf.ts';
import type { ApiSuccessResponse } from '../types/api.ts';
import type {
  AffiliateAttribution,
  AffiliateLink,
  AffiliateLinksResponse,
  AffiliateOverviewStats,
  AffiliatePayout,
  AffiliatePayoutsResponse,
  AffiliateProductSetting,
  AffiliateProductsResponse,
  AffiliateProfile,
  AffiliateReportPeriod,
  AffiliateReportsResponse,
  AffiliateSettingsPayload,
  CreateAffiliateLinkPayload,
  VendorProductAffiliatePayload,
} from '../types/affiliate.ts';

function reportRangeFromPeriod(period: AffiliateReportPeriod): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);

  switch (period) {
    case 'day':
      break;
    case 'week':
      from.setDate(from.getDate() - 6);
      break;
    case '3m':
      from.setMonth(from.getMonth() - 3);
      break;
    case '6m':
      from.setMonth(from.getMonth() - 6);
      break;
    case '12m':
      from.setFullYear(from.getFullYear() - 1);
      break;
    case 'year':
      from.setFullYear(from.getFullYear() - 1);
      break;
    case 'month':
    default:
      from.setDate(from.getDate() - 29);
      break;
  }

  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export async function trackAffiliateClick(payload: {
  ref: string;
  product_id: string;
  session_fingerprint: string;
}): Promise<{ attributed: boolean; attribution?: AffiliateAttribution }> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<
    ApiSuccessResponse<{ attributed: boolean; attribution?: AffiliateAttribution }>
  >('/affiliate/referrals/click', payload);
  return data.data;
}

export async function resolveAffiliateReferral(params: {
  product_id: string;
  ref?: string;
  session_fingerprint?: string;
}): Promise<{ attributed: boolean; attribution?: AffiliateAttribution }> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{ attributed: boolean; attribution?: AffiliateAttribution }>
  >('/affiliate/referrals/resolve', { params });
  return data.data;
}

export async function fetchAffiliateOverview(params?: {
  from?: string;
  to?: string;
}): Promise<{ profile: AffiliateProfile; overview: AffiliateOverviewStats }> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{ profile: AffiliateProfile; overview: AffiliateOverviewStats }>
  >('/dashboard/affiliate', { params });
  return data.data;
}

export async function fetchAffiliateProducts(
  page = 1,
  perPage = 20,
  search?: string,
): Promise<AffiliateProductsResponse> {
  const { data } = await apiClient.get<ApiSuccessResponse<AffiliateProductsResponse>>(
    '/dashboard/affiliate/products',
    {
      params: {
        page,
        per_page: perPage,
        search: search?.trim() || undefined,
      },
    },
  );
  return data.data;
}

export async function fetchAffiliateLinks(page = 1, perPage = 20): Promise<AffiliateLinksResponse> {
  const { data } = await apiClient.get<ApiSuccessResponse<AffiliateLinksResponse>>(
    '/dashboard/affiliate/links',
    { params: { page, per_page: perPage } },
  );
  return data.data;
}

export async function createAffiliateLink(
  payload: CreateAffiliateLinkPayload,
): Promise<AffiliateLink> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<{ link: AffiliateLink }>>(
    '/dashboard/affiliate/links',
    payload,
  );
  return data.data.link;
}

export async function deactivateAffiliateLink(linkId: string): Promise<AffiliateLink> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<{ link: AffiliateLink }>>(
    `/dashboard/affiliate/links/${linkId}/deactivate`,
  );
  return data.data.link;
}

export async function fetchAffiliateReports(
  period: AffiliateReportPeriod = 'month',
): Promise<AffiliateReportsResponse> {
  const range = reportRangeFromPeriod(period);
  const { data } = await apiClient.get<ApiSuccessResponse<AffiliateReportsResponse>>(
    '/dashboard/affiliate/reports',
    { params: { period, ...range } },
  );
  return data.data;
}

export async function fetchAffiliatePayouts(
  page = 1,
  perPage = 20,
): Promise<AffiliatePayoutsResponse> {
  const { data } = await apiClient.get<ApiSuccessResponse<AffiliatePayoutsResponse>>(
    '/dashboard/affiliate/payouts',
    { params: { page, per_page: perPage } },
  );
  return data.data;
}

export async function requestAffiliatePayout(
  amount: string,
  idempotencyKey?: string,
): Promise<AffiliatePayout> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<{ payout: AffiliatePayout }>>(
    '/dashboard/affiliate/payouts',
    { amount },
    idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : undefined,
  );
  return data.data.payout;
}

export async function fetchAffiliateSettings(): Promise<AffiliateProfile> {
  const { data } = await apiClient.get<ApiSuccessResponse<{ profile: AffiliateProfile }>>(
    '/dashboard/affiliate/settings',
  );
  return data.data.profile;
}

export async function updateAffiliateSettings(
  payload: AffiliateSettingsPayload,
): Promise<AffiliateProfile> {
  await ensureCsrfCookie();
  const { data } = await apiClient.patch<ApiSuccessResponse<{ profile: AffiliateProfile }>>(
    '/dashboard/affiliate/settings',
    payload,
  );
  return data.data.profile;
}

export async function fetchVendorProductAffiliate(
  productId: string,
): Promise<AffiliateProductSetting | null> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{ affiliate: AffiliateProductSetting | null }>
  >(`/dashboard/vendor/products/${productId}/affiliate`);
  return data.data.affiliate;
}

export async function updateVendorProductAffiliate(
  productId: string,
  payload: VendorProductAffiliatePayload,
): Promise<AffiliateProductSetting> {
  await ensureCsrfCookie();
  const { data } = await apiClient.patch<
    ApiSuccessResponse<{ affiliate: AffiliateProductSetting }>
  >(`/dashboard/vendor/products/${productId}/affiliate`, payload);
  return data.data.affiliate;
}
