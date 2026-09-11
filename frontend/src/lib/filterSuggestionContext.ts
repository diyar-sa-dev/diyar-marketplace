import {
  hasCatalogSearchContext,
  normalizeCatalogSearchFilters,
} from '../hooks/catalog/useCatalogSearch.ts';
import type { FilterSuggestionsRequest } from '../types/filterSuggestions.ts';

const SERVICE_KEYS = ['category', 'location', 'pricing_mode', 'min_rating', 'remote', 'provider'] as const;

export function normalizeFilterSuggestionContext(
  raw: Record<string, string | number | boolean | null | undefined | string[]>,
): FilterSuggestionsRequest {
  const normalizedRaw: Record<string, string | number | boolean | null | undefined> = {};

  Object.entries(raw).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (key === 'colors' && Array.isArray(value)) {
      normalizedRaw.colors = value.join(',');
      return;
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      normalizedRaw[key] = value;
    }
  });

  const base = normalizeCatalogSearchFilters(normalizedRaw);
  const minRating =
    raw.min_rating !== undefined && raw.min_rating !== '' ? Number(raw.min_rating) : undefined;

  const context: FilterSuggestionsRequest = {
    ...base,
    page: undefined,
    per_page: undefined,
  };

  if (raw.category) {
    context.category = String(raw.category);
  }

  if (raw.location) {
    context.location = String(raw.location);
  }

  if (raw.pricing_mode) {
    context.pricing_mode = String(raw.pricing_mode);
  }

  if (Number.isFinite(minRating)) {
    context.min_rating = minRating;
  }

  if (raw.remote === '1' || raw.remote === 1 || raw.remote === true) {
    context.remote = 1;
  }

  if (raw.provider) {
    context.provider = String(raw.provider);
  }

  return context;
}

export function hasFilterSuggestionContext(
  filters: FilterSuggestionsRequest,
  query?: string | null,
): boolean {
  const normalizedQuery = query?.replace(/\s+/g, ' ').trim() ?? filters.q?.trim() ?? '';

  if (hasCatalogSearchContext(filters, normalizedQuery)) {
    return true;
  }

  return SERVICE_KEYS.some((key) => {
    const value = filters[key];
    return value !== undefined && value !== null && value !== '';
  });
}

export function suggestionSectionKey(
  filters: FilterSuggestionsRequest,
): 'products' | 'services' {
  return filters.type === 'services' ? 'services' : 'products';
}
