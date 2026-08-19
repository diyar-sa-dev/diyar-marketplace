import React from 'react';
import { AlertCircle, Check, Tag, X } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale.ts';

type AppliedCoupon = {
  code: string;
  value: number;
};

type CheckoutVendorCouponProps = {
  vendorAccountId: string;
  vendorName: string;
  appliedCoupon?: AppliedCoupon | null;
  draftCode?: string;
  errorMessage?: string | null;
  disabled?: boolean;
  onApply: (vendorAccountId: string, code: string) => void;
  onRemove: (vendorAccountId: string) => void;
  onDraftChange?: (vendorAccountId: string, code: string) => void;
  onClearError?: (vendorAccountId: string) => void;
};

export function CheckoutVendorCoupon({
  vendorAccountId,
  vendorName,
  appliedCoupon,
  draftCode = '',
  errorMessage,
  disabled = false,
  onApply,
  onRemove,
  onDraftChange,
  onClearError,
}: CheckoutVendorCouponProps) {
  const { t } = useLocale();

  const handleApply = () => {
    const trimmed = draftCode.trim();
    if (!trimmed) {
      return;
    }
    onApply(vendorAccountId, trimmed);
  };

  return (
    <div className="pt-4 border-t border-gray-100">
      <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
        <Tag size={16} className="text-diyar-brown" />
        {t('checkout.couponTitle', { vendor: vendorName })}
      </label>

      {appliedCoupon ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <div className="text-sm">
            <p className="font-bold text-green-800">{appliedCoupon.code}</p>
            <p className="text-green-700">
              {t('checkout.couponApplied', { value: appliedCoupon.value })}
            </p>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onRemove(vendorAccountId)}
            className="inline-flex items-center gap-1 rounded-lg border border-green-200 bg-white px-3 py-1.5 text-xs font-bold text-green-800 hover:bg-green-100 cursor-pointer disabled:cursor-not-allowed"
          >
            <X size={14} />
            {t('checkout.couponRemove')}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              disabled={disabled}
              value={draftCode}
              onChange={(event) => {
                onDraftChange?.(vendorAccountId, event.target.value);
                if (errorMessage) {
                  onClearError?.(vendorAccountId);
                }
              }}
              placeholder={t('checkout.couponPlaceholder')}
              className={`flex-1 rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 disabled:bg-gray-50 ${
                errorMessage
                  ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                  : 'border-gray-200'
              }`}
              dir="ltr"
            />
            <button
              type="button"
              disabled={disabled || !draftCode.trim()}
              onClick={handleApply}
              className="inline-flex items-center justify-center gap-1 rounded-xl border border-diyar-brown bg-diyar-brown px-5 py-2.5 text-sm font-bold text-white hover:bg-diyar-brown/90 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check size={16} />
              {t('checkout.couponApply')}
            </button>
          </div>
          {errorMessage && (
            <p className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
