import { useQuery } from '@tanstack/react-query';
import { fetchPlatformSearch } from '../api/platformSearch.ts';
import { VISUAL_SEARCH_MIN_DISPLAY_SIMILARITY } from '../types/visualSearch.ts';

export const platformSearchKeys = {
  all: ['platform-search'] as const,
};

export function usePlatformSearch() {
  const query = useQuery({
    queryKey: platformSearchKeys.all,
    queryFn: fetchPlatformSearch,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });

  const minSimilarity =
    query.data?.visual_search_min_similarity ?? VISUAL_SEARCH_MIN_DISPLAY_SIMILARITY;
  const minSimilarityPercent = Math.round(minSimilarity * 100);

  return {
    ...query,
    visualSearchMinSimilarity: minSimilarity,
    visualSearchMinSimilarityPercent: minSimilarityPercent,
  };
}
