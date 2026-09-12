import { apiClient } from './client.ts';
import type { ApiSuccessResponse } from '../types/api.ts';

export type PlatformSearchConfig = {
  visual_search_min_similarity: number;
};

export async function fetchPlatformSearch(): Promise<PlatformSearchConfig> {
  const { data } = await apiClient.get<ApiSuccessResponse<{ search: PlatformSearchConfig }>>(
    '/platform/search',
  );

  return (
    data.data.search ?? {
      visual_search_min_similarity: 0.9,
    }
  );
}
