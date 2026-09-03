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

  it('keeps existing status page copy', () => {
    expect(translate('ar', 'status.unexpected.title')).toBe('حدث خطأ غير متوقع');
    expect(translate('ar', 'status.unexpected.reload')).toBe('إعادة تحميل الصفحة');
    expect(translate('ar', 'status.unexpected.goBack')).toBe('العودة للخلف');
    expect(translate('ar', 'status.authRequired.title')).toBe('يلزم تسجيل الدخول');
    expect(translate('ar', 'status.forbidden.title')).toBe('غير مسموح بالوصول');
    expect(translate('ar', 'status.notFound.title')).toBe('الصفحة غير موجودة');
    expect(translate('ar', 'status.accountPending.title')).toBe('الحساب بانتظار التفعيل');
    expect(translate('ar', 'status.accountSuspended.title')).toBe('الحساب موقوف');
    expect(translate('en', 'status.unexpected.title')).toBe('Something went wrong');
    expect(translate('en', 'status.unexpected.reload')).toBe('Reload page');
    expect(translate('en', 'status.unexpected.goBack')).toBe('Go back');
  });

  it('resolves admin shipping form copy', () => {
    expect(translate('ar', 'admin.shipping.addCarrier')).toBe('إضافة ناقل');
    expect(translate('ar', 'admin.shipping.chooseCarrier')).toBe('اختر ناقلاً');
    expect(translate('ar', 'admin.shipping.noMatchingOptions')).toBe('لا توجد نتائج مطابقة');
    expect(translate('en', 'admin.shipping.validation.nameRequired')).toBe('Name is required.');
    expect(translate('ar', 'admin.shipping.validation.codeRequired')).toBe('الرمز مطلوب.');
    expect(translate('ar', 'admin.affiliate.profilesSubtitle')).toBe(
      'مراجعة وإدارة حسابات المسوقين بالعمولة.',
    );
    expect(translate('en', 'admin.detail.backToAffiliates')).toBe('Back to affiliates');
    expect(translate('ar', 'admin.audit.actions.payoutProviderReject')).toBe(
      'رفض دفعة مقدم خدمة',
    );
    expect(translate('ar', 'admin.settings.keys.commerce_loyalty_points_per_unit')).toBe(
      'النقاط لكل وحدة كسب',
    );
    expect(translate('ar', 'admin.settings.keys.commerce_loyalty_enabled')).toBe(
      'تفعيل برنامج الولاء',
    );
    expect(translate('ar', 'admin.finance.chartTitle')).toBe('الأرباح عبر الفترة');
  });
});
