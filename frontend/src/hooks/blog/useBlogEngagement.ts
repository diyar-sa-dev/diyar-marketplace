import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleBlogArticleWishlist } from '../../api/blogEngagement.ts';
import { wishlistKeys } from '../profile/queryKeys.ts';
import { blogKeys } from './queryKeys.ts';

export function useBlogWishlistMutation(slug: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => toggleBlogArticleWishlist(slug!),
    onSuccess: () => {
      if (slug) {
        void queryClient.invalidateQueries({ queryKey: blogKeys.article(slug) });
      }
      void queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
    },
  });
}
