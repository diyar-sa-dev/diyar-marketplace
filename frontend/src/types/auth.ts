export type UserRole = {
  id: string;
  name: 'customer' | 'vendor' | 'provider' | 'marketer' | 'admin';
  label: string;
  status: string;
};

export type AuthUser = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  preferences?: Record<string, unknown>;
  status: 'pending' | 'active' | 'suspended' | 'rejected';
  phone_verified_at: string | null;
  email_verified_at: string | null;
  roles?: UserRole[];
  vendor_account?: {
    id: string;
    slug: string;
    store_name: string;
  } | null;
  created_at?: string;
};

export type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

export type LoginPayload = {
  method: 'phone' | 'email';
  identifier: string;
  password: string;
  remember?: boolean;
};

export type RegisterPayload = {
  name: string;
  phone: string;
  email?: string;
  password: string;
  roles: string[];
};

export type VerifyOtpPayload = {
  phone: string;
  code: string;
};

export type VerifyEmailOtpPayload = {
  email: string;
  code: string;
};

export type ResetPasswordPayload = {
  phone: string;
  code: string;
  password: string;
  password_confirmation: string;
};

export type AuthActionResult = {
  message?: string;
};

export type AuthUserResult = AuthActionResult & {
  user: AuthUser;
};
