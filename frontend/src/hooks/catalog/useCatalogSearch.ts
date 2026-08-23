import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchCatalogSearch } from '../../api/catalogSearch.ts';
import type { CatalogSearchFilters, CatalogSearchType } from '../../types/catalogSearch.ts';
import { catalogSearchKeys } from './queryKeys.ts';

const ALLOWED_TYPES: CatalogSearchType[] = ['all', 'products', 'services'];
const ALLOWED_SORTS = new Set([
  '-created_at',
  'created_at',
  'price',
  '-price',
  'name',
  '-name',
  '-discount',
  'discount',
  '-popular',
  'popular',
  'latest',
  'rating',
]);

const MAX_PER_PAGE = 50;

export function normalizeCatalogSearchFilters(
  raw: Record<string, string | number | boolean | null | undefined>,
): CatalogSearchFilters {
  const type = String(raw.type ?? '');
  const sort = raw.sort ? String(raw.sort) : undefined;
  const perPage = Number(raw.per_page ?? '48');
  const page = Number(raw.page ?? '1');
  const minPrice = raw.min_price !== undefined && raw.min_price !== '' ? Number(raw.min_price) : undefined;
  const maxPrice = raw.max_price !== undefined && raw.max_price !== '' ? Number(raw.max_price) : undefined;

  const normalizedQuery = raw.q !== undefined && raw.q !== null ? String(raw.q).replace(/\s+/g, ' ').trim() : '';
  const colors = (() => {
    if (raw.colors) {
      const values = String(raw.colors)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      return values.length > 0 ? values : undefined;
    }

    if (raw.color) {
      return [String(raw.color)];
    }

    return undefined;
  })();

  return {
    q: normalizedQuery || undefined,
    type: ALLOWED_TYPES.includes(type as CatalogSearchType) ? (type as CatalogSearchType) : 'all',
    category_slug: raw.category_slug ? String(raw.category_slug) : undefined,
    vendor_slug: raw.vendor_slug ? String(raw.vendor_slug) : undefined,
    min_price: Number.isFinite(minPrice) ? minPrice : undefined,
    max_price: Number.isFinite(maxPrice) ? maxPrice : undefined,
    color: colors?.length === 1 ? colors[0] : undefined,
    colors,
    material: raw.material ? String(raw.material) : undefined,
    availability_mode:
      raw.availability_mode === 'in_stock' ||
      raw.availability_mode === 'out_of_stock' ||
      raw.availability_mode === 'preorder'
        ? raw.availability_mode
        : undefined,
    discounted: raw.discounted === '1' || raw.discounted === 1 || raw.discounted === true ? 1 : undefined,
    sort: sort && ALLOWED_SORTS.has(sort) ? (sort as CatalogSearchFilters['sort']) : undefined,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    per_page:
      Number.isFinite(perPage) && perPage > 0 ? Math.min(perPage, MAX_PER_PAGE) : 48,
  };
}

export function useCatalogSearch(filters: CatalogSearchFilters, options?: { enabled?: boolean }) {
  const stableFilters = useMemo(
    () =>
      normalizeCatalogSearchFilters(
        filters as Record<string, string | number | boolean | null | undefined>,
      ),
    [filters],
  );
  const hasQueryContext = Boolean(
    stableFilters.q ||
      stableFilters.category_slug ||
      stableFilters.vendor_slug ||
      stableFilters.colors?.length ||
      stableFilters.color ||
      stableFilters.material ||
      stableFilters.min_price ||
      stableFilters.max_price ||
      stableFilters.discounted ||
      stableFilters.availability_mode,
  );

  return useQuery({
    queryKey: catalogSearchKeys.query(stableFilters),
    queryFn: () => fetchCatalogSearch(stableFilters),
    enabled: options?.enabled !== false && hasQueryContext,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}
