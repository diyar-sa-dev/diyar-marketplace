import { apiClient } from './client.ts';
import type {
  FilterSuggestionsRequest,
  FilterSuggestionsResponse,
  FilterSuggestionsResult,
} from '../types/filterSuggestions.ts';

function buildQuery(filters: FilterSuggestionsRequest = {}): string {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    if (key === 'colors' && Array.isArray(value)) {
      if (value.length > 0) {
        params.set('colors', value.join(','));
      }
      return;
    }

    if (key === 'discounted' || key === 'remote') {
      params.set(key, value === true || value === 1 ? '1' : '0');
      return;
    }

    params.set(key, String(value));
  });

  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function fetchFilterSuggestions(
  filters: FilterSuggestionsRequest = {},
  signal?: AbortSignal,
): Promise<FilterSuggestionsResult> {
  const response = await apiClient.get<FilterSuggestionsResponse>(
    `/catalog/search/filter-suggestions${buildQuery(filters)}`,
    { signal },
  );

  return response.data.data;
}
