import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/client.ts';
import type { ApiSuccessResponse } from '../../types/api.ts';
import type { HealthData } from '../../types/api.ts';

export type OperationalHealthData = {
  overall_status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';
  platform: HealthData;
  operational: {
    notifications?: { status: string; pending?: number; failed?: number; delivered?: number };
    chat?: { status: string; pending_reports?: number; messages_last_hour?: number };
    outbox?: { status: string; available?: boolean; pending?: number; dead_letter?: number };
    queues?: {
      status: string;
      driver?: string;
      pending_jobs?: number | null;
      failed_jobs?: number | null;
    };
  };
  timestamp: string;
};

export const adminOperationalHealthQueryKey = ['admin', 'system', 'health'] as const;

export async function fetchAdminOperationalHealth(): Promise<OperationalHealthData> {
  const response =
    await adminApi.get<ApiSuccessResponse<OperationalHealthData>>('/admin/system/health');
  return response.data.data;
}

export function useAdminOperationalHealth(enabled = true) {
  return useQuery({
    queryKey: adminOperationalHealthQueryKey,
    queryFn: fetchAdminOperationalHealth,
    staleTime: 15_000,
    refetchInterval: 30_000,
    enabled,
    retry: 1,
  });
}
