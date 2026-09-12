import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { postVisualSearch } from '../api/visualSearch.ts';
import { getVisualSearchSession } from '../lib/visualSearchSession.ts';
import type { VisualSearchResponse } from '../types/visualSearch.ts';

export function visualSearchQueryKey(
  searchId: string,
  page: number,
  perPage: number,
): readonly ['visual-search', string, number, number] {
  return ['visual-search', searchId, page, perPage];
}

export function useVisualSearchResults(
  searchId: string | null,
  page: number,
  perPage: number,
  enabled: boolean,
  initialData?: VisualSearchResponse,
) {
  const session = getVisualSearchSession(searchId);

  return useQuery({
    queryKey: visualSearchQueryKey(searchId ?? '', page, perPage),
    queryFn: () => postVisualSearch(session!.file, page, perPage),
    enabled: enabled && Boolean(searchId && session?.file),
    placeholderData: keepPreviousData,
    initialData:
      initialData &&
      initialData.meta.search_id === searchId &&
      initialData.data.pagination.current_page === page &&
      initialData.data.pagination.per_page === perPage
        ? initialData
        : undefined,
    staleTime: 5 * 60 * 1000,
  });
}
