import {
  Ban,
  CalendarClock,
  CheckCircle2,
  Copy,
  Infinity as InfinityIcon,
  PauseCircle,
  Pencil,
  Percent,
  Power,
  PowerOff,
  Share2,
  ShoppingBag,
  Sparkles,
  Tag,
  Users,
} from 'lucide-react';
import type { VendorCoupon } from '../../api/vendorCoupons.ts';

type VendorCouponCardProps = {
  coupon: VendorCoupon;
  currency: string;
  usageLabel: string;
  t: (key: string, vars?: Record<string, string | number>) => string;
  isToggling: boolean;
  onCopy: (code: string) => void;
  onShare: (coupon: VendorCoupon) => void;
  onEdit: (coupon: VendorCoupon) => void;
  onToggle: (coupon: VendorCoupon) => void;
};

function statusConfig(status: VendorCoupon['effective_status']) {
  switch (status) {
    case 'active':
      return {
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        accent: 'from-emerald-500/80 to-emerald-400/40',
        icon: CheckCircle2,
      };
    case 'scheduled':
      return {
        badge: 'bg-blue-50 text-blue-700 border-blue-200',
        accent: 'from-blue-500/80 to-blue-400/40',
        icon: CalendarClock,
      };
    case 'expired':
      return {
        badge: 'bg-gray-100 text-gray-600 border-gray-200',
        accent: 'from-gray-400/70 to-gray-300/40',
        icon: PauseCircle,
      };
    case 'exhausted':
      return {
        badge: 'bg-amber-50 text-amber-800 border-amber-200',
        accent: 'from-amber-500/80 to-amber-400/40',
        icon: Ban,
      };
    default:
      return {
        badge: 'bg-red-50 text-red-700 border-red-200',
        accent: 'from-red-400/70 to-red-300/40',
        icon: PauseCircle,
      };
  }
}

const ACTION =
  'inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition cursor-pointer disabled:opacity-50';

export function VendorCouponCard({
  coupon,
  currency,
  usageLabel,
  t,
  isToggling,
  onCopy,
  onShare,
  onEdit,
  onToggle,
}: VendorCouponCardProps) {
  const status = statusConfig(coupon.effective_status);
  const StatusIcon = status.icon;

  const constraints = [
    Number(coupon.minimum_order) > 0
      ? t('vendor.coupons.minOrder', { amount: coupon.minimum_order, currency })
      : t('vendor.coupons.noMinimum'),
    coupon.maximum_discount
      ? t('vendor.coupons.maxDiscount', { amount: coupon.maximum_discount, currency })
      : t('vendor.coupons.noMaxDiscount'),
  ].join(' · ');

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-diyar-brown/15 transition-all">
      <div className={`absolute inset-y-0 inset-s-0 w-1.5 bg-linear-to-b ${status.accent}`} />

      <div className="p-5 sm:p-6 ps-6 sm:ps-7">
        <div className="flex flex-col lg:flex-row lg:items-start gap-5 justify-between">
          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-amber-50 to-diyar-cream/40 border border-amber-100 px-4 py-2">
                <Tag size={16} className="text-diyar-brown shrink-0" />
                <span className="font-mono text-base sm:text-lg font-black tracking-wider text-diyar-dark">
                  {coupon.code}
                </span>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${status.badge}`}
              >
                <StatusIcon size={13} />
                {t(`vendor.coupons.status.${coupon.effective_status}`)}
              </span>
            </div>

            <div className="flex items-end gap-2">
              <span className="text-4xl sm:text-5xl font-black text-diyar-brown tabular-nums leading-none">
                {coupon.value}
              </span>
              <span className="inline-flex items-center gap-1 pb-1 text-lg font-bold text-diyar-brown/80">
                <Percent size={18} />
                {t('vendor.coupons.discountShort')}
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <p className="flex items-start gap-2 text-sm text-gray-600">
                <ShoppingBag size={15} className="text-gray-400 shrink-0 mt-0.5" />
                <span>{constraints}</span>
              </p>
              <p className="flex items-start gap-2 text-sm text-gray-600">
                <Users size={15} className="text-gray-400 shrink-0 mt-0.5" />
                <span>{usageLabel}</span>
              </p>
              {coupon.ends_at && (
                <p className="flex items-start gap-2 text-sm text-gray-500 sm:col-span-2">
                  <CalendarClock size={15} className="text-gray-400 shrink-0 mt-0.5" />
                  <span>
                    {t('vendor.coupons.until', {
                      date: new Intl.DateTimeFormat(undefined, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      }).format(new Date(coupon.ends_at)),
                    })}
                  </span>
                </p>
              )}
              {!coupon.usage_limit && (
                <p className="flex items-center gap-2 text-xs font-medium text-emerald-700/80">
                  <InfinityIcon size={14} />
                  {t('vendor.coupons.unlimitedUsesBadge')}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:flex-col lg:min-w-44 xl:min-w-50">
            <button
              type="button"
              onClick={() => onCopy(coupon.code)}
              className={`${ACTION} flex-1 lg:flex-none border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-diyar-brown/20`}
            >
              <Copy size={16} />
              {t('vendor.coupons.copyCode')}
            </button>
            <button
              type="button"
              onClick={() => onShare(coupon)}
              className={`${ACTION} flex-1 lg:flex-none border border-diyar-brown/20 bg-diyar-cream/30 text-diyar-brown hover:bg-diyar-cream/50`}
            >
              <Share2 size={16} />
              {t('vendor.coupons.share')}
            </button>
            <button
              type="button"
              onClick={() => onEdit(coupon)}
              className={`${ACTION} flex-1 lg:flex-none border border-gray-200 text-gray-700 hover:bg-gray-50`}
            >
              <Pencil size={16} />
              {t('vendor.coupons.edit')}
            </button>
            <button
              type="button"
              disabled={isToggling}
              onClick={() => onToggle(coupon)}
              className={`${ACTION} flex-1 lg:flex-none border ${
                coupon.is_active
                  ? 'border-red-100 text-red-600 hover:bg-red-50'
                  : 'border-emerald-100 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              {coupon.is_active ? <PowerOff size={16} /> : <Power size={16} />}
              {coupon.is_active ? t('vendor.coupons.deactivate') : t('vendor.coupons.activate')}
            </button>
          </div>
        </div>
      </div>

      {coupon.effective_status === 'active' && (
        <div className="pointer-events-none absolute -top-8 -inset-e-8 h-24 w-24 rounded-full bg-diyar-brown/5 blur-2xl group-hover:bg-diyar-brown/10 transition-colors" />
      )}
      <Sparkles
        size={14}
        className="pointer-events-none absolute top-4 inset-e-4 text-diyar-brown/10 group-hover:text-diyar-brown/25 transition-colors"
      />
    </article>
  );
}
