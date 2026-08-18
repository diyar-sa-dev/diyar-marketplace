import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as followApi from '../../api/storeFollow.ts';
import { vendorKeys } from '../catalog/queryKeys.ts';

export function useStoreFollow(slug: string | undefined) {
  const queryClient = useQueryClient();

  const follow = useMutation({
    mutationFn: () => {
      if (!slug) throw new Error('Missing store slug');
      return followApi.followStore(slug);
    },
    onSuccess: () => {
      if (slug) {
        void queryClient.invalidateQueries({ queryKey: vendorKeys.detail(slug) });
      }
    },
  });

  const unfollow = useMutation({
    mutationFn: () => {
      if (!slug) throw new Error('Missing store slug');
      return followApi.unfollowStore(slug);
    },
    onSuccess: () => {
      if (slug) {
        void queryClient.invalidateQueries({ queryKey: vendorKeys.detail(slug) });
      }
    },
  });

  return { follow, unfollow };
}
