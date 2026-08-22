import { Info } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale.ts';
import type { AffiliatePlatformConfig } from '../../types/affiliate.ts';

type AffiliatePlatformHintsProps = {
  platform: AffiliatePlatformConfig;
  variant: 'vendor' | 'marketer' | 'payout';
  className?: string;
};

export function AffiliatePlatformHints({
  platform,
  variant,
  className = '',
}: AffiliatePlatformHintsProps) {
  const { t } = useLocale();
  const currency = t('common.currency');
  const min = platform.min_commission_percent;
  const max = platform.max_commission_percent;
  const days = String(platform.attribution_window_days);
  const amount = platform.payout_minimum;
  const payoutCurrency = platform.currency || currency;

  const lines =
    variant === 'vendor'
      ? [
          t('affiliate.platform.commissionRange', { min, max }),
          t('affiliate.platform.attributionWindow', { days }),
        ]
      : variant === 'payout'
        ? [t('affiliate.platform.payoutMinimum', { amount, currency: payoutCurrency })]
        : [
            t('affiliate.platform.commissionRange', { min, max }),
            t('affiliate.platform.attributionWindow', { days }),
            t('affiliate.platform.payoutMinimum', { amount, currency: payoutCurrency }),
          ];

  return (
    <div
      className={`rounded-xl border border-green-100 bg-green-50/80 px-4 py-3 text-sm text-green-900 ${className}`}
    >
      <div className="flex items-start gap-2">
        <Info size={16} className="shrink-0 mt-0.5 text-green-600" />
        <ul className="space-y-1 list-none">
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
