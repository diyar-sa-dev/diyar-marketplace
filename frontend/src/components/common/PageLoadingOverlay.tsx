import { DiyarLoadingSpinner } from './DiyarLoadingSpinner.tsx';
import { useLocale } from '../../hooks/useLocale.ts';

type PageLoadingOverlayProps = {
  message?: string;
  showMessage?: boolean;
};

export function PageLoadingOverlay({ message, showMessage = false }: PageLoadingOverlayProps) {
  const { t } = useLocale();
  const label = showMessage || message ? (message ?? t('common.loading')) : undefined;

  return (
    <div
      className="fixed inset-0 z-200 flex items-center justify-center bg-black/15 backdrop-blur-[2px] p-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <DiyarLoadingSpinner size="lg" message={label} />
    </div>
  );
}
