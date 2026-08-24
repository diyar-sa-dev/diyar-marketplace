import { marketplaceApi } from './client.ts';
import { ensureCsrfCookie, resetCsrfCookie } from '../lib/csrf.ts';
import type {
  AuthActionResult,
  AuthUser,
  AuthUserResult,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  VerifyEmailOtpPayload,
  VerifyOtpPayload,
} from '../types/auth.ts';
import type { ApiSuccessResponse } from '../types/api.ts';

type UserResponse = ApiSuccessResponse<{ user: AuthUser }>;
type MessageResponse = ApiSuccessResponse<Record<string, never>>;

async function withCsrf<T>(action: () => Promise<T>): Promise<T> {
  resetCsrfCookie();
  await ensureCsrfCookie({ refresh: true });
  return action();
}

function extractMessage(response: { data: ApiSuccessResponse<unknown> }): string | undefined {
  return response.data.message;
}

export async function register(payload: RegisterPayload): Promise<AuthUserResult> {
  const response = await withCsrf(() =>
    marketplaceApi.post<UserResponse>('/auth/register', payload),
  );
  return {
    user: response.data.data.user,
    message: extractMessage(response),
  };
}

export async function verifyOtp(payload: VerifyOtpPayload): Promise<AuthUserResult> {
  const response = await withCsrf(() =>
    marketplaceApi.post<UserResponse>('/auth/verify-otp', payload),
  );
  resetCsrfCookie();
  return {
    user: response.data.data.user,
    message: extractMessage(response),
  };
}

export async function resendOtp(phone: string): Promise<AuthActionResult> {
  const response = await withCsrf(() =>
    marketplaceApi.post<MessageResponse>('/auth/resend-otp', { phone }),
  );
  return { message: extractMessage(response) };
}

export async function verifyEmailOtp(payload: VerifyEmailOtpPayload): Promise<AuthUserResult> {
  const response = await withCsrf(() =>
    marketplaceApi.post<UserResponse>('/auth/verify-email-otp', payload),
  );
  resetCsrfCookie();
  return {
    user: response.data.data.user,
    message: extractMessage(response),
  };
}

export async function resendEmailOtp(email: string): Promise<AuthActionResult> {
  const response = await withCsrf(() =>
    marketplaceApi.post<MessageResponse>('/auth/resend-email-otp', { email }),
  );
  return { message: extractMessage(response) };
}

export async function login(payload: LoginPayload): Promise<AuthUserResult> {
  const response = await withCsrf(() => marketplaceApi.post<UserResponse>('/auth/login', payload));
  resetCsrfCookie();
  return {
    user: response.data.data.user,
    message: extractMessage(response),
  };
}

export async function logout(): Promise<AuthActionResult> {
  const response = await withCsrf(() => marketplaceApi.post<MessageResponse>('/auth/logout'));
  resetCsrfCookie();
  return { message: extractMessage(response) };
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const response = await marketplaceApi.get<UserResponse>('/auth/me', {
    validateStatus: (status) => status === 200 || status === 401 || status === 403,
  });

  if (response.status === 401 || response.status === 403) {
    return null;
  }

  return response.data.data.user;
}

export async function forgotPassword(phone: string): Promise<AuthActionResult> {
  const response = await withCsrf(() =>
    marketplaceApi.post<MessageResponse>('/auth/forgot-password', { phone }),
  );
  return { message: extractMessage(response) };
}

export async function verifyPasswordResetOtp(payload: VerifyOtpPayload): Promise<AuthActionResult> {
  const response = await withCsrf(() =>
    marketplaceApi.post<MessageResponse>('/auth/verify-password-reset-otp', payload),
  );
  return { message: extractMessage(response) };
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<AuthActionResult> {
  const response = await withCsrf(() =>
    marketplaceApi.post<MessageResponse>('/auth/reset-password', payload),
  );
  return { message: extractMessage(response) };
}
