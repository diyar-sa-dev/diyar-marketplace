import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { getAffiliateSessionFingerprint } from '../lib/affiliateSession.ts';
import { resolveApiContextFromUrl } from '../lib/auth/applicationContext.ts';
import { notifyUnauthorized } from '../lib/auth/sessionEvents.ts';
import { ensureCsrfCookie, readXsrfToken } from '../lib/csrf.ts';
import { readStoredLocale } from '../lib/i18n/storage.ts';
import { env } from '../lib/env.ts';
import type { ApiErrorResponse } from '../types/api.ts';
import { isApiErrorDetail, parseApiError } from '../utils/errors.ts';

type RetryableConfig = InternalAxiosRequestConfig & { _csrfRetry?: boolean };

function createApiClient(): AxiosInstance {
  return axios.create({
    baseURL: env.apiUrl,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    withCredentials: true,
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',
    timeout: env.isDev ? 30_000 : 90_000,
  });
}

function attachLocaleHeader(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  config.headers.set('Accept-Language', readStoredLocale());
  return config;
}

function attachAffiliateSessionHeader(
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig {
  const session = getAffiliateSessionFingerprint();
  if (session) {
    config.headers.set('X-Affiliate-Session', session);
  }

  return config;
}

function attachCsrfHeader(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const method = config.method?.toLowerCase();
  if (method && method !== 'get' && method !== 'head') {
    const token = readXsrfToken();
    if (token) {
      config.headers.set('X-XSRF-TOKEN', token);
    }
  }

  return config;
}

function shouldNotifyUnauthorized(url: string | undefined): boolean {
  if (!url) {
    return false;
  }

  const ignored = [
    '/auth/me',
    '/admin/session',
    '/auth/login',
    '/admin/auth/login',
    '/auth/register',
    '/auth/verify-otp',
    '/auth/verify-password-reset-otp',
    '/auth/forgot-password',
    '/auth/reset-password',
  ];

  return !ignored.some((segment) => url.includes(segment));
}

function attachInterceptors(client: AxiosInstance): AxiosInstance {
  client.interceptors.request.use((config) =>
    attachCsrfHeader(attachAffiliateSessionHeader(attachLocaleHeader(config))),
  );

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiErrorResponse>) => {
      const config = error.config as RetryableConfig | undefined;

      if (error.response?.status === 419 && config && !config._csrfRetry) {
        config._csrfRetry = true;
        await ensureCsrfCookie();
        const token = readXsrfToken();
        if (token) {
          config.headers.set('X-XSRF-TOKEN', token);
        }
        return client.request(config);
      }

      const parsed = isApiErrorDetail(error) ? error : parseApiError(error);

      if (parsed.status === 401 && shouldNotifyUnauthorized(error.config?.url)) {
        notifyUnauthorized(resolveApiContextFromUrl(error.config?.url));
      }

      return Promise.reject(parsed);
    },
  );

  return client;
}

/** Marketplace storefront API client — `/api/v1/*` excluding admin routes. */
export const marketplaceApi = attachInterceptors(createApiClient());

/** Admin operations API client — `/api/v1/admin/*`. */
export const adminApi = attachInterceptors(createApiClient());

/** @deprecated Use `marketplaceApi` for storefront calls or `adminApi` for admin calls. */
export const apiClient = marketplaceApi;
