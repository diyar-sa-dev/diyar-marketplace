import { apiClient } from './client.ts';
import { ensureCsrfCookie } from '../lib/csrf.ts';
import type { ApiSuccessResponse } from '../types/api.ts';
import type { VendorShippingSettings, VendorShippingSettingsPayload } from '../types/shipping.ts';

export type AvailableCarrier = {
  carrier_code: string;
  name: string;
  is_sandbox: boolean;
};

export type VendorShippingSettingsResponse = {
  settings: VendorShippingSettings | null;
  availableCarriers: AvailableCarrier[];
};

export async function fetchVendorShippingSettings(): Promise<VendorShippingSettingsResponse> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{
      shipping_settings: VendorShippingSettings | null;
      available_carriers?: AvailableCarrier[];
    }>
  >('/dashboard/vendor/shipping-settings');
  return {
    settings: data.data.shipping_settings,
    availableCarriers: data.data.available_carriers ?? [],
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

export async function fetchVendorPickupAddresses(): Promise<import('../types/shipping.ts').VendorPickupAddress[]> {
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
