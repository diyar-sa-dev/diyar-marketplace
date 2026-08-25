import type { B2bCompanyListFilters } from '../../types/b2b.ts';

function serializeFilters(filters: B2bCompanyListFilters = {}): readonly (string | number | boolean)[] {
  return [
    filters.page ?? 1,
    filters.per_page ?? 12,
    filters.category ?? '',
    filters.location ?? '',
    filters.q ?? '',
    filters.verified ?? '',
    filters.featured ?? '',
    filters.sort ?? 'featured',
  ];
}

export const b2bKeys = {
  all: ['marketplace', 'b2b'] as const,
  companies: (filters: B2bCompanyListFilters = {}) =>
    [...b2bKeys.all, 'companies', ...serializeFilters(filters)] as const,
  company: (slug: string) => [...b2bKeys.all, 'company', slug] as const,
  categories: () => [...b2bKeys.all, 'categories'] as const,
};
