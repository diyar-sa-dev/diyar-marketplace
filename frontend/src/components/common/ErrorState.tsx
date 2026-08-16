import { AlertCircle, RefreshCw } from 'lucide-react';
import type { ApiErrorDetail } from '../../types/api.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { parseApiError, isForbidden, isUnauthorized } from '../../utils/errors.ts';
import { vendorButtonClass } from '../../lib/vendorProductValidation.ts';

interface ErrorStateProps {
  error: ApiErrorDetail | Error | string | unknown;
  onRetry?: () => void;
  title?: string;
  className?: string;
  compact?: boolean;
}

function resolveMessage(
  error: ApiErrorDetail | Error | string | unknown,
  locale: ReturnType<typeof useLocale>['locale'],
): string {
  if (typeof error === 'string') {
    return error;
  }

  const parsed = parseApiError(error, locale);

  if (isUnauthorized(parsed)) {
    return locale === 'ar' ? 'يجب تسجيل الدخول للمتابعة.' : 'You must sign in to continue.';
  }

  if (isForbidden(parsed)) {
    return locale === 'ar'
      ? 'ليس لديك صلاحية للوصول إلى هذا المحتوى.'
      : 'You do not have permission to access this content.';
  }

  return parsed.message;
}

export function ErrorState({
  error,
  onRetry,
  title,
  className = '',
  compact = false,
}: ErrorStateProps) {
  const { t, locale } = useLocale();
  const message = resolveMessage(error, locale);
  const displayTitle = title ?? t('status.unexpected.title');

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? 'min-h-50 gap-4 p-6' : 'min-h-70 gap-5 p-8 md:p-10'
      } ${className}`}
    >
      <div className="relative">
        <div
          className="absolute inset-0 rounded-full bg-red-100/80 blur-xl scale-150"
          aria-hidden
        />
        <div
          className={`relative flex items-center justify-center rounded-full bg-linear-to-br from-red-50 to-orange-50 border border-red-100 text-red-500 shadow-sm ${
            compact ? 'w-14 h-14' : 'w-16 h-16 md:w-20 md:h-20'
          }`}
        >
          <AlertCircle size={compact ? 28 : 32} strokeWidth={1.75} />
        </div>
      </div>

      <div className="max-w-md space-y-2">
        <h3 className={`font-bold text-diyar-dark ${compact ? 'text-base' : 'text-lg md:text-xl'}`}>
          {displayTitle}
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={`${vendorButtonClass} inline-flex items-center gap-2 rounded-xl bg-diyar-dark px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-black hover:shadow-lg cursor-pointer transition-all active:scale-[0.98]`}
        >
          <RefreshCw size={16} />
          {t('common.retry')}
        </button>
      )}
    </div>
  );
}
