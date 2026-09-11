import axios from 'axios';
import { apiClient } from './client.ts';
import { ensureCsrfCookie } from '../lib/csrf.ts';
import type { ApiSuccessResponse } from '../types/api.ts';
import type {
  SecurityDevice,
  SecuritySession,
  SecuritySessionsActionResult,
  TwoFactorActionResult,
  TwoFactorStatus,
} from '../types/profileSecurity.ts';
import type { AuthUser } from '../types/auth.ts';

type DevicesResponse = ApiSuccessResponse<{ devices?: SecurityDevice[]; sessions?: SecuritySession[] }>;
type LogoutOthersResponse = ApiSuccessResponse<{ revoked_count: number }>;
type RevokeDeviceResponse = ApiSuccessResponse<{ revoked_count: number }>;
type MessageResponse = ApiSuccessResponse<Record<string, never>>;

async function withCsrf<T>(action: () => Promise<T>): Promise<T> {
  await ensureCsrfCookie();
  return action();
}

function extractMessage(response: { data: ApiSuccessResponse<unknown> }): string | undefined {
  return response.data.message;
}

function legacySessionToDevice(session: SecuritySession): SecurityDevice {
  return {
    fingerprint: session.id,
    device_type: session.device_type,
    browser: session.browser,
    browser_version: session.browser_version,
    platform: session.platform,
    platform_version: session.platform_version,
    device_name: session.device_name,
    country: session.country,
    city: session.city,
    region: session.region,
    location_source: session.location_source,
    ip_address: session.ip_address ?? null,
    is_local_ip: session.is_local_ip ?? false,
    is_current: session.is_current,
    session_count: 1,
    first_seen_at: session.first_seen_at,
    last_activity_at: session.last_activity_at,
    sessions: [session],
  };
}

export async function fetchSecurityDevices(): Promise<SecurityDevice[]> {
  const response = await apiClient.get<DevicesResponse>('/profile/security/sessions');
  const payload = response.data.data;

  if (Array.isArray(payload.devices)) {
    return payload.devices;
  }

  if (Array.isArray(payload.sessions)) {
    return payload.sessions.map(legacySessionToDevice);
  }

  return [];
}

export async function revokeSecuritySession(sessionId: string): Promise<SecuritySessionsActionResult> {
  const response = await withCsrf(() =>
    apiClient.delete<MessageResponse>(`/profile/security/sessions/${sessionId}`),
  );

  return { message: extractMessage(response) };
}

const SHA256_FINGERPRINT = /^[a-f0-9]{64}$/i;

function isNotFoundError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

export async function revokeSecurityDevice(device: SecurityDevice): Promise<SecuritySessionsActionResult> {
  const targets = device.sessions.filter((session) => !session.is_current);
  if (targets.length === 0) {
    return { revokedCount: 0 };
  }

  if (SHA256_FINGERPRINT.test(device.fingerprint)) {
    try {
      const response = await withCsrf(() =>
        apiClient.delete<RevokeDeviceResponse>(`/profile/security/devices/${device.fingerprint}`),
      );

      return {
        revokedCount: response.data.data.revoked_count,
        message: extractMessage(response),
      };
    } catch (error) {
      if (!isNotFoundError(error)) {
        throw error;
      }
    }
  }

  let message: string | undefined;
  for (const session of targets) {
    const response = await withCsrf(() =>
      apiClient.delete<MessageResponse>(`/profile/security/sessions/${session.id}`),
    );
    message = extractMessage(response) ?? message;
  }

  return {
    revokedCount: targets.length,
    message,
  };
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

type TwoFactorStatusResponse = ApiSuccessResponse<TwoFactorStatus>;
type TwoFactorConfirmResponse = ApiSuccessResponse<{ two_factor: TwoFactorStatus; user: AuthUser }>;

export async function fetchTwoFactorStatus(): Promise<TwoFactorStatus> {
  const response = await apiClient.get<TwoFactorStatusResponse>('/profile/security/two-factor', {
    validateStatus: (status) => status === 200 || status === 404,
  });

  if (response.status === 404) {
    return {
      enabled: false,
      confirmed_at: null,
      phone_masked: null,
      apiUnavailable: true,
    };
  }

  return response.data.data;
}

export async function enableTwoFactor(): Promise<TwoFactorActionResult> {
  const response = await withCsrf(() =>
    apiClient.post<MessageResponse>('/profile/security/two-factor/enable'),
  );
  return { message: extractMessage(response) };
}

export async function confirmTwoFactor(code: string): Promise<TwoFactorActionResult & { user?: AuthUser }> {
  const response = await withCsrf(() =>
    apiClient.post<TwoFactorConfirmResponse>('/profile/security/two-factor/confirm', { code }),
  );
  return {
    message: extractMessage(response),
    two_factor: response.data.data.two_factor,
    user: response.data.data.user,
  };
}

export async function disableTwoFactor(payload: {
  password: string;
  code?: string;
}): Promise<TwoFactorActionResult & { user?: AuthUser }> {
  const response = await withCsrf(() =>
    apiClient.post<TwoFactorConfirmResponse | MessageResponse>(
      '/profile/security/two-factor/disable',
      payload,
    ),
  );
  const data = response.data.data as Partial<{ two_factor: TwoFactorStatus; user: AuthUser }> | undefined;

  return {
    message: extractMessage(response),
    two_factor: data?.two_factor,
    user: data?.user,
  };
}
