import type { ShippingMethod } from './shipping.ts';

export type VendorDeliverySelection = {
  vendor_account_id: string;
  method: ShippingMethod;
};

export type VendorCouponSelection = {
  vendor_account_id: string;
  code: string;
};

export type CheckoutPreviewPayload = {
  shipping_address_id: string;
  vendor_delivery_selections: VendorDeliverySelection[];
  vendor_coupons?: VendorCouponSelection[];
};

export type CheckoutPreviewVendorGroup = {
  vendor_account_id: string;
  vendor_name: string;
  items: Array<{
    item_id: string;
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: string;
    line_subtotal: string;
    color: { name: string | null; hex_code: string | null };
  }>;
  subtotal: string;
  available_methods: ShippingMethod[];
  selected_method: ShippingMethod;
  shipping: {
    method: ShippingMethod;
    cost: string;
    free_shipping_applied: boolean;
    pickup_location_label: string | null;
  };
  assembly: string;
  discount: string;
  coupon: {
    id: string;
    code: string;
    type: string;
    value: number;
    maximum_discount: string | null;
  } | null;
  vat: string;
  vendor_total: string;
};

export type CheckoutPreviewTotals = {
  subtotal: string;
  shipping: string | null;
  assembly: string | null;
  discount: string | null;
  vat: string | null;
  total: string | null;
};

export type CheckoutPreview = {
  valid: boolean;
  cart: { id: string; item_count: number };
  validation: unknown;
  shipping_address_id: string;
  vendor_groups: CheckoutPreviewVendorGroup[];
  totals: CheckoutPreviewTotals;
};
