import React, { useMemo } from 'react';
import { Loader2, RefreshCw, Sparkles, X } from 'lucide-react';
import type { VendorCoupon, VendorCouponPayload } from '../../api/vendorCoupons.ts';
import {
  generateUniqueCouponCode,
  sanitizeCouponCode,
  sanitizeDigits,
} from '../../lib/couponCode.ts';

type VendorCouponFormModalProps = {
  open: boolean;
  title: string;
  editing: VendorCoupon | null;
  form: VendorCouponPayload;
  existingCodes: string[];
  currency: string;
  isSaving: boolean;
  t: (key: string, vars?: Record<string, string | number>) => string;
  onClose: () => void;
  onChange: (next: VendorCouponPayload) => void;
  onSubmit: (event: React.FormEvent) => void;
};

const INPUT =
  'w-full rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-diyar-brown/30 focus:border-diyar-brown outline-none transition';

const INPUT_WITH_SUFFIX =
  'flex items-center rounded-xl border border-gray-200 bg-gray-50/80 overflow-hidden focus-within:bg-white focus-within:ring-2 focus-within:ring-diyar-brown/30 focus-within:border-diyar-brown transition';

const INPUT_INNER =
  'flex-1 min-w-0 border-0 bg-transparent px-4 py-2.5 text-sm outline-none focus:ring-0';

const INPUT_SUFFIX =
  'shrink-0 px-3 py-2.5 text-xs font-bold text-gray-400 border-s border-gray-200/80 bg-gray-50/50 self-stretch flex items-center';

export function VendorCouponFormModal({
  open,
  title,
  editing,
  form,
  existingCodes,
  currency,
  isSaving,
  t,
  onClose,
  onChange,
  onSubmit,
}: VendorCouponFormModalProps) {
  const codeLocked = Boolean(editing?.used_count);

  const reservedCodes = useMemo(
    () => existingCodes.filter((code) => code.toUpperCase() !== editing?.code.toUpperCase()),
    [existingCodes, editing?.code],
  );

  if (!open) {
    return null;
  }

  const regenerateCode = () => {
    onChange({ ...form, code: generateUniqueCouponCode(reservedCodes) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-gray-100"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-gray-100 bg-linear-to-r from-diyar-cream/40 via-white to-white px-6 py-5 rounded-t-3xl">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-diyar-brown mb-1 flex items-center gap-1.5">
              <Sparkles size={14} />
              {t('vendor.coupons.createButton')}
            </p>
            <h3 className="text-xl font-bold text-diyar-dark">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="w-10 h-10 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-diyar-dark transition cursor-pointer flex items-center justify-center shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">
              {t('vendor.coupons.form.code')}
            </label>
            <div className="flex gap-2">
              <input
                required
                disabled={codeLocked}
                value={form.code}
                onChange={(event) =>
                  onChange({ ...form, code: sanitizeCouponCode(event.target.value) })
                }
                placeholder={t('vendor.coupons.form.codePlaceholder')}
                className={`${INPUT} font-mono tracking-wider flex-1`}
                dir="ltr"
                maxLength={9}
              />
              {!codeLocked && (
                <button
                  type="button"
                  onClick={regenerateCode}
                  title={t('vendor.coupons.form.regenerateCode')}
                  className="shrink-0 w-11 h-11 rounded-xl border border-diyar-brown/20 bg-diyar-cream/30 text-diyar-brown hover:bg-diyar-cream/60 transition cursor-pointer flex items-center justify-center"
                >
                  <RefreshCw size={18} />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500">{t('vendor.coupons.form.codeHint')}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">
              {t('vendor.coupons.form.value')}
            </label>
            <div className={INPUT_WITH_SUFFIX}>
              <input
                required
                type="number"
                min={5}
                max={90}
                disabled={codeLocked}
                value={form.value}
                onChange={(event) => onChange({ ...form, value: Number(event.target.value) })}
                placeholder={t('vendor.coupons.form.valuePlaceholder')}
                className={INPUT_INNER}
                dir="ltr"
              />
              <span className={`${INPUT_SUFFIX} text-sm`}>%</span>
            </div>
            <p className="text-xs text-gray-500">{t('vendor.coupons.form.valueHint')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">
                {t('vendor.coupons.form.minimum')}
              </label>
              <div className={INPUT_WITH_SUFFIX}>
                <input
                  inputMode="numeric"
                  value={form.minimum_order ?? 0}
                  onChange={(event) => {
                    const digits = sanitizeDigits(event.target.value);
                    onChange({ ...form, minimum_order: digits ? Number(digits) : 0 });
                  }}
                  placeholder={t('vendor.coupons.form.minimumPlaceholder')}
                  className={INPUT_INNER}
                  dir="ltr"
                />
                <span className={INPUT_SUFFIX}>{currency}</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                {t('vendor.coupons.form.minimumHint')}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">
                {t('vendor.coupons.form.maximum')}
              </label>
              <div className={INPUT_WITH_SUFFIX}>
                <input
                  inputMode="numeric"
                  value={form.maximum_discount ?? ''}
                  onChange={(event) => {
                    const digits = sanitizeDigits(event.target.value);
                    onChange({
                      ...form,
                      maximum_discount: digits ? Number(digits) : null,
                    });
                  }}
                  placeholder={t('vendor.coupons.form.maximumPlaceholder')}
                  className={INPUT_INNER}
                  dir="ltr"
                />
                <span className={INPUT_SUFFIX}>{currency}</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                {t('vendor.coupons.form.maximumHint')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">
                {t('vendor.coupons.form.startsAt')}
              </label>
              <input
                type="datetime-local"
                value={form.starts_at ? form.starts_at.slice(0, 16) : ''}
                onChange={(event) =>
                  onChange({
                    ...form,
                    starts_at: event.target.value
                      ? new Date(event.target.value).toISOString()
                      : null,
                  })
                }
                className={INPUT}
                dir="ltr"
              />
              <p className="text-xs text-gray-500">{t('vendor.coupons.form.startsAtHint')}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">
                {t('vendor.coupons.form.endsAt')}
              </label>
              <input
                type="datetime-local"
                value={form.ends_at ? form.ends_at.slice(0, 16) : ''}
                onChange={(event) =>
                  onChange({
                    ...form,
                    ends_at: event.target.value ? new Date(event.target.value).toISOString() : null,
                  })
                }
                className={INPUT}
                dir="ltr"
              />
              <p className="text-xs text-gray-500">{t('vendor.coupons.form.endsAtHint')}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">
              {t('vendor.coupons.form.usageLimit')}
            </label>
            <input
              inputMode="numeric"
              value={form.usage_limit ?? ''}
              onChange={(event) => {
                const digits = sanitizeDigits(event.target.value);
                onChange({
                  ...form,
                  usage_limit: digits ? Number(digits) : null,
                });
              }}
              placeholder={t('vendor.coupons.form.unlimitedPlaceholder')}
              className={INPUT}
              dir="ltr"
            />
            <p className="text-xs text-gray-500">{t('vendor.coupons.form.usageLimitHint')}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4 bg-gray-50/60 rounded-b-3xl">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-white cursor-pointer"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-diyar-brown px-5 py-2.5 text-sm font-bold text-white hover:bg-diyar-brown/90 cursor-pointer disabled:opacity-50"
          >
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
