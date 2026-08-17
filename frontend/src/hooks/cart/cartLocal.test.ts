import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  cartLineKey,
  optimisticAddItem,
  optimisticUpdateQuantity,
  recalculateCart,
  EMPTY_CART,
} from './cartLocal.ts';

describe('cartLocal', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  it('merges duplicate product lines by color', () => {
    const first = optimisticAddItem(EMPTY_CART, {
      productId: 'p1',
      quantity: 1,
      product: { name: 'Chair', sale_price: 100 },
    });

    const second = optimisticAddItem(first, {
      productId: 'p1',
      quantity: 2,
      product: { name: 'Chair', sale_price: 100 },
    });

    expect(second.items).toHaveLength(1);
    expect(second.items[0]?.quantity).toBe(3);
    expect(second.item_count).toBe(3);
    expect(second.totals.subtotal).toBe('300.00');
  });

  it('keeps separate lines for different colors', () => {
    const withWhite = optimisticAddItem(EMPTY_CART, {
      productId: 'p1',
      quantity: 1,
      color: { name: 'White', hex_code: '#FFFFFF' },
      product: { name: 'Chair', sale_price: 100 },
    });

    const withBlack = optimisticAddItem(withWhite, {
      productId: 'p1',
      quantity: 1,
      color: { name: 'Black', hex_code: '#000000' },
      product: { name: 'Chair', sale_price: 100 },
    });

    expect(withBlack.items).toHaveLength(2);
    expect(cartLineKey('p1', { name: 'White', hex_code: '#FFFFFF' })).toBe('p1::White');
  });

  it('updates quantity optimistically', () => {
    const cart = optimisticAddItem(EMPTY_CART, {
      productId: 'p1',
      quantity: 1,
      product: { name: 'Chair', sale_price: 50 },
    });

    const itemId = cart.items[0]?.id ?? '';
    const updated = optimisticUpdateQuantity(cart, itemId, 4);

    expect(updated.items[0]?.quantity).toBe(4);
    expect(updated.totals.subtotal).toBe('200.00');
  });

  it('recalculates totals from line items', () => {
    const cart = recalculateCart({
      ...EMPTY_CART,
      items: [
        {
          id: '1',
          product_id: 'p1',
          quantity: 2,
          unit_price_snapshot: '25.50',
          line_subtotal: '0.00',
          color: null,
          product: null,
        },
      ],
    });

    expect(cart.totals.subtotal).toBe('51.00');
    expect(cart.item_count).toBe(2);
  });
});
