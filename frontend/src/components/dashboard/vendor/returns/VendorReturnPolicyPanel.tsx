import { useEffect, useState } from 'react';
import { Info, Save } from 'lucide-react';
import { useLocale } from '../../../../hooks/useLocale.ts';
import { useToast } from '../../../../hooks/useToast.ts';
import {
  useUpdateVendorReturnPolicy,
  useVendorReturnPolicy,
} from '../../../../hooks/vendor/useVendorReturns.ts';
import { LoadingState } from '../../../common/LoadingState.tsx';
import type { ReturnReason, VendorReturnPolicyPayload } from '../../../../types/return.ts';

const ALL_REASONS: ReturnReason[] = [
  'manufacturing_defect',
  'damaged',
  'wrong_item',
  'not_as_described',
  'other',
];

const defaultForm: VendorReturnPolicyPayload = {
  returnable: true,
  return_window_days: 14,
  accepted_reasons: ['manufacturing_defect', 'damaged', 'wrong_item', 'not_as_described'],
  requires_unused: true,
  requires_evidence: true,
  return_shipping_paid_by: 'customer',
  shipping_refundable: false,
};

export function VendorReturnPolicyPanel() {
  const { t } = useLocale();
  const { toast } = useToast();
  const { data, isLoading } = useVendorReturnPolicy();
  const saveMutation = useUpdateVendorReturnPolicy();
  const [form, setForm] = useState<VendorReturnPolicyPayload>(defaultForm);

  useEffect(() => {
    if (data) {
      setForm(data);
    }
  }, [data]);

  if (isLoading) {
    return <LoadingState message={t('common.loading')} />;
  }

  const toggleReason = (reason: ReturnReason) => {
    setForm((prev) => ({
      ...prev,
      accepted_reasons: prev.accepted_reasons.includes(reason)
        ? prev.accepted_reasons.filter((r) => r !== reason)
        : [...prev.accepted_reasons, reason],
    }));
  };

  const handleSave = async () => {
    if (form.accepted_reasons.length === 0) {
      toast.error(t('returns.policyReasonRequired'));
      return;
    }

    try {
      await saveMutation.mutateAsync(form);
      toast.success(t('returns.policySaved'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('errors.unexpected'));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <Info className="mt-0.5 shrink-0 text-amber-600" size={20} />
        <p className="text-sm leading-relaxed text-amber-800">{t('returns.policyIntro')}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <label className="flex items-center gap-3 text-sm font-bold text-gray-700">
          <input
            type="checkbox"
            checked={form.returnable}
            onChange={(e) => setForm((prev) => ({ ...prev, returnable: e.target.checked }))}
          />
          {t('returns.policyReturnable')}
        </label>

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">{t('returns.policyWindowDays')}</label>
          <input
            type="number"
            min={0}
            max={365}
            value={form.return_window_days}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, return_window_days: Number(e.target.value) || 0 }))
            }
            className="w-full rounded-xl border border-gray-200 p-3"
          />
        </div>
      </div>

      <div>
        <h4 className="mb-3 font-bold text-diyar-dark">{t('returns.policyAcceptedReasons')}</h4>
        <div className="flex flex-wrap gap-2">
          {ALL_REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => toggleReason(reason)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold border ${
                form.accepted_reasons.includes(reason)
                  ? 'border-diyar-brown bg-amber-50 text-diyar-brown'
                  : 'border-gray-200 text-gray-500'
              }`}
            >
              {t(`returns.reason.${reason}` as 'returns.reason.damaged')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex items-center gap-3 text-sm font-bold text-gray-700">
          <input
            type="checkbox"
            checked={form.requires_unused}
            onChange={(e) => setForm((prev) => ({ ...prev, requires_unused: e.target.checked }))}
          />
          {t('returns.policyRequiresUnused')}
        </label>
        <label className="flex items-center gap-3 text-sm font-bold text-gray-700">
          <input
            type="checkbox"
            checked={form.requires_evidence}
            onChange={(e) => setForm((prev) => ({ ...prev, requires_evidence: e.target.checked }))}
          />
          {t('returns.policyRequiresEvidence')}
        </label>
        <label className="flex items-center gap-3 text-sm font-bold text-gray-700">
          <input
            type="checkbox"
            checked={form.shipping_refundable}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, shipping_refundable: e.target.checked }))
            }
          />
          {t('returns.policyShippingRefundable')}
        </label>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saveMutation.isPending}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-diyar-brown px-6 py-3 font-bold text-white transition hover:bg-diyar-brown/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={18} />
          {t('returns.savePolicy')}
        </button>
      </div>
    </div>
  );
}
