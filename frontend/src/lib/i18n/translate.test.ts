import { describe, expect, it } from 'vitest';
import { translate } from './translate.ts';
import { localeDirection } from './types.ts';

describe('i18n translate', () => {
  it('returns Arabic strings by default catalog', () => {
    expect(translate('ar', 'auth.titles.login')).toBe('تسجيل الدخول');
  });

  it('returns English strings', () => {
    expect(translate('en', 'auth.titles.login')).toBe('Sign in');
  });

  it('interpolates params', () => {
    expect(translate('en', 'validation.nameHint', { min: 2, max: 255 })).toContain('2');
    expect(translate('en', 'validation.nameHint', { min: 2, max: 255 })).toContain('255');
  });

  it('maps locale to direction', () => {
    expect(localeDirection('ar')).toBe('rtl');
    expect(localeDirection('en')).toBe('ltr');
  });
});
