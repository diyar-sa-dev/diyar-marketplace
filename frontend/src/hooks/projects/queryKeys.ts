import type { ProjectListFilters } from '../../types/project.ts';

function serializeProjectFilters(filters: ProjectListFilters = {}): readonly (string | number)[] {
  return [filters.page ?? 1, filters.per_page ?? 12, filters.category ?? ''];
}

export const projectKeys = {
  all: ['marketplace', 'projects'] as const,
  list: (filters: ProjectListFilters = {}) =>
    [...projectKeys.all, 'list', ...serializeProjectFilters(filters)] as const,
  detail: (slug: string) => [...projectKeys.all, 'detail', slug] as const,
};
