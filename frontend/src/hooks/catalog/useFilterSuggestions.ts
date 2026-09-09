import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchFilterSuggestions } from '../../api/filterSuggestions.ts';
import {
  hasFilterSuggestionContext,
  normalizeFilterSuggestionContext,
} from '../../lib/filterSuggestionContext.ts';
import type { FilterSuggestionsRequest } from '../../types/filterSuggestions.ts';

export const filterSuggestionKeys = {
  all: ['marketplace', 'catalog', 'filter-suggestions'] as const,
  query: (filters: FilterSuggestionsRequest = {}) =>
    [...filterSuggestionKeys.all, filters] as const,
};

function shouldRetrySuggestionRequest(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) {
    return false;
  }

  const status = (error as { response?: { status?: number } })?.response?.status;
  if (status === 422 || status === 429) {
    return false;
  }

  return true;
}

export function useFilterSuggestions(
  rawFilters: Record<string, string | number | boolean | null | undefined | string[]>,
  options?: { enabled?: boolean; debouncedQuery?: string },
) {
  const stableFilters = useMemo(() => {
    const normalized = normalizeFilterSuggestionContext({
      ...rawFilters,
      q: options?.debouncedQuery ?? rawFilters.q,
    });

    return normalized;
  }, [rawFilters, options?.debouncedQuery]);

  const enabled =
    options?.enabled !== false &&
    hasFilterSuggestionContext(stableFilters, options?.debouncedQuery ?? stableFilters.q);

  const query = useQuery({
    queryKey: filterSuggestionKeys.query(stableFilters),
    queryFn: ({ signal }) => fetchFilterSuggestions(stableFilters, signal),
    enabled,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: shouldRetrySuggestionRequest,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
  });

  return {
    ...query,
    isSuggestionsEnabled: enabled,
  };
}
