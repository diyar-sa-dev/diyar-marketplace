import {
  AlertTriangle,
  Bell,
  Calendar,
  CreditCard,
  Gift,
  Heart,
  Info,
  Lock,
  Package,
  Shield,
  Star,
  Store,
  Tag,
  Ticket,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';
import type { NotificationCategoryDefinition } from '../../types/notification.ts';
import type { TranslateFn } from '../../lib/i18n/types.ts';
import { NotificationToggle } from './NotificationToggle.tsx';

type NotificationCategorySettingsGridProps = {
  t: TranslateFn;
  categories: NotificationCategoryDefinition[];
  categoryEnabled: Record<string, boolean>;
  disabled?: boolean;
  onToggle: (categoryKey: string, nextValue: boolean) => void;
};

const categoryVisuals: Record<string, { icon: typeof Package; bg: string; color: string }> = {
  orders: { icon: Package, bg: 'bg-blue-50', color: 'text-blue-600' },
  payments: { icon: CreditCard, bg: 'bg-emerald-50', color: 'text-emerald-600' },
  bookings: { icon: Calendar, bg: 'bg-purple-50', color: 'text-purple-600' },
  offers: { icon: Tag, bg: 'bg-orange-50', color: 'text-orange-600' },
  reviews: { icon: Star, bg: 'bg-amber-50', color: 'text-amber-600' },
  follows: { icon: Heart, bg: 'bg-pink-50', color: 'text-pink-600' },
  products: { icon: Package, bg: 'bg-sky-50', color: 'text-sky-600' },
  services: { icon: Wrench, bg: 'bg-indigo-50', color: 'text-indigo-600' },
  vendor: { icon: Store, bg: 'bg-teal-50', color: 'text-teal-600' },
  payouts: { icon: Wallet, bg: 'bg-lime-50', color: 'text-lime-700' },
  stock: { icon: AlertTriangle, bg: 'bg-red-50', color: 'text-red-600' },
  team: { icon: Users, bg: 'bg-violet-50', color: 'text-violet-600' },
  coupons: { icon: Ticket, bg: 'bg-fuchsia-50', color: 'text-fuchsia-600' },
  promotions: { icon: Gift, bg: 'bg-rose-50', color: 'text-rose-600' },
  system: { icon: Info, bg: 'bg-gray-100', color: 'text-gray-600' },
  auth: { icon: Shield, bg: 'bg-slate-100', color: 'text-slate-600' },
};

function categoryHint(t: TranslateFn, key: string, locked: boolean): string {
  if (locked) {
    return t('notifications.categoryHints.required');
  }

  const specific = t(`notifications.categoryHints.${key}`);
  if (specific !== `notifications.categoryHints.${key}`) {
    return specific;
  }

  return t('notifications.categoryHints.default');
}

export function NotificationCategorySettingsGrid({
  t,
  categories,
  categoryEnabled,
  disabled = false,
  onToggle,
}: NotificationCategorySettingsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 md:p-5">
      {categories.map((category) => {
        const checked = categoryEnabled[category.key] ?? true;
        const locked = category.policy === 'required_in_app';
        const visual = categoryVisuals[category.key] ?? {
          icon: Bell,
          bg: 'bg-gray-50',
          color: 'text-diyar-brown',
        };
        const Icon = visual.icon;

        return (
          <div
            key={category.key}
            className={`relative rounded-2xl border p-4 transition-all duration-300 ease-out ${
              checked
                ? 'border-diyar-brown/25 bg-white shadow-sm scale-[1]'
                : 'border-gray-100 bg-gray-50/80 opacity-90 scale-[0.995]'
            } ${locked ? 'ring-1 ring-amber-100' : 'hover:border-diyar-brown/15'}`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 ${visual.bg} ${visual.color} ${
                  checked ? 'scale-100' : 'scale-95 opacity-60 grayscale-[0.15]'
                }`}
              >
                <Icon size={20} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3
                      className={`font-bold text-sm leading-snug transition-colors duration-300 ${
                        checked ? 'text-diyar-dark' : 'text-gray-500'
                      }`}
                    >
                      {category.label}
                    </h3>
                    {locked && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                        <Lock size={11} />
                        {t('notifications.categoryBadges.required')}
                      </span>
                    )}
                  </div>

                  <NotificationToggle
                    checked={checked}
                    disabled={disabled || locked}
                    label={category.label}
                    onChange={() => onToggle(category.key, !checked)}
                  />
                </div>

                <p className="text-xs text-gray-500 leading-relaxed mt-2">{categoryHint(t, category.key, locked)}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
