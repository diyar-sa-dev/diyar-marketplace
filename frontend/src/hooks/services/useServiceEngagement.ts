import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleServiceWishlist } from '../../api/serviceEngagement.ts';
import { wishlistKeys } from '../profile/queryKeys.ts';
import { serviceKeys } from './queryKeys.ts';

export function useServiceWishlistMutation(serviceIdentifier: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => toggleServiceWishlist(serviceIdentifier!),
    onSuccess: () => {
      if (serviceIdentifier) {
        void queryClient.invalidateQueries({ queryKey: serviceKeys.detail(serviceIdentifier) });
        void queryClient.invalidateQueries({ queryKey: serviceKeys.all });
      }
      void queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
    },
  });
}
