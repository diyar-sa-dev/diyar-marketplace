import type { QueryClient } from '@tanstack/react-query';
import {
  addCartItem,
  clearCart,
  fetchCart,
  removeCartItem,
  updateCartItem,
} from '../../api/cart.ts';
import type { Cart } from '../../types/cart.ts';
import { parseApiError } from '../../utils/errors.ts';
import { cartKeys } from './queryKeys.ts';
import { lineKeyFromItem, readLocalCartEnvelope, writeLocalCartEnvelope } from './cartLocal.ts';

const SYNC_DEBOUNCE_MS = 750;
const REMOVE_DEBOUNCE_MS = 200;

type SyncErrorHandler = (message: string) => void;

class CartSyncManager {
  private queryClient: QueryClient | null = null;

  private onError: SyncErrorHandler | null = null;

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  private flushPromise: Promise<Cart | null> | null = null;

  private isSyncing = false;

  init(queryClient: QueryClient, onError?: SyncErrorHandler): void {
    this.queryClient = queryClient;
    if (onError) {
      this.onError = onError;
    }
  }

  get syncing(): boolean {
    return this.isSyncing;
  }

  applyServerCart(cart: Cart, pendingSync = false): void {
    writeLocalCartEnvelope(cart, pendingSync);
    this.queryClient?.setQueryData(cartKeys.detail(), cart);
  }

  scheduleSync(delay = SYNC_DEBOUNCE_MS): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      void this.flush();
    }, delay);
  }

  scheduleFastSync(): void {
    this.scheduleSync(REMOVE_DEBOUNCE_MS);
  }

  async flush(): Promise<Cart | null> {
    if (this.flushPromise) {
      return this.flushPromise;
    }

    this.flushPromise = this.performFlush().finally(() => {
      this.flushPromise = null;
    });

    return this.flushPromise;
  }

  private async performFlush(): Promise<Cart | null> {
    const envelope = readLocalCartEnvelope();
    if (!envelope?.pendingSync || !this.queryClient) {
      return envelope?.cart ?? null;
    }

    this.isSyncing = true;

    try {
      let serverCart = await fetchCart();
      const target = envelope.cart;

      const targetByLine = new Map(target.items.map((item) => [lineKeyFromItem(item), item]));

      const serverLines = () =>
        new Map(serverCart.items.map((item) => [lineKeyFromItem(item), item]));

      let serverByLine = serverLines();

      for (const [key, serverItem] of serverByLine) {
        if (!targetByLine.has(key)) {
          serverCart = await removeCartItem(serverItem.id);
          serverByLine = serverLines();
        }
      }

      serverByLine = serverLines();

      for (const [key, targetItem] of targetByLine) {
        if (!serverByLine.has(key)) {
          serverCart = await addCartItem(
            targetItem.product_id,
            targetItem.quantity,
            targetItem.color,
          );
          serverByLine = serverLines();
        }
      }

      serverByLine = serverLines();

      for (const [key, targetItem] of targetByLine) {
        const serverItem = serverByLine.get(key);
        if (serverItem && serverItem.quantity !== targetItem.quantity) {
          serverCart = await updateCartItem(serverItem.id, targetItem.quantity);
          serverByLine = serverLines();
        }
      }

      this.applyServerCart(serverCart, false);
      return serverCart;
    } catch (error) {
      this.onError?.(parseApiError(error).message);
      this.scheduleSync(2000);
      return null;
    } finally {
      this.isSyncing = false;
    }
  }

  async flushClear(): Promise<Cart | null> {
    if (!this.queryClient) {
      return null;
    }

    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.isSyncing = true;

    try {
      const cleared = await clearCart();
      this.applyServerCart(cleared, false);
      return cleared;
    } catch (error) {
      this.onError?.(parseApiError(error).message);
      return null;
    } finally {
      this.isSyncing = false;
    }
  }
}

export const cartSync = new CartSyncManager();
