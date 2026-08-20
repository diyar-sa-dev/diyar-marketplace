import { apiClient } from './client.ts';
import { ensureCsrfCookie } from '../lib/csrf.ts';
import type { ApiSuccessResponse } from '../types/api.ts';
import type {
  CreateReturnPayload,
  ReturnEligibility,
  ReturnRequest,
  VendorReturnPolicy,
  VendorReturnPolicyPayload,
} from '../types/return.ts';

export async function fetchReturnEligibility(
  vendorOrderId: string,
  orderItemId: string,
): Promise<ReturnEligibility> {
  const { data } = await apiClient.get<ApiSuccessResponse<ReturnEligibility>>(
    `/vendor-orders/${vendorOrderId}/items/${orderItemId}/return-eligibility`,
  );
  return data.data;
}

export async function fetchCustomerReturns(
  page = 1,
  perPage = 10,
): Promise<{
  returns: ReturnRequest[];
  pagination: { current_page: number; last_page: number; per_page: number; total: number };
}> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{
      returns: ReturnRequest[];
      pagination: { current_page: number; last_page: number; per_page: number; total: number };
    }>
  >('/returns', { params: { page, per_page: perPage } });
  return data.data;
}

export async function createReturnRequest(payload: CreateReturnPayload): Promise<ReturnRequest> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<{ return_request: ReturnRequest }>>(
    '/returns',
    payload,
  );
  return data.data.return_request;
}

export async function uploadReturnEvidence(returnId: string, file: File): Promise<void> {
  await ensureCsrfCookie();
  const formData = new FormData();
  formData.append('file', file);
  await apiClient.post(`/returns/${returnId}/evidence`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function fetchVendorReturns(
  page = 1,
  status = 'all',
  perPage = 10,
): Promise<{
  returns: ReturnRequest[];
  pagination: { current_page: number; last_page: number; per_page: number; total: number };
}> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{
      returns: ReturnRequest[];
      pagination: { current_page: number; last_page: number; per_page: number; total: number };
    }>
  >('/dashboard/vendor/returns', { params: { page, status, per_page: perPage } });
  return data.data;
}

export async function vendorReturnAction(
  returnId: string,
  action: 'submit-review' | 'approve' | 'reject' | 'received' | 'inspect' | 'refund',
  body: Record<string, unknown> = {},
): Promise<ReturnRequest> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<{ return_request: ReturnRequest }>>(
    `/dashboard/vendor/returns/${returnId}/${action}`,
    body,
  );
  return data.data.return_request;
}

export async function fetchVendorReturnPolicy(): Promise<VendorReturnPolicy | null> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{ return_policy: VendorReturnPolicy | null }>
  >('/dashboard/vendor/return-policy');
  return data.data.return_policy;
}

export async function updateVendorReturnPolicy(
  payload: VendorReturnPolicyPayload,
): Promise<VendorReturnPolicy> {
  await ensureCsrfCookie();
  const { data } = await apiClient.put<ApiSuccessResponse<{ return_policy: VendorReturnPolicy }>>(
    '/dashboard/vendor/return-policy',
    payload,
  );
  return data.data.return_policy;
}
