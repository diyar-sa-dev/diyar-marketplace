import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchCatalogSearch } from '../../../api/catalogSearch.ts';
import { fetchProducts } from '../../../api/catalog.ts';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue.ts';
import type { ProductCard } from '../../../types/catalog.ts';
import type { PaginationMeta } from '../../../types/catalog.ts';
import {
  CATALOG_PICKER_DEBOUNCE_MS,
  CATALOG_PICKER_MIN_SEARCH_CHARS,
  CATALOG_PICKER_PER_PAGE,
} from './constants.ts';

export const roomDesignerCatalogKeys = {
  browse: (page: number, only3d: boolean) =>
    ['room-designer', 'catalog', 'browse', page, only3d] as const,
  search: (q: string, page: number, only3d: boolean) =>
    ['room-designer', 'catalog', 'search', q, page, only3d] as const,
};

export interface RoomDesignerProductSearchResult {
  items: ProductCard[];
  pagination: PaginationMeta;
  mode: 'browse' | 'search';
  effectiveQuery: string;
}

export function useRoomDesignerProductSearch(
  rawQuery: string,
  page: number,
  enabled = true,
  only3d = false,
) {
  const debouncedQuery = useDebouncedValue(rawQuery, CATALOG_PICKER_DEBOUNCE_MS);
  const trimmed = debouncedQuery.replace(/\s+/g, ' ').trim();
  const isSearch = trimmed.length >= CATALOG_PICKER_MIN_SEARCH_CHARS;

  const browse = useQuery({
    queryKey: roomDesignerCatalogKeys.browse(page, only3d),
    queryFn: async (): Promise<RoomDesignerProductSearchResult> => {
      const data = await fetchProducts({
        page,
        per_page: CATALOG_PICKER_PER_PAGE,
        ...(only3d ? { has_3d: true } : {}),
      });
      return {
        items: data.items,
        pagination: data.pagination,
        mode: 'browse',
        effectiveQuery: '',
      };
    },
    enabled: enabled && !isSearch,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const search = useQuery({
    queryKey: roomDesignerCatalogKeys.search(trimmed, page, only3d),
    queryFn: async (): Promise<RoomDesignerProductSearchResult> => {
      const data = await fetchCatalogSearch({
        type: 'products',
        q: trimmed,
        page,
        per_page: CATALOG_PICKER_PER_PAGE,
        ...(only3d ? { has_3d: true } : {}),
      });
      const section = data.products;
      return {
        items: section?.items ?? [],
        pagination: section?.pagination ?? {
          current_page: 1,
          last_page: 1,
          per_page: CATALOG_PICKER_PER_PAGE,
          total: 0,
        },
        mode: 'search',
        effectiveQuery: trimmed,
      };
    },
    enabled: enabled && isSearch,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  return isSearch ? search : browse;
}
