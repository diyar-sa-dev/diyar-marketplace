import { useQuery } from '@tanstack/react-query';
import { fetchBlogArticle } from '../../api/blog.ts';
import { blogKeys } from './queryKeys.ts';
import { isNotFoundError } from '../../utils/errors.ts';

export function useBlogArticle(slug: string | undefined) {
  return useQuery({
    queryKey: blogKeys.article(slug ?? ''),
    queryFn: () => fetchBlogArticle(slug!),
    enabled: Boolean(slug),
    staleTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      if (isNotFoundError(error)) {
        return false;
      }
      return failureCount < 2;
    },
  });
}
