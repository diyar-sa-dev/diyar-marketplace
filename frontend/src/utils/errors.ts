import type { AxiosError } from 'axios';
import { readStoredLocale } from '../lib/i18n/storage.ts';
import { translate } from '../lib/i18n/translate.ts';
import type { Locale } from '../lib/i18n/types.ts';
import type { ApiErrorDetail, ApiErrorResponse } from '../types/api.ts';

function clientMessage(locale: Locale, key: string): string {
  return translate(locale, key);
}

const TECHNICAL_ERROR_PATTERN = /SQLSTATE|Integrity constraint violation|Duplicate entry/i;

export function sanitizeErrorMessage(message: string, locale: Locale = readStoredLocale()): string {
  if (TECHNICAL_ERROR_PATTERN.test(message)) {
    return clientMessage(locale, 'errors.unexpected');
  }

  return message;
}

export function isUnexpectedServerError(
  error: unknown,
  locale: Locale = readStoredLocale(),
): boolean {
  const parsed = parseApiError(error, locale);

  if (parsed.status >= 500) {
    return true;
  }

  return TECHNICAL_ERROR_PATTERN.test(parsed.message);
}

export function isApiErrorDetail(error: unknown): error is ApiErrorDetail {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const candidate = error as ApiErrorDetail & { response?: unknown; isAxiosError?: boolean };

  return (
    typeof candidate.message === 'string' &&
    typeof candidate.status === 'number' &&
    candidate.response === undefined &&
    candidate.isAxiosError !== true
  );
}

export function parseApiError(error: unknown, locale: Locale = readStoredLocale()): ApiErrorDetail {
  if (isApiErrorDetail(error)) {
    return error;
  }

  const axiosError = error as AxiosError<ApiErrorResponse & { errors?: ApiErrorDetail['errors'] }>;

  if (axiosError.response?.data?.message) {
    return {
      message: sanitizeErrorMessage(axiosError.response.data.message, locale),
      status: axiosError.response.status,
      errors: axiosError.response.data.errors,
    };
  }

  if (axiosError.code === 'ECONNABORTED') {
    return { message: clientMessage(locale, 'errors.timeout'), status: 408 };
  }

  if (!axiosError.response) {
    return { message: clientMessage(locale, 'errors.network'), status: 0 };
  }

  if (axiosError.response.status === 419) {
    return {
      message: clientMessage(locale, 'errors.csrf'),
      status: 419,
    };
  }

  if (axiosError.response.status === 429) {
    return {
      message: clientMessage(locale, 'errors.rateLimit'),
      status: 429,
    };
  }

  return {
    message: axiosError.message || clientMessage(locale, 'errors.unexpected'),
    status: axiosError.response.status,
  };
}

export function getFieldErrors(error: unknown): Record<string, string[]> {
  const parsed = parseApiError(error);
  if (!parsed.errors || Array.isArray(parsed.errors)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(parsed.errors).map(([field, messages]) => [
      field,
      Array.isArray(messages) ? messages : [String(messages)],
    ]),
  );
}

export function firstFieldError(error: unknown, field: string): string | null {
  return getFieldErrors(error)[field]?.[0] ?? null;
}

export function formatFieldErrors(error: unknown): string[] {
  return Object.values(getFieldErrors(error)).flat();
}

export function collectDisplayErrors(
  error: unknown,
  locale: Locale = readStoredLocale(),
): { message: string; fieldMessages: string[] } {
  const parsed = parseApiError(error, locale);
  const uniqueFieldMessages = [...new Set(formatFieldErrors(error))];

  if (uniqueFieldMessages.length === 0) {
    return { message: parsed.message, fieldMessages: [] };
  }

  if (uniqueFieldMessages.length === 1) {
    return { message: uniqueFieldMessages[0], fieldMessages: [] };
  }

  return {
    message: uniqueFieldMessages[0],
    fieldMessages: uniqueFieldMessages.slice(1),
  };
}

export function isUnauthorized(error: ApiErrorDetail): boolean {
  return error.status === 401;
}

export function isForbidden(error: ApiErrorDetail): boolean {
  return error.status === 403;
}

export function isNotFound(error: ApiErrorDetail): boolean {
  return error.status === 404;
}

export function isRateLimited(error: ApiErrorDetail): boolean {
  return error.status === 429;
}

export function isValidationError(error: ApiErrorDetail): boolean {
  return error.status === 422;
}

export function isPhoneVerificationRequired(error: unknown): { phone: string } | null {
  const fields = getFieldErrors(error);

  if (!fields.phone_verification_required?.length) {
    return null;
  }

  return {
    phone: fields.verification_phone?.[0]?.trim() ?? '',
  };
}
