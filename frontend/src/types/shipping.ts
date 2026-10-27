export type ShippingMethod = 'carrier' | 'pickup';

export type VendorShippingSettings = {
  carrier_enabled: boolean;
  carrier_flat_rate: string | null;
  carrier_free_shipping_enabled: boolean;
  carrier_free_shipping_threshold: string | null;
  pickup_enabled: boolean;
  pickup_location_label: string | null;
  use_advanced_rules?: boolean;
  fulfillment_type?: 'manual' | 'carrier' | 'hybrid';
  selected_carrier_code?: string;
};

export type VendorPickupAddress = {
  id: string;
  contact_name: string;
  contact_phone: string;
  city: string;
  district?: string | null;
  street?: string | null;
  building_number?: string | null;
  postal_code?: string | null;
  is_default: boolean;
};

export type VendorShippingSettingsPayload = VendorShippingSettings;
