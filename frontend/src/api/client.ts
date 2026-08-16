import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { ensureCsrfCookie, readXsrfToken } from '../lib/csrf.ts';
import { readStoredLocale } from '../lib/i18n/storage.ts';
import { env } from '../lib/env.ts';
import { notifyUnauthorized } from '../lib/auth/sessionEvents.ts';
import type { ApiErrorResponse } from '../types/api.ts';
import { isApiErrorDetail, parseApiError } from '../utils/errors.ts';

type RetryableConfig = InternalAxiosRequestConfig & { _csrfRetry?: boolean };

export const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiUrl,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  timeout: 30_000,
});

function attachLocaleHeader(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  config.headers.set('Accept-Language', readStoredLocale());
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
    '/auth/login',
    '/auth/register',
    '/auth/verify-otp',
    '/auth/verify-password-reset-otp',
    '/auth/forgot-password',
    '/auth/reset-password',
  ];

  return !ignored.some((segment) => url.includes(segment));
}

apiClient.interceptors.request.use((config) => attachCsrfHeader(attachLocaleHeader(config)));

apiClient.interceptors.response.use(
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
      return apiClient.request(config);
    }

    const parsed = isApiErrorDetail(error) ? error : parseApiError(error);

    if (parsed.status === 401 && shouldNotifyUnauthorized(error.config?.url)) {
      notifyUnauthorized();
    }

    return Promise.reject(parsed);
  },
);
