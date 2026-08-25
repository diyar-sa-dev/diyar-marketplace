import { useQuery } from '@tanstack/react-query';
import { fetchBlogCategories } from '../../api/blog.ts';
import { blogKeys } from './queryKeys.ts';

export function useBlogCategories() {
  return useQuery({
    queryKey: blogKeys.categories(),
    queryFn: fetchBlogCategories,
    staleTime: 30 * 60 * 1000,
  });
}
