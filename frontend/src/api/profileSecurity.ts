import { apiClient } from './client.ts';
import { ensureCsrfCookie } from '../lib/csrf.ts';
import type { ApiSuccessResponse } from '../types/api.ts';
import type { SecuritySession, SecuritySessionsActionResult } from '../types/profileSecurity.ts';

type SessionsResponse = ApiSuccessResponse<{ sessions: SecuritySession[] }>;
type LogoutOthersResponse = ApiSuccessResponse<{ revoked_count: number }>;
type MessageResponse = ApiSuccessResponse<Record<string, never>>;

async function withCsrf<T>(action: () => Promise<T>): Promise<T> {
  await ensureCsrfCookie();
  return action();
}

function extractMessage(response: { data: ApiSuccessResponse<unknown> }): string | undefined {
  return response.data.message;
}

export async function fetchSecuritySessions(): Promise<SecuritySession[]> {
  const response = await apiClient.get<SessionsResponse>('/profile/security/sessions');
  return response.data.data.sessions;
}

export async function revokeSecuritySession(sessionId: string): Promise<SecuritySessionsActionResult> {
  const response = await withCsrf(() =>
    apiClient.delete<MessageResponse>(`/profile/security/sessions/${sessionId}`),
  );

  return { message: extractMessage(response) };
}

export async function logoutOtherSecuritySessions(): Promise<SecuritySessionsActionResult> {
  const response = await withCsrf(() =>
    apiClient.post<LogoutOthersResponse>('/profile/security/sessions/logout-others'),
  );

  return {
    revokedCount: response.data.data.revoked_count,
    message: extractMessage(response),
  };
}
