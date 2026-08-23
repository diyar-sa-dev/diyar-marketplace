import { apiClient } from './client.ts';
import type { ApiSuccessResponse } from '../types/api.ts';

export type CatalogSearchSuggestion = {
  id: string;
  type: 'product' | 'vendor' | 'category' | 'service';
  label: string;
  slug: string;
  subtitle: string | null;
  href: string;
};

export type CatalogSearchSuggestionsResult = {
  query: string;
  suggestions: CatalogSearchSuggestion[];
};

export async function fetchCatalogSearchSuggestions(
  query: string,
  limit = 8,
): Promise<CatalogSearchSuggestionsResult> {
  const params = new URLSearchParams();
  if (query.trim()) {
    params.set('q', query.trim());
  }
  params.set('limit', String(limit));

  const { data } = await apiClient.get<ApiSuccessResponse<CatalogSearchSuggestionsResult>>(
    `/catalog/search/suggestions?${params.toString()}`,
  );

  return data.data;
}
