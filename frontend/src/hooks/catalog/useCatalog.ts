import { useQuery } from '@tanstack/react-query';
import * as catalogApi from '../../api/catalog.ts';
import type { ProductListFilters } from '../../types/catalog.ts';
import { categoryKeys, productKeys, vendorKeys } from './queryKeys.ts';
import { isValidStoreSlug } from '../../lib/storePath.ts';
import { isNotFoundError } from '../../utils/errors.ts';

function retryUnlessNotFound(failureCount: number, error: unknown): boolean {
  if (isNotFoundError(error)) {
    return false;
  }

  return failureCount < 2;
}

export function useCategories(type?: 'product' | 'service') {
  return useQuery({
    queryKey: [...categoryKeys.list(), type ?? 'all'],
    queryFn: () => catalogApi.fetchCategories(type),
  });
}

export function useCategory(slug: string) {
  return useQuery({
    queryKey: categoryKeys.detail(slug),
    queryFn: () => catalogApi.fetchCategory(slug),
    enabled: Boolean(slug) && slug !== 'all',
    retry: retryUnlessNotFound,
  });
}

export function useCategoryProducts(
  slug: string,
  filters: ProductListFilters = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: categoryKeys.items(slug, filters),
    queryFn: () =>
      slug === 'all'
        ? catalogApi.fetchProducts(filters)
        : catalogApi.fetchCategoryProducts(slug, filters),
    enabled: options?.enabled !== false && Boolean(slug),
    retry: retryUnlessNotFound,
  });
}

export function useProducts(filters: ProductListFilters = {}) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => catalogApi.fetchProducts(filters),
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: productKeys.detail(id ?? ''),
    queryFn: () => catalogApi.fetchProduct(id!),
    enabled: Boolean(id),
  });
}

export function useSearchProducts(filters: ProductListFilters = {}) {
  return useQuery({
    queryKey: productKeys.search(filters),
    queryFn: () => catalogApi.searchProducts(filters),
    enabled: Boolean(filters.q?.trim()),
    staleTime: 30_000,
  });
}

export function useVendor(slug: string | undefined) {
  return useQuery({
    queryKey: vendorKeys.detail(slug ?? ''),
    queryFn: () => catalogApi.fetchVendor(slug!),
    enabled: isValidStoreSlug(slug),
    staleTime: 60_000,
    retry: retryUnlessNotFound,
  });
}

export function useVendorProducts(
  slug: string | undefined,
  filters: ProductListFilters = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: vendorKeys.products(slug ?? '', filters),
    queryFn: () => catalogApi.fetchVendorProducts(slug!, filters),
    enabled: options?.enabled !== false && isValidStoreSlug(slug),
    retry: retryUnlessNotFound,
  });
}

export function useVendors(filters: ProductListFilters = {}) {
  return useQuery({
    queryKey: vendorKeys.list(filters),
    queryFn: () => catalogApi.fetchVendors(filters),
  });
}
