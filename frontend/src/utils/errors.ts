import type { AxiosError } from 'axios';
import type { ApiErrorDetail, ApiErrorResponse } from '../types/api.ts';

export function parseApiError(error: AxiosError<ApiErrorResponse>): ApiErrorDetail {
  if (error.response?.data?.message) {
    return {
      message: error.response.data.message,
      status: error.response.status,
      errors: error.response.data.errors,
    };
  }

  if (error.code === 'ECONNABORTED') {
    return { message: 'Request timed out. Please try again.', status: 408 };
  }

  if (!error.response) {
    return { message: 'Unable to reach the server. Check your connection.', status: 0 };
  }

  return {
    message: error.message || 'An unexpected error occurred.',
    status: error.response.status,
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
