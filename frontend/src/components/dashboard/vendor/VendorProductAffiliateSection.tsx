import React, { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import {
  useUpdateVendorProductAffiliate,
  useVendorProductAffiliate,
} from '../../../hooks/affiliate/useAffiliate.ts';
import { useLocale } from '../../../hooks/useLocale.ts';
import { useToast } from '../../../hooks/useToast.ts';
import { sanitizeDecimalInput } from '../../../lib/vendorProductValidation.ts';
import { parseApiError } from '../../../utils/errors.ts';
import { LoadingState } from '../../common/LoadingState.tsx';
import { ErrorState } from '../../common/ErrorState.tsx';

type VendorProductAffiliateSectionProps = {
  productId: string;
};

export function VendorProductAffiliateSection({ productId }: VendorProductAffiliateSectionProps) {
  const { t, locale } = useLocale();
  const { toast } = useToast();
  const { data, isLoading, isError, refetch } = useVendorProductAffiliate(productId);
  const updateAffiliate = useUpdateVendorProductAffiliate();

  const [enabled, setEnabled] = useState(false);
  const [minPercent, setMinPercent] = useState('5');
  const [maxPercent, setMaxPercent] = useState('15');
  const [ratePercent, setRatePercent] = useState('10');

  useEffect(() => {
    if (data) {
      setEnabled(data.enabled);
      setMinPercent(data.commission_min_percent);
      setMaxPercent(data.commission_max_percent);
      setRatePercent(data.commission_rate_percent);
    } else if (data === null) {
      setEnabled(false);
      setMinPercent('5');
      setMaxPercent('15');
      setRatePercent('10');
    }
  }, [data]);

  const handleSave = async () => {
    try {
      await updateAffiliate.mutateAsync({
        productId,
        payload: {
          enabled,
          commission_min_percent: Number(minPercent),
          commission_max_percent: Number(maxPercent),
          commission_rate_percent: ratePercent ? Number(ratePercent) : null,
        },
      });
      toast.success(t('affiliate.vendor.saveSuccess'));
    } catch (error) {
      toast.error(parseApiError(error, locale).message);
    }
  };

  if (isLoading) {
    return <LoadingState className="min-h-24" />;
  }

  if (isError) {
    return (
      <ErrorState
        message={t('affiliate.vendor.loadError')}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-4 text-right">
      <div className="flex items-center justify-between gap-3 border-b border-emerald-100 pb-2">
        <h4 className="text-xs font-bold text-emerald-900">{t('affiliate.vendor.title')}</h4>
        <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
          />
          {t('affiliate.vendor.enabled')}
        </label>
      </div>

      <p className="text-xs text-emerald-800/80">{t('affiliate.vendor.subtitle')}</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-600">{t('affiliate.vendor.minRate')}</label>
          <input
            type="text"
            inputMode="decimal"
            value={minPercent}
            onChange={(event) => setMinPercent(sanitizeDecimalInput(event.target.value))}
            className="w-full p-2.5 border border-gray-200 rounded-xl text-sm font-bold text-left"
            dir="ltr"
            disabled={!enabled}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-600">{t('affiliate.vendor.maxRate')}</label>
          <input
            type="text"
            inputMode="decimal"
            value={maxPercent}
            onChange={(event) => setMaxPercent(sanitizeDecimalInput(event.target.value))}
            className="w-full p-2.5 border border-gray-200 rounded-xl text-sm font-bold text-left"
            dir="ltr"
            disabled={!enabled}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-600">{t('affiliate.vendor.defaultRate')}</label>
          <input
            type="text"
            inputMode="decimal"
            value={ratePercent}
            onChange={(event) => setRatePercent(sanitizeDecimalInput(event.target.value))}
            className="w-full p-2.5 border border-gray-200 rounded-xl text-sm font-bold text-left"
            dir="ltr"
            disabled={!enabled}
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={updateAffiliate.isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition disabled:opacity-60"
        >
          {updateAffiliate.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {t('affiliate.vendor.save')}
        </button>
      </div>
    </div>
  );
}
