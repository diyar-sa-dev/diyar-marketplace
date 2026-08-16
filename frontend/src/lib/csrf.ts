import axios from 'axios';
import { env } from './env.ts';

export function csrfCookieUrl(): string {
  return env.backendUrl ? `${env.backendUrl}/sanctum/csrf-cookie` : '/sanctum/csrf-cookie';
}

export function readXsrfToken(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
  if (!match?.[1]) {
    return null;
  }

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

/**
 * Always fetch a fresh CSRF cookie before mutating requests.
 */
export async function ensureCsrfCookie(): Promise<void> {
  await axios.get(csrfCookieUrl(), {
    withCredentials: true,
  });
}

/** @deprecated No-op kept for callers after login/session changes. */
export function resetCsrfCookie(): void {
  // intentionally empty
}
