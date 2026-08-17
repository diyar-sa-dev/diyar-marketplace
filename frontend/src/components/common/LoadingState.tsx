import { DiyarLoadingSpinner } from './DiyarLoadingSpinner.tsx';
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
      <DiyarLoadingSpinner size="sm" message={label} />
    </div>
  );
}
