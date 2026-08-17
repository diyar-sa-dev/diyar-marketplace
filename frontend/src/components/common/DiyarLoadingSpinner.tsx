import { DiyarBrandMark } from './DiyarBrandMark.tsx';

type DiyarLoadingSpinnerProps = {
  size?: 'sm' | 'lg';
  showBrand?: boolean;
  message?: string;
  showSpinner?: boolean;
};

export function DiyarLoadingSpinner({
  size = 'lg',
  showBrand = true,
  message,
  showSpinner = false,
}: DiyarLoadingSpinnerProps) {
  const spinnerSize = size === 'lg' ? 'h-12 w-12 border-[3px]' : 'h-5 w-5 border-2';

  return (
    <div className="flex flex-col items-center justify-center gap-5 pointer-events-none">
      {showSpinner ? (
        <span
          className={`inline-block animate-spin rounded-full border-diyar-brown/15 border-t-diyar-brown drop-shadow-[0_8px_24px_rgba(0,0,0,0.18)] ${spinnerSize}`}
          aria-hidden="true"
        />
      ) : null}
      {showBrand ? <DiyarBrandMark size={size} /> : null}
      {message ? (
        <p
          className={`font-medium text-diyar-dark/70 ${
            size === 'lg' ? 'text-sm tracking-wide' : 'text-xs'
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
