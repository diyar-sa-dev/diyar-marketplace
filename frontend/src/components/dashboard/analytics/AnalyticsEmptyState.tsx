import type { ReactNode } from 'react';

type AnalyticsEmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

export function AnalyticsEmptyState({
  title,
  description,
  action,
  className = '',
}: AnalyticsEmptyStateProps) {
  return (
    <div
      role="status"
      className={`flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center ${className}`}
    >
      <h3 className="text-base font-bold text-diyar-dark">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-gray-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
