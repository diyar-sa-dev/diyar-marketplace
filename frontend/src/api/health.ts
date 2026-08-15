import { apiClient } from './client.ts';
import type { ApiSuccessResponse, HealthData } from '../types/api.ts';

export async function fetchHealth(): Promise<HealthData> {
  const { data } = await apiClient.get<ApiSuccessResponse<HealthData>>('/health');
  return data.data;
}
