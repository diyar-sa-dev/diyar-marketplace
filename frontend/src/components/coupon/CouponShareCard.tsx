import React from 'react';
import { Copy, Tag } from 'lucide-react';
import { formatLocaleDate } from '../../lib/intlLocale.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { resolveMediaUrl } from '../../lib/media.ts';
import type { VendorCoupon } from '../../api/vendorCoupons.ts';

type CouponShareCardProps = {
  storeName: string;
  storeLogoUrl?: string | null;
  coupon: Pick<
    VendorCoupon,
    'code' | 'value' | 'minimum_order' | 'maximum_discount' | 'ends_at' | 'effective_status'
  >;
  className?: string;
};

export function CouponShareCard({
  storeName,
  storeLogoUrl,
  coupon,
  className = '',
}: CouponShareCardProps) {
  const { t, locale } = useLocale();
  const { toast } = useToast();
  const currency = t('common.currency');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      toast.success(t('vendor.coupons.copySuccess'));
    } catch {
      toast.error(t('vendor.coupons.copyFailed'));
    }
  };

  const expiresLabel = coupon.ends_at
    ? formatLocaleDate(new Date(coupon.ends_at), locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : t('vendor.coupons.noExpiry');

  return (
    <div
      className={`rounded-2xl border border-amber-100 bg-linear-to-br from-amber-50 to-white p-6 shadow-sm ${className}`}
    >
      <div className="flex flex-col items-center text-center gap-3">
        {storeLogoUrl ? (
          <img
            src={resolveMediaUrl(storeLogoUrl) ?? undefined}
            alt={storeName}
            className="h-14 w-14 rounded-full object-cover border border-white shadow"
          />
        ) : (
          <div className="h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center text-diyar-brown">
            <Tag size={24} />
          </div>
        )}
        <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">{storeName}</p>
        <p className="text-3xl font-black text-diyar-brown">{coupon.value}% OFF</p>
        <div className="rounded-xl bg-white border border-amber-100 px-4 py-2 font-mono text-lg font-bold text-diyar-dark">
          {coupon.code}
        </div>
        <div className="text-sm text-gray-600 space-y-1">
          {Number(coupon.minimum_order) > 0 && (
            <p>{t('vendor.coupons.minOrder', { amount: coupon.minimum_order, currency })}</p>
          )}
          {coupon.maximum_discount && (
            <p>{t('vendor.coupons.maxDiscount', { amount: coupon.maximum_discount, currency })}</p>
          )}
          <p>{t('vendor.coupons.until', { date: expiresLabel })}</p>
        </div>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="inline-flex items-center gap-2 rounded-xl bg-diyar-brown px-5 py-2.5 text-sm font-bold text-white hover:bg-diyar-brown/90 transition cursor-pointer"
        >
          <Copy size={16} />
          {t('vendor.coupons.copyCode')}
        </button>
      </div>
    </div>
  );
}
