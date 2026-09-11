import { RefreshCw } from 'lucide-react';
import { useLocale } from '../../lib/i18n/localeContext.ts';

type OtpResendActionProps = {
  onResend: () => void;
  disabled?: boolean;
  isCoolingDown: boolean;
  secondsLeft: number;
  resendLabel: string;
  cooldownLabelKey: string;
  notReceivedLabel?: string;
  align?: 'start' | 'center';
  layout?: 'inline' | 'block';
};

function OtpResendCooldown({
  cooldownLabelKey,
  secondsLeft,
}: {
  cooldownLabelKey: string;
  secondsLeft: number;
}) {
  const { t } = useLocale();
  const marker = '__SECONDS__';
  const template = t(cooldownLabelKey, { seconds: marker });
  const [before = '', after = ''] = template.split(marker);

  return (
    <span className="inline-flex items-center gap-1.5">
      <RefreshCw size={14} className="shrink-0 opacity-60" aria-hidden />
      <span>
        {before}
        <span dir="ltr" className="tabular-nums font-bold">
          {secondsLeft}
        </span>
        {after}
      </span>
    </span>
  );
}

export function OtpResendAction({
  onResend,
  disabled = false,
  isCoolingDown,
  secondsLeft,
  resendLabel,
  cooldownLabelKey,
  notReceivedLabel,
  align = 'center',
  layout = 'block',
}: OtpResendActionProps) {
  const { dir } = useLocale();
  const alignClass = align === 'center' ? 'text-center justify-center' : 'text-start justify-start';

  const button = (
    <button
      type="button"
      onClick={onResend}
      disabled={disabled || isCoolingDown}
      dir={dir}
      className="inline-flex items-center gap-1.5 text-sm font-bold text-diyar-brown hover:text-diyar-dark cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isCoolingDown ? (
        <OtpResendCooldown cooldownLabelKey={cooldownLabelKey} secondsLeft={secondsLeft} />
      ) : (
        <>
          <RefreshCw size={14} className="shrink-0" aria-hidden />
          {resendLabel}
        </>
      )}
    </button>
  );

  if (layout === 'inline') {
    return button;
  }

  return (
    <div className={`flex flex-col gap-2 ${alignClass}`} dir={dir}>
      {notReceivedLabel ? <p className="text-sm text-gray-500">{notReceivedLabel}</p> : null}
      {button}
    </div>
  );
}
