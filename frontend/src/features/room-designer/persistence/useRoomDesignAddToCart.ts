import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cartKeys } from '../../../hooks/cart/queryKeys.ts';
import { cartSync } from '../../../hooks/cart/cartSync.ts';
import type { Cart } from '../../../types/cart.ts';
import { addRoomDesignToCart } from './roomDesignApi.ts';

export type AddToCartUiState = 'idle' | 'adding' | 'success' | 'error';

export function useRoomDesignAddToCart(designId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload?: { item_ids?: string[] }) => addRoomDesignToCart(designId, payload),
    onSuccess: (result) => {
      cartSync.applyServerCart(result.cart, false);
      queryClient.setQueryData<Cart>(cartKeys.detail(), result.cart);
    },
  });
}
