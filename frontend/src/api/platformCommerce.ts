import { apiClient } from './client.ts';
import type { ApiSuccessResponse } from '../types/api.ts';

export type PlatformCommerceConfig = {
  loyalty_sar_per_point: number;
  loyalty_points_per_unit: number;
  loyalty_enabled: boolean;
};

export async function fetchPlatformCommerce(): Promise<PlatformCommerceConfig> {
  const { data } =
    await apiClient.get<ApiSuccessResponse<{ commerce: PlatformCommerceConfig }>>(
      '/platform/commerce',
    );

  return (
    data.data.commerce ?? {
      loyalty_sar_per_point: 50,
      loyalty_points_per_unit: 1,
      loyalty_enabled: true,
    }
  );
}
