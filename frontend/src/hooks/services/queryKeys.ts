import type { ServiceListFilters } from '../../types/services.ts';

export const serviceKeys = {
  all: ['services'] as const,
  categories: () => [...serviceKeys.all, 'categories'] as const,
  list: (filters: ServiceListFilters = {}) => [...serviceKeys.all, 'list', filters] as const,
  detail: (id: string) => [...serviceKeys.all, 'detail', id] as const,
  related: (id: string) => [...serviceKeys.all, 'related', id] as const,
  providers: {
    all: ['providers'] as const,
    detail: (slug: string) => [...serviceKeys.providers.all, slug] as const,
    services: (slug: string, filters: ServiceListFilters = {}) =>
      [...serviceKeys.providers.all, slug, 'services', filters] as const,
  },
};
