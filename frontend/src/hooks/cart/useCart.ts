import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCart, mergeCart, validateCart } from '../../api/cart.ts';
import type { Cart, CartItemColor } from '../../types/cart.ts';
import { useToast } from '../useToast.ts';
import { cartKeys } from './queryKeys.ts';
import {
  EMPTY_CART,
  optimisticAddItem,
  optimisticClearCart,
  optimisticRemoveItem,
  optimisticUpdateQuantity,
  readLocalCart,
  readLocalCartEnvelope,
  writeLocalCartEnvelope,
  type CartAddInput,
  type CartProductInput,
} from './cartLocal.ts';
import { cartSync } from './cartSync.ts';

function persistOptimisticCart(cart: Cart): Cart {
  writeLocalCartEnvelope(cart, true);
  return cart;
}

export function useCartQuery(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: cartKeys.detail(),
    queryFn: async () => {
      const local = readLocalCartEnvelope();

      try {
        const server = await fetchCart();

        if (!local?.pendingSync) {
          cartSync.applyServerCart(server, false);
          return server;
        }

        cartSync.scheduleSync(0);
        return local.cart;
      } catch {
        return local?.cart ?? EMPTY_CART;
      }
    },
    initialData: () => readLocalCart() ?? EMPTY_CART,
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
    enabled,
  });
}

export function useMergeCart() {
  const queryClient = useQueryClient();

  return {
    merge: async () => {
      await cartSync.flush();
      const result = await mergeCart();
      cartSync.applyServerCart(result.cart, false);
      queryClient.setQueryData(cartKeys.mergeWarnings(), result.warnings);
      return result;
    },
  };
}

export function useValidateCart() {
  return {
    validate: async () => {
      await cartSync.flush();
      const result = await validateCart();
      cartSync.applyServerCart(result.cart, false);
      return result;
    },
  };
}

export function useCart(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const query = useCartQuery(options);
  const cart = query.data ?? EMPTY_CART;
  const hasLocalData = cart.items.length > 0 || Boolean(readLocalCartEnvelope());

  useEffect(() => {
    cartSync.init(queryClient, (message) => toast.error(message));
  }, [queryClient, toast]);

  const mutateCart = useCallback(
    (updater: (current: Cart) => Cart, options?: { fastSync?: boolean }) => {
      queryClient.setQueryData<Cart>(cartKeys.detail(), (current) => {
        const base = current ?? EMPTY_CART;
        return persistOptimisticCart(updater(base));
      });

      if (options?.fastSync) {
        cartSync.scheduleFastSync();
      } else {
        cartSync.scheduleSync();
      }
    },
    [queryClient],
  );

  const addItem = useCallback(
    (
      productId: string,
      quantity = 1,
      color?: CartItemColor | null,
      product?: CartProductInput | null,
    ) => {
      const input: CartAddInput = { productId, quantity, color, product };
      mutateCart((current) => optimisticAddItem(current, input));
      return Promise.resolve();
    },
    [mutateCart],
  );

  const updateItemQuantity = useCallback(
    (itemId: string, quantity: number) => {
      mutateCart((current) => optimisticUpdateQuantity(current, itemId, quantity));
      return Promise.resolve();
    },
    [mutateCart],
  );

  const removeItem = useCallback(
    (itemId: string) => {
      mutateCart((current) => optimisticRemoveItem(current, itemId), { fastSync: true });
      return Promise.resolve();
    },
    [mutateCart],
  );

  const clearCartLocal = useCallback(async () => {
    queryClient.setQueryData<Cart>(
      cartKeys.detail(),
      () => writeLocalCartEnvelope(optimisticClearCart(EMPTY_CART), false).cart,
    );
    await cartSync.flushClear();
  }, [queryClient]);

  return {
    cart,
    items: cart.items,
    count: cart.item_count,
    subtotal: cart.totals.subtotal,
    totals: cart.totals,
    isLoading: query.isLoading && !hasLocalData,
    isSyncing: cartSync.syncing,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    addItem,
    updateItemQuantity,
    removeItem,
    clearCart: clearCartLocal,
    isAdding: false,
    isUpdating: false,
    isRemoving: false,
  };
}

export type { CartProductInput };
