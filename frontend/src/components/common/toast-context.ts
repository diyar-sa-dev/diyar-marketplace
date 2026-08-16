import { createContext } from 'react';
import type { Toast, ToastApi, ToastVariant } from '../../types/toast.ts';

export interface ToastContextValue {
  toasts: Toast[];
  showToast: (message: string, variant?: ToastVariant) => void;
  dismissToast: (id: string) => void;
  toast: ToastApi;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
