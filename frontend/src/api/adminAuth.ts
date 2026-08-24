import { adminApi } from './client.ts';
import { ensureCsrfCookie, resetCsrfCookie } from '../lib/csrf.ts';
import type { AuthActionResult, AuthUser, AuthUserResult, LoginPayload } from '../types/auth.ts';
import type { ApiSuccessResponse } from '../types/api.ts';

type UserResponse = ApiSuccessResponse<{ user: AuthUser }>;
type SessionResponse = ApiSuccessResponse<{ user: AuthUser; permissions: string[] }>;
type MessageResponse = ApiSuccessResponse<Record<string, never>>;

async function withCsrf<T>(action: () => Promise<T>): Promise<T> {
  resetCsrfCookie();
  await ensureCsrfCookie({ refresh: true });
  return action();
}

function extractMessage(response: { data: ApiSuccessResponse<unknown> }): string | undefined {
  return response.data.message;
}

export async function loginAdmin(payload: LoginPayload): Promise<AuthUserResult> {
  const response = await withCsrf(() => adminApi.post<UserResponse>('/admin/auth/login', payload));
  resetCsrfCookie();
  return {
    user: response.data.data.user,
    message: extractMessage(response),
  };
}

export async function logoutAdmin(): Promise<AuthActionResult> {
  const response = await withCsrf(() => adminApi.post<MessageResponse>('/admin/auth/logout'));
  resetCsrfCookie();
  return { message: extractMessage(response) };
}

export async function fetchAdminSession(): Promise<{
  user: AuthUser;
  permissions: string[];
} | null> {
  const response = await adminApi.get<SessionResponse>('/admin/session', {
    validateStatus: (status) => status === 200 || status === 401 || status === 403,
  });

  if (response.status === 401 || response.status === 403) {
    return null;
  }

  return {
    user: response.data.data.user,
    permissions: response.data.data.permissions,
  };
}
