import type { ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary.tsx';

type MessagingSectionErrorBoundaryProps = {
  children: ReactNode;
  fallbackTitle: string;
  fallbackMessage: string;
};

export function MessagingSectionErrorBoundary({
  children,
  fallbackTitle,
  fallbackMessage,
}: MessagingSectionErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-bold">{fallbackTitle}</p>
          <p className="mt-1">{fallbackMessage}</p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
