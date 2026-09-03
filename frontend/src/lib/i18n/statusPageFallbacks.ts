import type { Locale, TranslateParams } from './types.ts';

/** Crash-page copy that does not depend on the async locale catalog. */
export const STATUS_PAGE_FALLBACKS: Record<Locale, Record<string, string>> = {
  ar: {
    'status.authRequired.title': 'يلزم تسجيل الدخول',
    'status.authRequired.description': 'يجب تسجيل الدخول للوصول إلى هذه الصفحة.',
    'status.authRequired.primaryAction': 'تسجيل الدخول',
    'status.forbidden.title': 'غير مسموح بالوصول',
    'status.forbidden.description': 'ليس لديك صلاحية للوصول إلى هذه الصفحة.',
    'status.forbidden.descriptionWithPath': 'ليس لديك صلاحية للوصول إلى: :path',
    'status.forbidden.primaryAction': 'العودة للوحة التحكم',
    'status.notFound.title': 'الصفحة غير موجودة',
    'status.notFound.description': 'الصفحة التي تبحث عنها غير موجودة أو تم نقلها أو لم تعد متاحة.',
    'status.unexpected.title': 'حدث خطأ غير متوقع',
    'status.unexpected.description': 'واجه التطبيق مشكلة مؤقتة. يمكنك إعادة تحميل الصفحة أو العودة للخلف.',
    'status.unexpected.reload': 'إعادة تحميل الصفحة',
    'status.unexpected.goBack': 'العودة للخلف',
    'status.unexpected.retry': 'إعادة المحاولة',
    'status.unexpected.secondaryAction': 'تسجيل الدخول',
    'status.accountPending.title': 'الحساب بانتظار التفعيل',
    'status.accountPending.description':
      'حسابك غير مفعّل بعد. يرجى انتظار التفعيل أو إكمال التحقق من رقم الجوال.',
    'status.accountPending.refresh': 'تحديث الحالة',
    'status.accountPending.logout': 'تسجيل الخروج',
    'status.accountSuspended.title': 'الحساب موقوف',
    'status.accountSuspended.description': 'تم إيقاف حسابك. لا يمكنك استخدام المنصة حتى يتم استعادته.',
    'status.accountSuspended.refresh': 'تحديث الحالة',
    'status.accountSuspended.logout': 'تسجيل الخروج',
    'common.home': 'الرئيسية',
    'common.retry': 'إعادة المحاولة',
  },
  en: {
    'status.authRequired.title': 'Sign in required',
    'status.authRequired.description': 'You must sign in to access this page.',
    'status.authRequired.primaryAction': 'Sign in',
    'status.forbidden.title': 'Access denied',
    'status.forbidden.description': 'You do not have permission to access this page.',
    'status.forbidden.descriptionWithPath': 'You do not have permission to access: :path',
    'status.forbidden.primaryAction': 'Back to dashboard',
    'status.notFound.title': 'Page not found',
    'status.notFound.description':
      'The page you are looking for does not exist, was moved, or is no longer available.',
    'status.unexpected.title': 'Something went wrong',
    'status.unexpected.description':
      'The app hit a temporary issue. You can reload the page or go back.',
    'status.unexpected.reload': 'Reload page',
    'status.unexpected.goBack': 'Go back',
    'status.unexpected.retry': 'Try again',
    'status.unexpected.secondaryAction': 'Sign in',
    'status.accountPending.title': 'Account pending activation',
    'status.accountPending.description':
      'Your account is not active yet. Please wait for activation or complete phone verification.',
    'status.accountPending.refresh': 'Refresh status',
    'status.accountPending.logout': 'Sign out',
    'status.accountSuspended.title': 'Account suspended',
    'status.accountSuspended.description':
      'Your account has been suspended. You cannot use the platform until it is restored.',
    'status.accountSuspended.refresh': 'Refresh status',
    'status.accountSuspended.logout': 'Sign out',
    'common.home': 'Home',
    'common.retry': 'Try again',
  },
};

export function interpolateStatusFallback(template: string, params?: TranslateParams): string {
  if (!params) {
    return template;
  }

  return Object.entries(params).reduce((result, [name, value]) => {
    const stringValue = String(value);
    return result.replaceAll(`:${name}`, stringValue).replaceAll(`{{${name}}}`, stringValue);
  }, template);
}

export function statusPageFallback(
  locale: Locale,
  key: string,
  params?: TranslateParams,
): string | undefined {
  const template = STATUS_PAGE_FALLBACKS[locale][key];
  if (typeof template !== 'string') {
    return undefined;
  }

  return interpolateStatusFallback(template, params);
}
