import axios from 'axios';
import { apiBaseUrl } from './env.ts';
import { readStoredLocale } from './i18n/storage.ts';

let cachedCsrfToken: string | null = null;
let inflightBootstrap: Promise<string> | null = null;

export function csrfCookieUrl(): string {
  return '/sanctum/csrf-cookie';
}

function readCookieXsrfToken(): string | null {
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

export function readXsrfToken(): string | null {
  return cachedCsrfToken ?? readCookieXsrfToken();
}

async function fetchCsrfToken(): Promise<string> {
  if (inflightBootstrap) {
    return inflightBootstrap;
  }

  inflightBootstrap = axios
    .get<{ data?: { token?: string } }>(`${apiBaseUrl()}/csrf-token`, {
      withCredentials: true,
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

/**
 * Establish session + cache CSRF token for the next mutating request.
 * Concurrent callers share one in-flight bootstrap to avoid session/token races.
 */
export async function ensureCsrfCookie(options?: { refresh?: boolean }): Promise<void> {
  if (options?.refresh) {
    cachedCsrfToken = null;
  } else if (cachedCsrfToken) {
    return;
  }

  await fetchCsrfToken();
}

export function resetCsrfCookie(): void {
  cachedCsrfToken = null;
}
