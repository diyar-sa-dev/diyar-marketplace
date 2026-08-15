import { createContext } from 'react';
import type { Toast, ToastVariant } from '../../types/toast.ts';

export interface ToastContextValue {
  toasts: Toast[];
  showToast: (message: string, variant?: ToastVariant) => void;
  dismissToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
