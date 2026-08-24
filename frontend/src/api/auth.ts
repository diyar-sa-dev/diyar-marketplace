import { marketplaceApi } from './client.ts';
import { authRequestConfig, bootstrapCsrfToken, resetCsrfCookie } from '../lib/csrf.ts';
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

async function withCsrf<T>(
  action: (csrfToken: string) => Promise<T>,
  options?: { refresh?: boolean },
): Promise<T> {
  const csrfToken = await bootstrapCsrfToken({ refresh: options?.refresh ?? true });
  return action(csrfToken);
}

function extractMessage(response: { data: ApiSuccessResponse<unknown> }): string | undefined {
  return response.data.message;
}

export async function register(payload: RegisterPayload): Promise<AuthUserResult> {
  const response = await withCsrf((csrfToken) =>
    marketplaceApi.post<UserResponse>('/auth/register', payload, authRequestConfig(csrfToken)),
  );
  return {
    user: response.data.data.user,
    message: extractMessage(response),
  };
}

export async function verifyOtp(payload: VerifyOtpPayload): Promise<AuthUserResult> {
  const response = await withCsrf((csrfToken) =>
    marketplaceApi.post<UserResponse>('/auth/verify-otp', payload, authRequestConfig(csrfToken)),
  );
  resetCsrfCookie();
  return {
    user: response.data.data.user,
    message: extractMessage(response),
  };
}

export async function resendOtp(phone: string): Promise<AuthActionResult> {
  const response = await withCsrf((csrfToken) =>
    marketplaceApi.post<MessageResponse>('/auth/resend-otp', { phone }, authRequestConfig(csrfToken)),
  );
  return { message: extractMessage(response) };
}

export async function verifyEmailOtp(payload: VerifyEmailOtpPayload): Promise<AuthUserResult> {
  const response = await withCsrf((csrfToken) =>
    marketplaceApi.post<UserResponse>(
      '/auth/verify-email-otp',
      payload,
      authRequestConfig(csrfToken),
    ),
  );
  resetCsrfCookie();
  return {
    user: response.data.data.user,
    message: extractMessage(response),
  };
}

export async function resendEmailOtp(email: string): Promise<AuthActionResult> {
  const response = await withCsrf((csrfToken) =>
    marketplaceApi.post<MessageResponse>(
      '/auth/resend-email-otp',
      { email },
      authRequestConfig(csrfToken),
    ),
  );
  return { message: extractMessage(response) };
}

export async function login(payload: LoginPayload): Promise<AuthUserResult> {
  const response = await withCsrf(
    (csrfToken) =>
      marketplaceApi.post<UserResponse>('/auth/login', payload, authRequestConfig(csrfToken)),
    { refresh: false },
  );
  resetCsrfCookie();
  return {
    user: response.data.data.user,
    message: extractMessage(response),
  };
}

export async function logout(): Promise<AuthActionResult> {
  const response = await withCsrf((csrfToken) =>
    marketplaceApi.post<MessageResponse>('/auth/logout', undefined, authRequestConfig(csrfToken)),
  );
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
  const response = await withCsrf((csrfToken) =>
    marketplaceApi.post<MessageResponse>(
      '/auth/forgot-password',
      { phone },
      authRequestConfig(csrfToken),
    ),
  );
  return { message: extractMessage(response) };
}

export async function verifyPasswordResetOtp(payload: VerifyOtpPayload): Promise<AuthActionResult> {
  const response = await withCsrf((csrfToken) =>
    marketplaceApi.post<MessageResponse>(
      '/auth/verify-password-reset-otp',
      payload,
      authRequestConfig(csrfToken),
    ),
  );
  return { message: extractMessage(response) };
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<AuthActionResult> {
  const response = await withCsrf((csrfToken) =>
    marketplaceApi.post<MessageResponse>(
      '/auth/reset-password',
      payload,
      authRequestConfig(csrfToken),
    ),
  );
  return { message: extractMessage(response) };
}
