import React, { createContext, useContext, useState } from 'react';

export type CartItem = {
  uid: string;
  type: 'product' | 'service';
  name: string;
  vendor?: string;
  img?: string;
  quantity: number;
  price: number;        // numeric, for totals
  priceLabel: string;   // display string
  attributes?: string;  // e.g. product color/size, or service note
};

type AddInput = {
  type: 'product' | 'service';
  name: string;
  vendor?: string;
  img?: string;
  price: number | string;
  attributes?: string;
};

const AR = '٠١٢٣٤٥٦٧٨٩';
const toNumber = (p: number | string): number => {
  if (typeof p === 'number') return p;
  const latin = String(p).replace(/[٠-٩]/g, (d) => String(AR.indexOf(d)));
  const n = parseFloat(latin.replace(/[^\d.]/g, ''));
  return isNaN(n) ? 0 : n;
};
const toLabel = (p: number | string): string =>
  typeof p === 'number' ? `${p.toLocaleString('en-US')} ر.س` : String(p);

const SEED: CartItem[] = [
  { uid: 'seed-1', type: 'product', name: 'طاولة قهوة فاخرة', vendor: 'الزاوية الحديثة', price: 420, priceLabel: '420 ر.س', img: 'https://images.unsplash.com/photo-1544333346-64e4fe18274b?auto=format&fit=crop&q=80&w=200', quantity: 1, attributes: 'اللون: بني ريفي' },
  { uid: 'seed-2', type: 'product', name: 'مرآة بإطار مذهب', vendor: 'أناقة المنزل', price: 340, priceLabel: '340 ر.س', img: 'https://images.unsplash.com/photo-1587584160352-736021198642?auto=format&fit=crop&q=80&w=200', quantity: 2, attributes: 'الحجم: 80x120 سم' },
];

type CartCtx = {
  items: CartItem[];
  addItem: (input: AddInput) => void;
  removeItem: (uid: string) => void;
  updateQty: (uid: string, delta: number) => void;
  count: number;
  subtotal: number;
};

const CartContext = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(SEED);

  const addItem = (input: AddInput) => {
    setItems((prev) => {
      // products: merge duplicates by name+attributes; services: always a new line
      if (input.type === 'product') {
        const idx = prev.findIndex(
          (i) => i.type === 'product' && i.name === input.name && (i.attributes || '') === (input.attributes || '')
        );
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
          return next;
        }
      }
      const item: CartItem = {
        uid: `${input.type}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        type: input.type,
        name: input.name,
        vendor: input.vendor,
        img: input.img,
        quantity: 1,
        price: toNumber(input.price),
        priceLabel: toLabel(input.price),
        attributes: input.attributes,
      };
      return [...prev, item];
    });
  };

  const removeItem = (uid: string) => setItems((prev) => prev.filter((i) => i.uid !== uid));

  const updateQty = (uid: string, delta: number) =>
    setItems((prev) => prev.map((i) => (i.uid === uid ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)));

  const count = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, count, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartCtx {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
