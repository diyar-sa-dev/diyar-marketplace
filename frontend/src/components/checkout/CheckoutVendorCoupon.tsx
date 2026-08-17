import React from 'react';
import { Tag } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale.ts';

type CheckoutVendorCouponProps = {
  vendorName: string;
};

export function CheckoutVendorCoupon({ vendorName }: CheckoutVendorCouponProps) {
  const { t } = useLocale();

  return (
    <div
      className="pt-4 border-t border-gray-100 opacity-60 pointer-events-none select-none"
      aria-disabled="true"
    >
      <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
        <Tag size={16} className="text-diyar-brown" />
        {t('checkout.couponTitle', { vendor: vendorName })}
      </label>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          disabled
          placeholder={t('checkout.couponPlaceholder')}
          className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500 placeholder:text-gray-400"
        />
        <button
          type="button"
          disabled
          className="rounded-xl border border-gray-200 bg-gray-100 px-5 py-2.5 text-sm font-bold text-gray-500 cursor-not-allowed"
        >
          {t('checkout.couponApply')}
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-400">{t('checkout.couponDisabledNote')}</p>
    </div>
  );
}
