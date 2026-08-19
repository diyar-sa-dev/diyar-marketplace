import { apiClient } from './client.ts';
import { ensureCsrfCookie } from '../lib/csrf.ts';
import type { ApiSuccessResponse } from '../types/api.ts';

export async function toggleServiceWishlist(identifier: string): Promise<{ saved: boolean }> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<{ saved: boolean }>>(
    `/services/${identifier}/wishlist`,
  );
  return data.data;
}
