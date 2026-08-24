import axios from 'axios';
import { apiBaseUrl } from './env.ts';
import { readStoredLocale } from './i18n/storage.ts';

let cachedCsrfToken: string | null = null;
let inflightBootstrap: Promise<string> | null = null;

export const AUTH_REQUEST_TIMEOUT_MS = 120_000;

export function csrfCookieUrl(): string {
  return '/sanctum/csrf-cookie';
}

export function readXsrfToken(): string | null {
  return cachedCsrfToken;
}

async function fetchCsrfToken(): Promise<string> {
  if (inflightBootstrap) {
    return inflightBootstrap;
  }

  inflightBootstrap = axios
    .get<{ data?: { token?: string } }>(`${apiBaseUrl()}/csrf-token`, {
      withCredentials: true,
      timeout: AUTH_REQUEST_TIMEOUT_MS,
      headers: {
        Accept: 'application/json',
        'Accept-Language': readStoredLocale(),
      },
    })
    .then((response) => {
      const token = response.data?.data?.token;
      if (typeof token !== 'string' || token === '') {
        throw new Error('CSRF token missing from API response');
      }

      cachedCsrfToken = token;
      return token;
    })
    .finally(() => {
      inflightBootstrap = null;
    });

  return inflightBootstrap;
}

/** Fetch and cache a plain-text CSRF token for mutating requests. */
export async function bootstrapCsrfToken(options?: { refresh?: boolean }): Promise<string> {
  if (options?.refresh) {
    cachedCsrfToken = null;
  } else if (cachedCsrfToken) {
    return cachedCsrfToken;
  }

  return fetchCsrfToken();
}

/**
 * Establish session + cache CSRF token for the next mutating request.
 * Concurrent callers share one in-flight bootstrap to avoid session/token races.
 */
export async function ensureCsrfCookie(options?: { refresh?: boolean }): Promise<void> {
  await bootstrapCsrfToken(options);
}

export function resetCsrfCookie(): void {
  cachedCsrfToken = null;
}

export function authRequestConfig(csrfToken: string) {
  return {
    headers: { 'X-XSRF-TOKEN': csrfToken },
    timeout: AUTH_REQUEST_TIMEOUT_MS,
  };
}
