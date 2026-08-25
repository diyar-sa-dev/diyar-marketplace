import type { BlogArticleListFilters } from '../../types/blog.ts';

function serializeBlogFilters(filters: BlogArticleListFilters = {}): readonly (string | number)[] {
  return [
    filters.page ?? 1,
    filters.per_page ?? 12,
    filters.category ?? '',
    filters.tag ?? '',
    filters.q ?? '',
  ];
}

export const blogKeys = {
  all: ['marketplace', 'blog'] as const,
  articles: (filters: BlogArticleListFilters = {}) =>
    [...blogKeys.all, 'articles', ...serializeBlogFilters(filters)] as const,
  article: (slug: string) => [...blogKeys.all, 'article', slug] as const,
  categories: () => [...blogKeys.all, 'categories'] as const,
  tagArticles: (tagSlug: string, filters: Omit<BlogArticleListFilters, 'tag'> = {}) =>
    [...blogKeys.all, 'tag', tagSlug, ...serializeBlogFilters(filters)] as const,
};
