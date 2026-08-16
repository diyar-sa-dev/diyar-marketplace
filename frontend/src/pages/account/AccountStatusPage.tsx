import { Clock, LogOut, RefreshCw, ShieldBan } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLocale } from '../../hooks/useLocale.ts';

type AccountStatusVariant = 'pending' | 'suspended';

type AccountStatusPageProps = {
  variant: AccountStatusVariant;
  onRefresh: () => void | Promise<void>;
  onLogout: () => void | Promise<void>;
  isRefreshing?: boolean;
  isLoggingOut?: boolean;
};

const VARIANT_META: Record<
  AccountStatusVariant,
  {
    badge: string;
    icon: typeof Clock;
    accentClass: string;
    glowClass: string;
    badgeClass: string;
  }
> = {
  pending: {
    badge: 'PENDING',
    icon: Clock,
    accentClass: 'text-amber-600',
    glowClass: 'from-amber-100/80 to-orange-50/40',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-100',
  },
  suspended: {
    badge: 'SUSPENDED',
    icon: ShieldBan,
    accentClass: 'text-red-600',
    glowClass: 'from-red-100/70 to-rose-50/30',
    badgeClass: 'bg-red-50 text-red-700 border-red-100',
  },
};

export function AccountStatusPage({
  variant,
  onRefresh,
  onLogout,
  isRefreshing = false,
  isLoggingOut = false,
}: AccountStatusPageProps) {
  const { t, dir } = useLocale();
  const meta = VARIANT_META[variant];
  const Icon = meta.icon;
  const copyKey = variant === 'pending' ? 'status.accountPending' : 'status.accountSuspended';

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-linear-to-b from-gray-50 via-white to-diyar-cream/20 px-4 py-10 sm:py-14"
      dir={dir}
    >
      <div className="pointer-events-none absolute inset-0">
        <div
          className={`absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-linear-to-br ${meta.glowClass} blur-3xl`}
        />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-xl flex-col items-center justify-center">
        <Link to="/" className="mb-8 flex items-center justify-center">
          <img src="/logo_diyar.svg" alt="DIYAR" className="h-10 sm:h-11" />
        </Link>

        <div className="relative w-full overflow-hidden rounded-4xl border border-white/80 bg-white/90 p-8 text-center shadow-[0_20px_60px_rgba(19,38,36,0.08)] backdrop-blur-sm sm:p-10">
          <div
            className={`relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border ${meta.badgeClass}`}
          >
            <Icon size={28} className={meta.accentClass} />
          </div>

          <div
            className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${meta.badgeClass}`}
          >
            <span>{meta.badge}</span>
          </div>

          <h1 className="relative mb-3 text-2xl font-bold text-diyar-dark sm:text-3xl">
            {t(`${copyKey}.title`)}
          </h1>
          <p className="relative mx-auto mb-8 max-w-md text-sm leading-7 text-gray-500 sm:text-base">
            {t(`${copyKey}.description`)}
          </p>

          <div className="relative flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => void onRefresh()}
              disabled={isRefreshing || isLoggingOut}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-diyar-dark px-5 py-3 text-sm font-bold text-diyar-cream transition-colors hover:bg-diyar-dark/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              {t(`${copyKey}.refresh`)}
            </button>

            <button
              type="button"
              onClick={() => void onLogout()}
              disabled={isRefreshing || isLoggingOut}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-diyar-dark transition-colors hover:border-diyar-brown/30 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogOut size={16} />
              {t(`${copyKey}.logout`)}
            </button>
          </div>

          {variant === 'pending' && (
            <p className="relative mt-6 text-xs leading-6 text-gray-400">
              {t('status.accountPending.hint')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
