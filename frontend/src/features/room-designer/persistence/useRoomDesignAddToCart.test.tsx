import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { cartKeys } from '../../../hooks/cart/queryKeys.ts';
import { useRoomDesignAddToCart } from './useRoomDesignAddToCart.ts';

vi.mock('./roomDesignApi.ts', () => ({
  addRoomDesignToCart: vi.fn(async () => ({
    cart: { id: 'c1', status: 'active', item_count: 2, items: [], totals: { subtotal: '0' } },
    skipped: [],
  })),
}));

describe('useRoomDesignAddToCart', () => {
  it('updates cart query cache on success', async () => {
    const client = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useRoomDesignAddToCart('design-1'), { wrapper });
    result.current.mutate(undefined);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.getQueryData(cartKeys.detail())?.item_count).toBe(2);
  });
});
