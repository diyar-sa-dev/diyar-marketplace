import { apiClient } from './client.ts';
import { ensureCsrfCookie } from '../lib/csrf.ts';
import type { ApiSuccessResponse } from '../types/api.ts';
import type { VendorShippingSettings, VendorShippingSettingsPayload } from '../types/shipping.ts';

export type AvailableCarrier = {
  carrier_code: string;
  name: string;
  is_sandbox: boolean;
};

export type ManualCarrierRateRule = {
  id: string;
  rate: string;
  min_weight_kg: string;
  max_weight_kg?: string | null;
  delivery_estimate_days?: number | null;
};

export type ManualCarrierMethod = {
  id: string;
  code: string;
  name: string;
  rate_rules?: ManualCarrierRateRule[];
};

export type ManualCarrier = {
  id: string;
  code: string;
  name: string;
  methods?: ManualCarrierMethod[];
};

export type VendorShippingSettingsResponse = {
  settings: VendorShippingSettings | null;
  availableCarriers: AvailableCarrier[];
  manualCarriers: ManualCarrier[];
};

export async function fetchVendorShippingSettings(): Promise<VendorShippingSettingsResponse> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{
      shipping_settings: VendorShippingSettings | null;
      available_carriers?: AvailableCarrier[];
      manual_carriers?: ManualCarrier[];
    }>
  >('/dashboard/vendor/shipping-settings');
  return {
    settings: data.data.shipping_settings,
    availableCarriers: data.data.available_carriers ?? [],
    manualCarriers: data.data.manual_carriers ?? [],
  };
}

export async function updateVendorShippingSettings(
  payload: VendorShippingSettingsPayload,
): Promise<VendorShippingSettings> {
  await ensureCsrfCookie();
  const { data } = await apiClient.put<
    ApiSuccessResponse<{ shipping_settings: VendorShippingSettings }>
  >('/dashboard/vendor/shipping-settings', payload);
  return data.data.shipping_settings;
}

export async function fetchVendorPickupAddresses(): Promise<
  import('../types/shipping.ts').VendorPickupAddress[]
> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{ addresses: import('../types/shipping.ts').VendorPickupAddress[] }>
  >('/dashboard/vendor/pickup-addresses');
  return data.data.addresses;
}

export async function createVendorPickupAddress(
  payload: Omit<import('../types/shipping.ts').VendorPickupAddress, 'id'>,
): Promise<import('../types/shipping.ts').VendorPickupAddress> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<
    ApiSuccessResponse<{ address: import('../types/shipping.ts').VendorPickupAddress }>
  >('/dashboard/vendor/pickup-addresses', payload);
  return data.data.address;
}
