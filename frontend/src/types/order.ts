import type { ShippingMethod } from './shipping.ts';

export type OrderItem = {
  id: string;
  product_id: string;
  product_name: string;
  product_slug: string | null;
  unit_price: string;
  quantity: number;
  line_subtotal: string;
  color: { name: string | null; hex_code: string | null };
  image_url?: string | null;
  category_name?: string | null;
};

export type Shipment = {
  id: string;
  status: string;
  tracking_number?: string | null;
  carrier?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
};

export type VendorOrder = {
  id: string;
  order_id: string;
  order_number?: string;
  vendor_account_id: string;
  vendor_name?: string;
  status: string;
  subtotal: string;
  shipping_method: ShippingMethod | string;
  shipping_cost: string;
  pickup_location_label: string | null;
  free_shipping_applied: boolean;
  assembly_cost: string;
  discount_amount: string;
  coupon_code?: string | null;
  coupon_percent?: number | null;
  vat_amount: string;
  vendor_total: string;
  items?: OrderItem[];
  shipment?: Shipment | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  customer_member_since?: string | null;
  shipping_address?: {
    label?: string | null;
    type?: string | null;
    recipient_name: string;
    phone: string;
    city: string | null;
    district: string | null;
    street: string | null;
    building: string | null;
    apartment: string | null;
  } | null;
  payment_status?: string | null;
  payment_method?: string | null;
  payment_method_label?: string | null;
  payment_reference?: string | null;
  created_at?: string;
};

export type Payment = {
  id: string;
  status: string;
  amount: string;
  currency: string;
};

export type Order = {
  id: string;
  order_number: string;
  status: string;
  effective_status?: string;
  shipping_address: {
    id: string;
    recipient_name: string;
    phone: string;
    city: string | null;
    district: string | null;
    street: string | null;
    building: string | null;
    apartment: string | null;
  };
  subtotal: string;
  shipping_total: string;
  assembly_total: string;
  discount_total: string;
  vat_amount: string;
  grand_total: string;
  vendor_orders?: VendorOrder[];
  payment?: Payment;
  created_at?: string;
};

export type OrderListResponse = {
  orders: Order[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type VendorOrderListResponse = {
  vendor_orders: VendorOrder[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type VendorOrderFilters = {
  page?: number;
  per_page?: number;
  q?: string;
  status?: string;
  payment_status?: string;
};

export type CreateManualVendorOrderPayload = {
  customer_name: string;
  vendor_total: string;
  items_count: number;
  status: string;
  payment_status: 'paid' | 'pending';
  customer_phone?: string;
  customer_email?: string;
};
