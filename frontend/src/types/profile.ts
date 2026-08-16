import type { AuthUser } from './auth.ts';

export type UserProfile = AuthUser & {
  bio?: string | null;
  avatar_url?: string | null;
  preferences?: Record<string, unknown>;
};

export type AddressType = 'home' | 'work';

export type UserAddress = {
  id: string;
  label: string;
  type: AddressType;
  recipient_name: string;
  phone: string;
  city: string | null;
  district: string | null;
  street: string | null;
  building: string | null;
  apartment: string | null;
  is_default: boolean;
  formatted_summary: string;
  created_at?: string;
  updated_at?: string;
};

export type UpdateProfilePayload = {
  name?: string;
  email?: string | null;
  bio?: string | null;
  preferences?: Record<string, unknown>;
};

export type StoreAddressPayload = {
  label: string;
  type: AddressType;
  recipient_name: string;
  phone: string;
  city?: string;
  district?: string;
  street?: string;
  building?: string;
  apartment?: string;
  is_default?: boolean;
};

export type UpdateAddressPayload = Partial<StoreAddressPayload>;

export type ProfileActionResult = {
  profile: UserProfile;
  message?: string;
};

export type AddressActionResult = {
  address: UserAddress;
  message?: string;
};
