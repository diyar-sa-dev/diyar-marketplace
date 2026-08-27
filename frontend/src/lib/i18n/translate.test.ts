import { describe, expect, it, beforeAll } from 'vitest';
import { ensureLocaleCatalog } from './localeCatalog.ts';
import { translate } from './translate.ts';
import { localeDirection } from './types.ts';

describe('i18n translate', () => {
  beforeAll(async () => {
    await ensureLocaleCatalog('ar');
    await ensureLocaleCatalog('en');
  });
  it('returns Arabic strings by default catalog', () => {
    expect(translate('ar', 'auth.titles.login')).toBe('تسجيل الدخول');
  });

  it('returns English strings', () => {
    expect(translate('en', 'auth.titles.login')).toBe('Sign in');
  });

  it('interpolates colon params', () => {
    expect(translate('en', 'validation.nameHint', { min: 2, max: 255 })).toContain('2');
    expect(translate('en', 'validation.nameHint', { min: 2, max: 255 })).toContain('255');
  });

  it('interpolates double-brace params', () => {
    expect(translate('ar', 'vendor.dashboard.topSellingMeta', { orders: 3, remaining: 12 })).toBe(
      '3 طلب • 12 متبقي',
    );
  });

  it('maps locale to direction', () => {
    expect(localeDirection('ar')).toBe('rtl');
    expect(localeDirection('en')).toBe('ltr');
  });
});
