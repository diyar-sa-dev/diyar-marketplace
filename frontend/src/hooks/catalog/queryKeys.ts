import type { ProductListFilters } from '../../types/catalog.ts';

export const categoryKeys = {
  all: ['categories'] as const,
  list: () => [...categoryKeys.all, 'list'] as const,
  detail: (slug: string) => [...categoryKeys.all, 'detail', slug] as const,
  items: (slug: string, filters: ProductListFilters = {}) =>
    [...categoryKeys.all, 'items', slug, filters] as const,
};

export const productKeys = {
  all: ['products'] as const,
  list: (filters: ProductListFilters = {}) => [...productKeys.all, 'list', filters] as const,
  detail: (id: string) => [...productKeys.all, 'detail', id] as const,
  search: (filters: ProductListFilters = {}) => [...productKeys.all, 'search', filters] as const,
};

export const vendorKeys = {
  all: ['vendors'] as const,
  list: (filters: ProductListFilters = {}) => [...vendorKeys.all, 'list', filters] as const,
  detail: (slug: string) => [...vendorKeys.all, 'detail', slug] as const,
  products: (slug: string, filters: ProductListFilters = {}) =>
    [...vendorKeys.all, 'products', slug, filters] as const,
};
