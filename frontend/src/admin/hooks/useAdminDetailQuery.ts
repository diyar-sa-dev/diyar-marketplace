import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/client.ts';
import { adminQueryKey } from '../../lib/auth/queryKeys.ts';
import type { ApiSuccessResponse } from '../../types/api.ts';

export function useAdminDetailQuery<TData>({
  resourceKey,
  endpoint,
  dataKey,
  enabled = true,
}: {
  resourceKey: string;
  endpoint: string;
  dataKey: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: adminQueryKey(resourceKey, endpoint),
    enabled,
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: async () => {
      const response = await adminApi.get<ApiSuccessResponse<Record<string, TData>>>(endpoint);
      return response.data.data[dataKey] as TData;
    },
  });
}
