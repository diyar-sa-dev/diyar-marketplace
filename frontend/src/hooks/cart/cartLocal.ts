import type { Cart, CartItem, CartItemColor, CartProductSnapshot } from '../../types/cart.ts';

export const CART_STORAGE_KEY = 'diyar:cart:v1';

export const EMPTY_CART: Cart = {
  id: '',
  status: 'active',
  item_count: 0,
  items: [],
  totals: {
    subtotal: '0.00',
    discount: null,
    shipping: null,
    tax: null,
    total: null,
  },
};

export type LocalCartEnvelope = {
  cart: Cart;
  updatedAt: number;
  pendingSync: boolean;
};

export type CartProductInput = {
  name: string;
  sale_price: string | number;
  slug?: string;
  image_url?: string | null;
  availability_mode?: CartProductSnapshot['availability_mode'];
  vendor?: { store_name: string; slug?: string } | null;
  inventory?: { available_quantity: number } | null;
};

export type CartAddInput = {
  productId: string;
  quantity?: number;
  color?: CartItemColor | null;
  product?: CartProductInput | null;
};

export function cartLineKey(productId: string, color?: CartItemColor | null): string {
  return `${productId}::${color?.name ?? ''}`;
}

export function isLocalCartItemId(itemId: string): boolean {
  return itemId.startsWith('local:');
}

export function localCartItemId(lineKey: string): string {
  return `local:${lineKey}`;
}

function money(value: string | number): string {
  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return '0.00';
  }
  return amount.toFixed(2);
}

function lineSubtotal(unitPrice: string, quantity: number): string {
  return money(Number(unitPrice) * quantity);
}

export function recalculateCart(cart: Cart): Cart {
  const items = cart.items.map((item) => ({
    ...item,
    line_subtotal: lineSubtotal(item.unit_price_snapshot, item.quantity),
  }));

  const item_count = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = money(items.reduce((sum, item) => sum + Number(item.line_subtotal), 0));

  return {
    ...cart,
    items,
    item_count,
    totals: {
      ...cart.totals,
      subtotal,
    },
  };
}

function toProductSnapshot(product: CartProductInput, productId: string): CartProductSnapshot {
  return {
    id: productId,
    name: product.name,
    slug: product.slug ?? '',
    sale_price: product.sale_price,
    availability_mode: product.availability_mode ?? 'in_stock',
    image_url: product.image_url ?? null,
    vendor: product.vendor?.store_name
      ? { store_name: product.vendor.store_name, slug: product.vendor.slug ?? '' }
      : null,
    inventory: product.inventory ?? null,
  };
}

export function optimisticAddItem(cart: Cart, input: CartAddInput): Cart {
  const quantity = input.quantity ?? 1;
  const lineKey = cartLineKey(input.productId, input.color);
  const existing = cart.items.find((item) => cartLineKey(item.product_id, item.color) === lineKey);

  if (existing) {
    return recalculateCart({
      ...cart,
      items: cart.items.map((item) =>
        item.id === existing.id
          ? {
              ...item,
              quantity: item.quantity + quantity,
              product:
                item.product ??
                (input.product ? toProductSnapshot(input.product, input.productId) : null),
            }
          : item,
      ),
    });
  }

  const unitPrice = money(input.product?.sale_price ?? 0);
  const newItem: CartItem = {
    id: localCartItemId(lineKey),
    product_id: input.productId,
    quantity,
    unit_price_snapshot: unitPrice,
    line_subtotal: lineSubtotal(unitPrice, quantity),
    color: input.color ?? null,
    product: input.product ? toProductSnapshot(input.product, input.productId) : null,
  };

  return recalculateCart({
    ...cart,
    items: [...cart.items, newItem],
  });
}

export function optimisticUpdateQuantity(cart: Cart, itemId: string, quantity: number): Cart {
  if (quantity < 1) {
    return optimisticRemoveItem(cart, itemId);
  }

  return recalculateCart({
    ...cart,
    items: cart.items.map((item) => (item.id === itemId ? { ...item, quantity } : item)),
  });
}

export function optimisticRemoveItem(cart: Cart, itemId: string): Cart {
  return recalculateCart({
    ...cart,
    items: cart.items.filter((item) => item.id !== itemId),
  });
}

export function optimisticClearCart(cart: Cart): Cart {
  return recalculateCart({
    ...cart,
    items: [],
  });
}

export function readLocalCartEnvelope(): LocalCartEnvelope | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as LocalCartEnvelope;
    if (!parsed?.cart || !Array.isArray(parsed.cart.items)) {
      return null;
    }

    return {
      cart: recalculateCart(parsed.cart),
      updatedAt: parsed.updatedAt ?? 0,
      pendingSync: Boolean(parsed.pendingSync),
    };
  } catch {
    return null;
  }
}

export function writeLocalCartEnvelope(cart: Cart, pendingSync: boolean): LocalCartEnvelope {
  const envelope: LocalCartEnvelope = {
    cart: recalculateCart(cart),
    updatedAt: Date.now(),
    pendingSync,
  };

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(envelope));
  }

  return envelope;
}

export function readLocalCart(): Cart | null {
  return readLocalCartEnvelope()?.cart ?? null;
}

export function lineKeyFromItem(item: Pick<CartItem, 'product_id' | 'color'>): string {
  return cartLineKey(item.product_id, item.color);
}
