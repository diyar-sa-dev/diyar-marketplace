import { useQuery } from '@tanstack/react-query';
import { fetchCatalogSearchSuggestions } from '../../api/catalogSearchSuggestions.ts';
import { useDebouncedValue } from '../useDebouncedValue.ts';

export function useCatalogSearchSuggestions(query: string, enabled = true) {
  const debouncedQuery = useDebouncedValue(query, 300);
  const trimmed = debouncedQuery.replace(/\s+/g, ' ').trim();

  return useQuery({
    queryKey: ['catalog-search-suggestions', trimmed],
    queryFn: () => fetchCatalogSearchSuggestions(trimmed),
    enabled: enabled && trimmed.length >= 2,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}
