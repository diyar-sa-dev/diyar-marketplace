import type { FilterSuggestionsRequest } from '../types/filterSuggestions.ts';

export function catalogFiltersToSearchParams(
  filters: FilterSuggestionsRequest,
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.q) {
    params.set('q', filters.q);
  }

  if (filters.type && filters.type !== 'all') {
    params.set('type', filters.type);
  }

  if (filters.category_slug) {
    params.set('category_slug', filters.category_slug);
  }

  if (filters.category) {
    params.set('category', filters.category);
  }

  if (filters.vendor_slug) {
    params.set('vendor_slug', filters.vendor_slug);
  }

  if (filters.min_price !== undefined) {
    params.set('min_price', String(filters.min_price));
  }

  if (filters.max_price !== undefined) {
    params.set('max_price', String(filters.max_price));
  }

  if (filters.colors?.length) {
    params.set('colors', filters.colors.join(','));
  } else if (filters.color) {
    params.set('color', filters.color);
  }

  if (filters.material) {
    params.set('material', filters.material);
  }

  if (filters.availability_mode) {
    params.set('availability_mode', filters.availability_mode);
  }

  if (filters.discounted) {
    params.set('discounted', '1');
  }

  if (filters.location) {
    params.set('location', filters.location);
  }

  if (filters.pricing_mode) {
    params.set('pricing_mode', filters.pricing_mode);
  }

  if (filters.min_rating !== undefined) {
    params.set('min_rating', String(filters.min_rating));
  }

  if (filters.remote) {
    params.set('remote', '1');
  }

  if (filters.provider) {
    params.set('provider', filters.provider);
  }

  if (filters.sort) {
    params.set('sort', filters.sort);
  }

  return params;
}
