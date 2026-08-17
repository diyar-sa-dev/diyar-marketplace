import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { ToastContext } from './toast-context.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import type { Toast, ToastVariant } from '../../types/toast.ts';

const AUTO_DISMISS_MS = 5000;
const EXIT_ANIMATION_MS = 200;

const variantStyles: Record<ToastVariant, { container: string; icon: typeof CheckCircle2 }> = {
  success: {
    container: 'border-green-200 bg-green-50 text-green-900',
    icon: CheckCircle2,
  },
  error: {
    container: 'border-red-200 bg-red-50 text-red-900',
    icon: XCircle,
  },
  warning: {
    container: 'border-amber-200 bg-amber-50 text-amber-900',
    icon: AlertTriangle,
  },
  info: {
    container: 'border-slate-200 bg-slate-50 text-slate-900',
    icon: Info,
  },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const styles = variantStyles[toast.variant];
  const Icon = styles.icon;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all duration-200 ease-out ${
        styles.container
      } ${toast.exiting ? '-translate-y-2 opacity-0' : 'translate-y-0 opacity-100 animate-in slide-in-from-top-2 fade-in duration-300'}`}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <p className="flex-1 text-sm font-medium leading-relaxed">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded-md p-1 text-current/60 transition-colors hover:bg-black/5 hover:text-current cursor-pointer"
        aria-label="إغلاق الإشعار"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { dir, t } = useLocale();

  const dismissToast = useCallback((id: string) => {
    setToasts((current) =>
      current.map((toast) => (toast.id === id ? { ...toast, exiting: true } : toast)),
    );

    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, EXIT_ANIMATION_MS);
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { id, message, variant }]);
      window.setTimeout(() => dismissToast(id), AUTO_DISMISS_MS);
    },
    [dismissToast],
  );

  const toast = useMemo(
    () => ({
      success: (message: string) => showToast(message, 'success'),
      error: (message: string) => showToast(message, 'error'),
      warning: (message: string) => showToast(message, 'warning'),
      info: (message: string) => showToast(message, 'info'),
    }),
    [showToast],
  );

  const value = useMemo(
    () => ({ toasts, showToast, dismissToast, toast }),
    [toasts, showToast, dismissToast, toast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-4 top-20 z-10050 flex flex-col items-center gap-2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:items-center sm:max-w-sm sm:w-full"
        dir={dir}
        aria-label={t('common.notifications')}
      >
        {toasts.map((item) => (
          <ToastItem key={item.id} toast={item} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
