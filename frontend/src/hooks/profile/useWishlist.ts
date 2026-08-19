import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  clearWishlist,
  fetchWishlist,
  fetchWishlistSummary,
  type WishlistKind,
} from '../../api/wishlist.ts';
import { useAuthContext } from '../../context/AuthContext.tsx';
import { wishlistKeys } from './queryKeys.ts';

const DEFAULT_PER_PAGE = 12;

export function useWishlistSummary() {
  const { isAuthenticated } = useAuthContext();

  return useQuery({
    queryKey: wishlistKeys.summary(),
    queryFn: fetchWishlistSummary,
    enabled: isAuthenticated,
  });
}

export function useWishlist(page = 1, perPage = DEFAULT_PER_PAGE, kind: WishlistKind = 'products') {
  const { isAuthenticated } = useAuthContext();

  return useQuery({
    queryKey: wishlistKeys.list(kind, page, perPage),
    queryFn: () => fetchWishlist(page, perPage, kind),
    enabled: isAuthenticated,
  });
}

export function useClearWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clearWishlist,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
    },
  });
}
