import { Link, type To } from 'react-router-dom';
import { ArrowLeft, Home, Lock, SearchX, ShieldAlert } from 'lucide-react';
import type { FieldDirection } from '../../lib/i18n/types.ts';

type StatusCode = 401 | 403 | 404 | 500;

type RouteStatusPageProps = {
  statusCode: StatusCode;
  title: string;
  description: string;
  primaryLabel: string;
  primaryTo?: To;
  primaryState?: Record<string, unknown>;
  primaryOnClick?: () => void;
  secondaryLabel?: string;
  secondaryTo?: To;
  secondaryOnClick?: () => void;
  dir?: FieldDirection;
  onRetry?: () => void;
  retryLabel?: string;
};

const STATUS_META: Record<
  StatusCode,
  {
    icon: typeof Lock;
    accentClass: string;
    glowClass: string;
    badgeClass: string;
    ringClass: string;
  }
> = {
  401: {
    icon: Lock,
    accentClass: 'text-amber-600',
    glowClass: 'from-amber-100/80 to-orange-50/40',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-100',
    ringClass: 'ring-amber-100/80',
  },
  403: {
    icon: ShieldAlert,
    accentClass: 'text-red-600',
    glowClass: 'from-red-100/70 to-rose-50/30',
    badgeClass: 'bg-red-50 text-red-700 border-red-100',
    ringClass: 'ring-red-100/80',
  },
  404: {
    icon: SearchX,
    accentClass: 'text-diyar-brown',
    glowClass: 'from-diyar-cream/90 to-orange-50/40',
    badgeClass: 'bg-diyar-cream text-diyar-dark border-diyar-brown/20',
    ringClass: 'ring-diyar-brown/15',
  },
  500: {
    icon: ShieldAlert,
    accentClass: 'text-diyar-brown',
    glowClass: 'from-diyar-cream/80 to-orange-50/30',
    badgeClass: 'bg-diyar-cream text-diyar-dark border-diyar-brown/20',
    ringClass: 'ring-diyar-brown/15',
  },
};

export function RouteStatusPage({
  statusCode,
  title,
  description,
  primaryLabel,
  primaryTo = '/',
  primaryState,
  primaryOnClick,
  secondaryLabel,
  secondaryTo,
  secondaryOnClick,
  dir = 'rtl',
  onRetry,
  retryLabel,
}: RouteStatusPageProps) {
  const meta = STATUS_META[statusCode];
  const Icon = meta.icon;
  const showHomeIcon = primaryTo === '/' && !primaryOnClick;
  const singleAction = !secondaryLabel && !onRetry;

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-linear-to-b from-gray-50 via-white to-diyar-cream/25 px-4 py-10 sm:py-14"
      dir={dir}
    >
      <div className="pointer-events-none absolute inset-0">
        <div
          className={`absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-linear-to-br ${meta.glowClass} blur-3xl`}
        />
        <div className="absolute top-10 right-8 h-32 w-32 rounded-full bg-diyar-brown/5 blur-2xl" />
        <div className="absolute bottom-12 left-8 h-36 w-36 rounded-full bg-diyar-dark/5 blur-2xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-lg flex-col items-center justify-center">
        <Link
          to="/"
          className="mb-8 flex items-center justify-center transition-opacity hover:opacity-80"
        >
          <img src="/logo_diyar.svg" alt="DIYAR" className="h-10 sm:h-11" />
        </Link>

        <div
          className={`relative w-full overflow-hidden rounded-4xl border border-white/80 bg-white/95 p-8 text-center shadow-[0_24px_64px_rgba(19,38,36,0.08)] ring-1 backdrop-blur-sm sm:p-10 ${meta.ringClass}`}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 select-none text-[7.5rem] font-black leading-none text-diyar-dark/5 sm:text-[9rem]"
          >
            {statusCode}
          </div>

          <div
            className={`relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border shadow-sm ${meta.badgeClass}`}
          >
            <Icon size={28} className={meta.accentClass} strokeWidth={2.25} />
          </div>

          <div
            className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-bold tracking-wide ${meta.badgeClass}`}
          >
            <span>{statusCode}</span>
          </div>

          <h1 className="relative mb-3 text-2xl font-bold text-diyar-dark sm:text-3xl">{title}</h1>
          <p className="relative mx-auto mb-8 max-w-md text-sm leading-7 text-gray-500 sm:text-base">
            {description}
          </p>

          <div
            className={`relative flex flex-col items-stretch gap-3 ${
              singleAction
                ? 'mx-auto w-full max-w-xs'
                : 'sm:flex-row sm:items-center sm:justify-center'
            }`}
          >
            {primaryOnClick ? (
              <button
                type="button"
                onClick={primaryOnClick}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-diyar-dark px-6 py-3.5 text-sm font-bold text-diyar-cream transition-all hover:bg-diyar-dark/90 hover:shadow-md cursor-pointer"
              >
                {showHomeIcon ? <Home size={16} /> : null}
                {primaryLabel}
                {!showHomeIcon ? <ArrowLeft size={16} /> : null}
              </button>
            ) : (
              <Link
                to={primaryTo}
                state={primaryState}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-diyar-dark px-6 py-3.5 text-sm font-bold text-diyar-cream transition-all hover:bg-diyar-dark/90 hover:shadow-md"
              >
                {showHomeIcon ? <Home size={16} /> : null}
                {primaryLabel}
                {!showHomeIcon ? <ArrowLeft size={16} /> : null}
              </Link>
            )}

            {secondaryLabel && secondaryOnClick && (
              <button
                type="button"
                onClick={secondaryOnClick}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-bold text-diyar-dark transition-colors hover:border-diyar-brown/30 hover:bg-gray-50 cursor-pointer"
              >
                <Home size={16} />
                {secondaryLabel}
              </button>
            )}

            {secondaryLabel && secondaryTo && !secondaryOnClick && (
              <Link
                to={secondaryTo}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-bold text-diyar-dark transition-colors hover:border-diyar-brown/30 hover:bg-gray-50"
              >
                <Home size={16} />
                {secondaryLabel}
              </Link>
            )}

            {onRetry && retryLabel && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-diyar-brown/20 bg-diyar-cream/40 px-6 py-3.5 text-sm font-bold text-diyar-dark transition-colors hover:bg-diyar-cream/70 cursor-pointer"
              >
                {retryLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
