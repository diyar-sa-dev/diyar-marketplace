import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as followApi from '../../api/storeFollow.ts';
import type { StoreFollowSummary } from '../../api/storeFollow.ts';
import type { VendorPublic } from '../../types/catalog.ts';
import { vendorKeys } from '../catalog/queryKeys.ts';

function applyFollowSummary(
  queryClient: ReturnType<typeof useQueryClient>,
  slug: string,
  summary: StoreFollowSummary,
) {
  queryClient.setQueryData<VendorPublic | undefined>(vendorKeys.detail(slug), (current) =>
    current
      ? {
          ...current,
          followers_count: summary.followers_count,
          is_following: summary.is_following,
        }
      : current,
  );
}

export function useStoreFollow(slug: string | undefined) {
  const queryClient = useQueryClient();

  const follow = useMutation({
    mutationFn: () => {
      if (!slug) throw new Error('Missing store slug');
      return followApi.followStore(slug);
    },
    onSuccess: (summary) => {
      if (slug) {
        applyFollowSummary(queryClient, slug, summary);
        void queryClient.invalidateQueries({ queryKey: vendorKeys.detail(slug) });
        void queryClient.invalidateQueries({ queryKey: vendorKeys.all });
      }
    },
  });

  const unfollow = useMutation({
    mutationFn: () => {
      if (!slug) throw new Error('Missing store slug');
      return followApi.unfollowStore(slug);
    },
    onSuccess: (summary) => {
      if (slug) {
        applyFollowSummary(queryClient, slug, summary);
        void queryClient.invalidateQueries({ queryKey: vendorKeys.detail(slug) });
        void queryClient.invalidateQueries({ queryKey: vendorKeys.all });
      }
    },
  });

  return { follow, unfollow };
}
