import { describe, expect, it } from 'vitest';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../types/api.ts';
import { isForbidden, isNotFound, isUnauthorized, parseApiError } from './errors.ts';

function makeAxiosError(
  partial: Partial<AxiosError<ApiErrorResponse>> = {},
): AxiosError<ApiErrorResponse> {
  return {
    isAxiosError: true,
    name: 'AxiosError',
    message: 'Request failed',
    config: {} as AxiosError['config'],
    toJSON: () => ({}),
    ...partial,
  } as AxiosError<ApiErrorResponse>;
}

describe('parseApiError', () => {
  it('extracts API error message from response envelope', () => {
    const error = makeAxiosError({
      response: {
        status: 404,
        data: { success: false, message: 'Resource not found.' },
        statusText: 'Not Found',
        headers: {},
        config: {} as AxiosError['config'],
      },
    });

    expect(parseApiError(error)).toEqual({
      message: 'Resource not found.',
      status: 404,
      errors: undefined,
    });
  });

  it('returns network message when response is missing', () => {
    const error = makeAxiosError({ response: undefined });

    expect(parseApiError(error).message).toContain('Unable to reach the server');
  });
});

describe('HTTP status helpers', () => {
  it('detects auth-related statuses', () => {
    expect(isUnauthorized({ message: 'x', status: 401 })).toBe(true);
    expect(isForbidden({ message: 'x', status: 403 })).toBe(true);
    expect(isNotFound({ message: 'x', status: 404 })).toBe(true);
  });
});
