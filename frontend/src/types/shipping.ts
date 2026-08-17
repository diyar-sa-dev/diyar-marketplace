export type ShippingMethod = 'carrier' | 'pickup';

export type VendorShippingSettings = {
  carrier_enabled: boolean;
  carrier_flat_rate: string | null;
  carrier_free_shipping_enabled: boolean;
  carrier_free_shipping_threshold: string | null;
  pickup_enabled: boolean;
  pickup_location_label: string | null;
};

export type VendorShippingSettingsPayload = VendorShippingSettings;
