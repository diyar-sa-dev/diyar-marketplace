import { apiClient } from './client.ts';
import { ensureCsrfCookie } from '../lib/csrf.ts';
import type { ApiSuccessResponse } from '../types/api.ts';
import type { ProviderWorkPolicy, ProviderWorkPolicyPayload } from '../types/providerWorkPolicy.ts';
import { defaultProviderWorkPolicy } from '../types/providerWorkPolicy.ts';

export async function fetchProviderWorkPolicy(): Promise<ProviderWorkPolicy> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{ work_policy: ProviderWorkPolicy | null }>
  >('/dashboard/provider/settings/work-policy');

  return data.data.work_policy ?? defaultProviderWorkPolicy();
}

export async function updateProviderWorkPolicy(
  payload: ProviderWorkPolicyPayload,
): Promise<ProviderWorkPolicy> {
  await ensureCsrfCookie();
  const { data } = await apiClient.put<ApiSuccessResponse<{ work_policy: ProviderWorkPolicy }>>(
    '/dashboard/provider/settings/work-policy',
    payload,
  );

  return data.data.work_policy;
}
