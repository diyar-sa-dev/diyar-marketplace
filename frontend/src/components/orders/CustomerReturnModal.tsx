import React, { useEffect, useMemo, useState } from 'react';
import { RotateCcw, Upload, X } from 'lucide-react';
import type { OrderItem, VendorOrder } from '../../types/order.ts';
import type { ReturnEligibility, ReturnReason } from '../../types/return.ts';
import {
  createReturnRequest,
  fetchReturnEligibility,
  uploadReturnEvidence,
} from '../../api/returns.ts';
import { useLocale } from '../../hooks/useLocale.ts';

const ALL_REASONS: ReturnReason[] = [
  'manufacturing_defect',
  'damaged',
  'wrong_item',
  'not_as_described',
  'other',
];

type Props = {
  open: boolean;
  vendorOrder: VendorOrder;
  item: OrderItem;
  onClose: () => void;
  onSubmitted: () => void;
  onError: (message: string) => void;
};

export function CustomerReturnModal({
  open,
  vendorOrder,
  item,
  onClose,
  onSubmitted,
  onError,
}: Props) {
  const { t, dir } = useLocale();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [eligibility, setEligibility] = useState<ReturnEligibility | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState<ReturnReason>('manufacturing_defect');
  const [note, setNote] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setLoading(true);
    void fetchReturnEligibility(vendorOrder.id, item.id)
      .then((result) => {
        setEligibility(result);
        setQuantity(Math.min(1, result.remaining_quantity) || 1);
        const firstReason = result.accepted_reasons[0];
        if (firstReason) {
          setReason(firstReason);
        }
      })
      .catch((error: unknown) => {
        onError(error instanceof Error ? error.message : t('errors.unexpected'));
        onClose();
      })
      .finally(() => setLoading(false));
  }, [open, vendorOrder.id, item.id, onClose, onError, t]);

  const reasonOptions = useMemo(() => {
    if (!eligibility) {
      return ALL_REASONS;
    }
    return eligibility.accepted_reasons;
  }, [eligibility]);

  if (!open) {
    return null;
  }

  const policy = eligibility?.policy;
  const maxQty = eligibility?.remaining_quantity ?? 1;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!eligibility?.eligible) {
      onError(t('returns.notEligible'));
      return;
    }

    if (policy?.requires_evidence && evidenceFiles.length === 0) {
      onError(t('returns.evidenceRequired'));
      return;
    }

    setSubmitting(true);
    try {
      const created = await createReturnRequest({
        vendor_order_id: vendorOrder.id,
        reason,
        customer_note: note.trim() || undefined,
        items: [{ order_item_id: item.id, quantity }],
      });

      for (const file of evidenceFiles) {
        await uploadReturnEvidence(created.id, file);
      }

      onSubmitted();
      onClose();
    } catch (error) {
      onError(error instanceof Error ? error.message : t('errors.unexpected'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-300 flex items-center justify-center bg-black/50 p-4" dir={dir}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2 text-diyar-dark">
            <RotateCcw size={18} className="text-diyar-brown" />
            <h3 className="font-bold">{t('returns.modalTitle')}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <p className="p-6 text-sm text-gray-500">{t('common.loading')}</p>
        ) : !eligibility?.eligible ? (
          <div className="space-y-3 p-6">
            <p className="text-sm text-red-700">{t('returns.notEligible')}</p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-diyar-dark px-4 py-2 text-sm font-bold text-white"
            >
              {t('common.close')}
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 p-6">
            {policy && (
              <div className="rounded-xl border border-amber-100 bg-amber-50/80 p-4 text-sm text-amber-950">
                <p className="font-bold">{t('returns.policySummaryTitle')}</p>
                <ul className="mt-2 space-y-1 text-xs leading-relaxed">
                  <li>
                    {t('returns.policyWindowHint', { days: policy.return_window_days })}
                  </li>
                  {eligibility.deadline && (
                    <li>{t('returns.deadlineHint', { date: new Date(eligibility.deadline).toLocaleDateString() })}</li>
                  )}
                  <li>{t('returns.policyReasonsHint')}</li>
                  {policy.requires_evidence && <li>{t('returns.policyEvidenceHint')}</li>}
                </ul>
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-bold text-gray-600">{t('returns.fieldQuantity')}</label>
              <input
                type="number"
                min={1}
                max={maxQty}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(maxQty, Number(e.target.value) || 1)))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold"
              />
              <p className="mt-1 text-xs text-gray-500">{t('returns.remainingQty', { count: maxQty })}</p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-gray-600">{t('returns.fieldReason')}</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as ReturnReason)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              >
                {reasonOptions.map((value) => (
                  <option key={value} value={value}>
                    {t(`returns.reason.${value}` as 'returns.reason.damaged')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-gray-600">{t('returns.fieldNote')}</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                placeholder={t('returns.fieldNotePlaceholder')}
              />
            </div>

            {policy?.requires_evidence && (
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-600">{t('returns.fieldEvidence')}</label>
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50">
                  <Upload size={16} />
                  {t('returns.uploadEvidence')}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={(e) => setEvidenceFiles(Array.from(e.target.files ?? []))}
                  />
                </label>
                {evidenceFiles.length > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    {t('returns.filesSelected', { count: evidenceFiles.length })}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-600"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-xl bg-diyar-brown px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {submitting ? t('common.loading') : t('returns.submitReturn')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
