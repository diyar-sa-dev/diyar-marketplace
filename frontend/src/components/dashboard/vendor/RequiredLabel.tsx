import type { ReactNode } from 'react';

interface RequiredLabelProps {
  children: ReactNode;
  required?: boolean;
  className?: string;
}

export function RequiredLabel({ children, required, className = '' }: RequiredLabelProps) {
  return (
    <label className={`block text-right ${className}`}>
      {children}
      {required && (
        <span className="text-red-500 mr-0.5 font-bold" aria-hidden="true">
          {' '}
          *
        </span>
      )}
    </label>
  );
}
