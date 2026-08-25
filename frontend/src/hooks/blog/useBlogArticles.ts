import { useQuery } from '@tanstack/react-query';
import { fetchBlogArticles, fetchBlogTagArticles } from '../../api/blog.ts';
import type { BlogArticleListFilters } from '../../types/blog.ts';
import { blogKeys } from './queryKeys.ts';

export function useBlogArticles(
  filters: BlogArticleListFilters = {},
  options?: { enabled?: boolean },
) {
  const { tag, ...rest } = filters;

  return useQuery({
    queryKey: tag ? blogKeys.tagArticles(tag, rest) : blogKeys.articles(filters),
    queryFn: () => (tag ? fetchBlogTagArticles(tag, rest) : fetchBlogArticles(filters)),
    enabled: options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
  });
}
