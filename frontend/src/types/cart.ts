export type CartTotals = {
  subtotal: string;
  discount: string | null;
  shipping: string | null;
  tax: string | null;
  total: string | null;
};

export type CartProductDimensions = {
  width: string | number | null;
  height: string | number | null;
  depth: string | number | null;
};

export type CartProductSnapshot = {
  id: string;
  name: string;
  slug: string;
  sale_price: string | number;
  availability_mode: 'in_stock' | 'preorder' | 'out_of_stock';
  image_url: string | null;
  vendor: { vendor_account_id?: string; store_name: string; slug: string } | null;
  inventory: { available_quantity: number } | null;
  dimensions?: CartProductDimensions | null;
  user_saved?: boolean;
};

export type CartItemColor = {
  name: string;
  hex_code: string;
};

export type CartItem = {
  id: string;
  product_id: string;
  quantity: number;
  unit_price_snapshot: string;
  line_subtotal: string;
  color: CartItemColor | null;
  product: CartProductSnapshot | null;
};

export type Cart = {
  id: string;
  status: string;
  item_count: number;
  items: CartItem[];
  totals: CartTotals;
};

export type CartValidationItem = {
  item_id: string;
  product_id: string;
  quantity: number;
  unit_price_snapshot: string;
  valid: boolean;
  issues: string[];
  current_unit_price?: string;
  available_quantity?: number;
  availability_mode?: string;
  expected_available_at?: string;
};

export type CartValidation = {
  valid: boolean;
  items: CartValidationItem[];
  totals: CartTotals;
};
