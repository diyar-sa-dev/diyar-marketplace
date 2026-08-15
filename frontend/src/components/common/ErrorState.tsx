import type { ApiErrorDetail } from '../../types/api.ts';
import { isForbidden, isUnauthorized } from '../../utils/errors.ts';

interface ErrorStateProps {
  error: ApiErrorDetail | Error | string;
  onRetry?: () => void;
}

function resolveMessage(error: ApiErrorDetail | Error | string): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (isUnauthorized(error)) return 'يجب تسجيل الدخول للمتابعة.';
  if (isForbidden(error)) return 'ليس لديك صلاحية للوصول إلى هذا المحتوى.';
  return error.message;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 p-8 text-center">
      <p className="text-lg font-semibold text-red-600">حدث خطأ</p>
      <p className="text-sm text-gray-600">{resolveMessage(error)}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800"
        >
          إعادة المحاولة
        </button>
      )}
    </div>
  );
}
