import { describe, expect, it } from 'vitest';
import { isApiErrorDetail, parseApiError, getFieldErrors, formatFieldErrors, collectDisplayErrors, isPhoneVerificationRequired, isUnexpectedServerError, sanitizeErrorMessage } from './errors.ts';

describe('parseApiError', () => {
  it('returns existing ApiErrorDetail unchanged', () => {
    const detail = { message: 'Already parsed', status: 422, errors: { phone: ['Invalid'] } };
    expect(parseApiError(detail)).toEqual(detail);
    expect(isApiErrorDetail(detail)).toBe(true);
  });

  it('extracts Laravel validation errors', () => {
    const error = {
      response: {
        status: 422,
        data: {
          message: 'The given data was invalid.',
          errors: { credentials: ['These credentials do not match our records.'] },
        },
      },
      message: 'Request failed',
      isAxiosError: true,
    };

    const parsed = parseApiError(error);
    expect(parsed.status).toBe(422);
    expect(parsed.message).toBe('The given data was invalid.');
    expect(getFieldErrors(parsed).credentials[0]).toContain('credentials');
    expect(formatFieldErrors(parsed).length).toBeGreaterThan(0);
  });

  it('maps network failures to friendly message', () => {
    const parsed = parseApiError({ message: 'Network Error' }, 'ar');
    expect(parsed.status).toBe(0);
    expect(parsed.message).toContain('تعذر الاتصال');
  });

  it('maps network failures to English when locale is en', () => {
    const parsed = parseApiError({ message: 'Network Error' }, 'en');
    expect(parsed.status).toBe(0);
    expect(parsed.message).toContain('Could not reach the server');
  });

  it('dedupes identical top-level and field validation messages', () => {
    const error = {
      response: {
        status: 422,
        data: {
          message: 'رمز التحقق غير صحيح.',
          errors: { code: ['رمز التحقق غير صحيح.'] },
        },
      },
      message: 'Request failed',
      isAxiosError: true,
    };

    const display = collectDisplayErrors(error, 'ar');
    expect(display.message).toBe('رمز التحقق غير صحيح.');
    expect(display.fieldMessages).toEqual([]);
  });

  it('prefers field validation messages over generic top-level message', () => {
    const error = {
      response: {
        status: 422,
        data: {
          message: 'The given data was invalid.',
          errors: { phone: ['رقم الجوال مسجل مسبقاً.'] },
        },
      },
      message: 'Request failed',
      isAxiosError: true,
    };

    const display = collectDisplayErrors(error, 'ar');
    expect(display.message).toBe('رقم الجوال مسجل مسبقاً.');
    expect(display.fieldMessages).toEqual([]);
  });

  it('detects phone verification required login responses', () => {
    const error = {
      response: {
        status: 422,
        data: {
          message: 'The given data was invalid.',
          errors: {
            phone_verification_required: ['Verify your phone with the code sent via SMS to continue.'],
            verification_phone: ['503333333'],
          },
        },
      },
      message: 'Request failed',
      isAxiosError: true,
    };

    expect(isPhoneVerificationRequired(error)).toEqual({ phone: '503333333' });
  });

  it('sanitizes technical database errors', () => {
    const raw = "SQLSTATE[23000]: Integrity constraint violation: 1062 Duplicate entry";
    expect(sanitizeErrorMessage(raw, 'en')).toContain('unexpected');
    expect(isUnexpectedServerError({ message: raw, status: 500 })).toBe(true);
  });
});
