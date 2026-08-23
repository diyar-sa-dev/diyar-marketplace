import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/client.ts';
import type { ApiSuccessResponse, HealthData } from '../../types/api.ts';

export const adminHealthQueryKey = ['admin', 'health', 'summary'] as const;

export async function fetchAdminHealth(): Promise<HealthData> {
  const response = await adminApi.get<ApiSuccessResponse<HealthData>>('/health');
  return response.data.data;
}

export function useAdminHealth() {
  return useQuery({
    queryKey: adminHealthQueryKey,
    queryFn: fetchAdminHealth,
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 1,
  });
}
