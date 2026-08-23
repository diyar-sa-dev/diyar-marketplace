import { apiClient } from './client.ts';
import type { ApiSuccessResponse } from '../types/api.ts';

export type PlatformCommerceConfig = {
  loyalty_sar_per_point: number;
};

export async function fetchPlatformCommerce(): Promise<PlatformCommerceConfig> {
  const { data } = await apiClient.get<ApiSuccessResponse<{ commerce: PlatformCommerceConfig }>>(
    '/platform/commerce',
  );

  return data.data.commerce ?? { loyalty_sar_per_point: 50 };
}
