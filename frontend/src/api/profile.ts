import { apiClient } from './client.ts';
import { ensureCsrfCookie } from '../lib/csrf.ts';
import type { ApiSuccessResponse } from '../types/api.ts';
import type {
  AddressActionResult,
  ProfileActionResult,
  StoreAddressPayload,
  UpdateAddressPayload,
  UpdateProfilePayload,
  UserAddress,
  UserProfile,
} from '../types/profile.ts';

type ProfileResponse = ApiSuccessResponse<{ profile: UserProfile }>;
type AddressesResponse = ApiSuccessResponse<{ addresses: UserAddress[] }>;
type AddressResponse = ApiSuccessResponse<{ address: UserAddress }>;
type MessageResponse = ApiSuccessResponse<Record<string, never>>;

async function withCsrf<T>(action: () => Promise<T>): Promise<T> {
  await ensureCsrfCookie();
  return action();
}

function extractMessage(response: { data: ApiSuccessResponse<unknown> }): string | undefined {
  return response.data.message;
}

export async function fetchProfile(): Promise<UserProfile> {
  const response = await apiClient.get<ProfileResponse>('/profile');
  return response.data.data.profile;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<ProfileActionResult> {
  const response = await withCsrf(() => apiClient.patch<ProfileResponse>('/profile', payload));
  return {
    profile: response.data.data.profile,
    message: extractMessage(response),
  };
}

export async function uploadAvatar(file: File): Promise<ProfileActionResult> {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await withCsrf(() =>
    apiClient.post<ProfileResponse>('/profile/avatar', formData),
  );

  return {
    profile: response.data.data.profile,
    message: extractMessage(response),
  };
}

export async function deleteAvatar(): Promise<ProfileActionResult> {
  const response = await withCsrf(() => apiClient.delete<ProfileResponse>('/profile/avatar'));
  return {
    profile: response.data.data.profile,
    message: extractMessage(response),
  };
}

export async function fetchAddresses(): Promise<UserAddress[]> {
  const response = await apiClient.get<AddressesResponse>('/profile/addresses');
  return response.data.data.addresses;
}

export async function createAddress(payload: StoreAddressPayload): Promise<AddressActionResult> {
  const response = await withCsrf(() =>
    apiClient.post<AddressResponse>('/profile/addresses', payload),
  );
  return {
    address: response.data.data.address,
    message: extractMessage(response),
  };
}

export async function updateAddress(
  id: string,
  payload: UpdateAddressPayload,
): Promise<AddressActionResult> {
  const response = await withCsrf(() =>
    apiClient.patch<AddressResponse>(`/profile/addresses/${id}`, payload),
  );
  return {
    address: response.data.data.address,
    message: extractMessage(response),
  };
}

export async function deleteAddress(id: string): Promise<string | undefined> {
  const response = await withCsrf(() =>
    apiClient.delete<MessageResponse>(`/profile/addresses/${id}`),
  );
  return extractMessage(response);
}

export async function setDefaultAddress(id: string): Promise<AddressActionResult> {
  const response = await withCsrf(() =>
    apiClient.post<AddressResponse>(`/profile/addresses/${id}/default`),
  );
  return {
    address: response.data.data.address,
    message: extractMessage(response),
  };
}

export async function requestPhoneChange(phone: string): Promise<string | undefined> {
  const response = await withCsrf(() =>
    apiClient.post<MessageResponse>('/profile/phone/request-change', { phone }),
  );
  return extractMessage(response);
}

export async function resendPhoneChange(phone: string): Promise<string | undefined> {
  const response = await withCsrf(() =>
    apiClient.post<MessageResponse>('/profile/phone/resend-change', { phone }),
  );
  return extractMessage(response);
}

export async function verifyPhoneChange(phone: string, code: string): Promise<ProfileActionResult> {
  const response = await withCsrf(() =>
    apiClient.post<ProfileResponse>('/profile/phone/verify-change', { phone, code }),
  );
  return {
    profile: response.data.data.profile,
    message: extractMessage(response),
  };
}

export async function requestEmailVerification(): Promise<string | undefined> {
  const response = await withCsrf(() =>
    apiClient.post<MessageResponse>('/profile/email/request-verification'),
  );
  return extractMessage(response);
}

export async function resendEmailVerification(): Promise<string | undefined> {
  const response = await withCsrf(() =>
    apiClient.post<MessageResponse>('/profile/email/resend-verification'),
  );
  return extractMessage(response);
}

export async function verifyEmailVerification(code: string): Promise<ProfileActionResult> {
  const response = await withCsrf(() =>
    apiClient.post<ProfileResponse>('/profile/email/verify', { code }),
  );
  return {
    profile: response.data.data.profile,
    message: extractMessage(response),
  };
}
