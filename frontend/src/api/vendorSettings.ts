import { apiClient } from './client.ts';
import { ensureCsrfCookie } from '../lib/csrf.ts';
import type { ApiSuccessResponse } from '../types/api.ts';

export type BusinessEntityType = 'sole_proprietorship' | 'freelancer_document' | 'company';
export type SaudiBankCode = 'snb' | 'alrajhi' | 'riyad' | 'bsf';
export type Weekday =
  'saturday' | 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

export type VendorWorkingHour = {
  day: Weekday;
  is_closed: boolean;
  opens_at: string | null;
  closes_at: string | null;
  closes_next_day?: boolean;
};

export type VendorLegalProfile = {
  entity_type: BusinessEntityType;
  commercial_registration_number: string;
  tax_number: string | null;
};

export type VendorBankAccount = {
  id: string;
  bank_code: SaudiBankCode;
  bank_label: string;
  beneficiary_name: string;
  iban_masked: string;
  iban_last4: string;
  is_active: boolean;
};

export type VendorSettings = {
  id: string;
  business_name: string;
  slug: string;
  store_domain: string;
  description: string | null;
  location: string | null;
  support_phone: string | null;
  support_email: string | null;
  website_url: string | null;
  logo_url: string | null;
  cover_url: string | null;
  legal_profile: VendorLegalProfile | null;
  bank_account: VendorBankAccount | null;
  working_hours: VendorWorkingHour[];
  payout_schedule: { min_days: number; max_days: number };
  payout_minimum: string;
};

type SettingsResponse = ApiSuccessResponse<{ settings: VendorSettings }>;

async function withCsrf<T>(action: () => Promise<T>): Promise<T> {
  await ensureCsrfCookie();
  return action();
}

export async function fetchVendorSettings(): Promise<VendorSettings> {
  const { data } = await apiClient.get<SettingsResponse>('/dashboard/vendor/settings');
  return data.data.settings;
}

export async function updateVendorSettings(payload: {
  business_name?: string;
  slug?: string;
  description?: string | null;
  location?: string | null;
  support_phone?: string | null;
  support_email?: string | null;
  website_url?: string | null;
}): Promise<VendorSettings> {
  const { data } = await withCsrf(() =>
    apiClient.patch<SettingsResponse>('/dashboard/vendor/settings', payload),
  );
  return data.data.settings;
}

export async function uploadVendorLogo(file: File): Promise<VendorSettings> {
  const formData = new FormData();
  formData.append('logo', file);
  const { data } = await withCsrf(() =>
    apiClient.post<SettingsResponse>('/dashboard/vendor/settings/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  );
  return data.data.settings;
}

export async function deleteVendorLogo(): Promise<VendorSettings> {
  const { data } = await withCsrf(() =>
    apiClient.delete<SettingsResponse>('/dashboard/vendor/settings/logo'),
  );
  return data.data.settings;
}

export async function uploadVendorCover(file: File): Promise<VendorSettings> {
  const formData = new FormData();
  formData.append('cover', file);
  const { data } = await withCsrf(() =>
    apiClient.post<SettingsResponse>('/dashboard/vendor/settings/cover', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  );
  return data.data.settings;
}

export async function deleteVendorCover(): Promise<VendorSettings> {
  const { data } = await withCsrf(() =>
    apiClient.delete<SettingsResponse>('/dashboard/vendor/settings/cover'),
  );
  return data.data.settings;
}

export async function updateVendorLegalProfile(
  payload: VendorLegalProfile,
): Promise<VendorSettings> {
  const { data } = await withCsrf(() =>
    apiClient.put<SettingsResponse>('/dashboard/vendor/settings/legal', payload),
  );
  return data.data.settings;
}

export async function updateVendorBankAccount(payload: {
  bank_code: SaudiBankCode;
  beneficiary_name: string;
  iban: string;
}): Promise<VendorSettings> {
  const { data } = await withCsrf(() =>
    apiClient.put<SettingsResponse>('/dashboard/vendor/settings/bank-account', payload),
  );
  return data.data.settings;
}

export async function updateVendorWorkingHours(
  hours: VendorWorkingHour[],
): Promise<VendorSettings> {
  const { data } = await withCsrf(() =>
    apiClient.put<SettingsResponse>('/dashboard/vendor/settings/working-hours', { hours }),
  );
  return data.data.settings;
}
