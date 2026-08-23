import { apiClient } from './client.ts';
import type { CatalogSearchFilters, CatalogSearchResponse, CatalogSearchResult } from '../types/catalogSearch.ts';

function buildQuery(filters: CatalogSearchFilters = {}): string {
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

    if (key === 'discounted') {
      params.set(key, value === true || value === 1 ? '1' : '0');
      return;
    }

    params.set(key, String(value));
  });

  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function fetchCatalogSearch(
  filters: CatalogSearchFilters = {},
): Promise<CatalogSearchResult> {
  const response = await apiClient.get<CatalogSearchResponse>(
    `/catalog/search${buildQuery(filters)}`,
  );

  return response.data.data;
}
