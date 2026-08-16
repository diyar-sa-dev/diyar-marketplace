import { useLocale } from '../../hooks/useLocale.ts';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message, className = '' }: LoadingStateProps) {
  const { t } = useLocale();
  const label = message ?? t('common.loading');
  return (
    <div className={`flex min-h-[120px] items-center justify-center p-6 ${className}`}>
      <div className="flex items-center gap-3 text-gray-600">
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
        <span>{label}</span>
      </div>
    </div>
  );
}
