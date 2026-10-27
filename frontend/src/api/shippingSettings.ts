import { apiClient } from './client.ts';
import { ensureCsrfCookie } from '../lib/csrf.ts';
import type { ApiSuccessResponse } from '../types/api.ts';
import type { VendorShippingSettings, VendorShippingSettingsPayload } from '../types/shipping.ts';

export async function fetchVendorShippingSettings(): Promise<VendorShippingSettings | null> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{ shipping_settings: VendorShippingSettings | null }>
  >('/dashboard/vendor/shipping-settings');
  return data.data.shipping_settings;
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
