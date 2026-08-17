import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useCart } from './useCart.ts';
import * as cartApi from '../../api/cart.ts';
import type { Cart } from '../../types/cart.ts';

const sampleCart: Cart = {
  id: 'cart-1',
  status: 'active',
  item_count: 1,
  items: [
    {
      id: 'item-1',
      product_id: 'product-1',
      quantity: 1,
      unit_price_snapshot: '50.00',
      line_subtotal: '50.00',
      color: null,
      product: null,
    },
  ],
  totals: {
    subtotal: '50.00',
    discount: null,
    shipping: null,
    tax: null,
    total: null,
  },
};

vi.mock('../useToast.ts', () => ({
  useToast: () => ({
    toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useCart', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('loads cart data from the API', async () => {
    vi.spyOn(cartApi, 'fetchCart').mockResolvedValue(sampleCart);

    const { result } = renderHook(() => useCart(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.count).toBe(1);
    });

    expect(result.current.subtotal).toBe('50.00');
    expect(result.current.items).toHaveLength(1);
  });

  it('updates the cart immediately when adding an item', async () => {
    vi.spyOn(cartApi, 'fetchCart').mockResolvedValue({
      ...sampleCart,
      item_count: 0,
      items: [],
      totals: { ...sampleCart.totals, subtotal: '0.00' },
    });
    vi.spyOn(cartApi, 'addCartItem').mockResolvedValue(sampleCart);

    const { result } = renderHook(() => useCart(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      void result.current.addItem('product-1', 1, null, {
        name: 'Test product',
        sale_price: 50,
      });
    });

    await waitFor(() => {
      expect(result.current.count).toBe(1);
    });

    expect(result.current.items[0]?.product?.name).toBe('Test product');
  });
});
