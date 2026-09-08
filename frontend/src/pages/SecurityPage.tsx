import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  Laptop,
  Loader2,
  Lock,
  LogOut,
  MonitorSmartphone,
  Shield,
  Smartphone,
  Tablet,
} from 'lucide-react';
import { useAuth } from '../hooks/auth/useAuth.ts';
import {
  useLogoutOtherSecuritySessions,
  useRevokeSecuritySession,
  useSecuritySessions,
} from '../hooks/profile/useSecuritySessions.ts';
import { formatMaskedSaudiPhoneInternational } from '../lib/auth/validation.ts';
import { resolveAccountSettingsBackPath } from '../lib/auth/roles.ts';
import { useLocale } from '../lib/i18n/localeContext.ts';
import type { SecuritySession } from '../types/profileSecurity.ts';

function deviceIcon(session: SecuritySession) {
  if (session.device_type === 'mobile') {
    return Smartphone;
  }
  if (session.device_type === 'tablet') {
    return Tablet;
  }
  return Laptop;
}

function formatRelativeTime(iso: string, locale: string): string {
  const value = new Date(iso).getTime();
  if (Number.isNaN(value)) {
    return '—';
  }

  const diffMs = Date.now() - value;
  const minutes = Math.round(diffMs / 60_000);

  if (minutes < 1) {
    return locale === 'ar' ? 'الآن' : 'Just now';
  }

  if (minutes < 60) {
    return locale === 'ar' ? `منذ ${minutes} د` : `${minutes}m ago`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return locale === 'ar' ? `منذ ${hours} س` : `${hours}h ago`;
  }

  const days = Math.round(hours / 24);
  return locale === 'ar' ? `منذ ${days} ي` : `${days}d ago`;
}

function sessionLabel(session: SecuritySession, t: (key: string) => string): string {
  const parts = [
    session.device_name,
    session.browser ? `${session.browser}${session.browser_version ? ` ${session.browser_version}` : ''}` : null,
    session.platform,
  ].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(' · ');
  }

  return t('profile.security.unknownDevice');
}

function locationLabel(session: SecuritySession, t: (key: string) => string): string | null {
  const parts = [session.city, session.region, session.country].filter(Boolean);
  if (parts.length === 0) {
    return null;
  }

  const label = parts.join(', ');
  if (session.location_source === 'ip_geolocation' || session.location_source === 'proxy_header') {
    return `${label} (${t('profile.security.approximateLocation')})`;
  }

  return label;
}

export default function SecurityPage() {
  const { user } = useAuth();
  const { t, dir, locale } = useLocale();
  const BreadcrumbChevron = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const maskedPhone = formatMaskedSaudiPhoneInternational(user?.phone);
  const accountBackPath = resolveAccountSettingsBackPath(user?.roles);

  const sessionsQuery = useSecuritySessions();
  const revokeSession = useRevokeSecuritySession();
  const logoutOthers = useLogoutOtherSecuritySessions();
  const [confirmLogoutOthers, setConfirmLogoutOthers] = useState(false);

  const sessions = sessionsQuery.data ?? [];
  const otherSessionsCount = useMemo(
    () => sessions.filter((session) => !session.is_current).length,
    [sessions],
  );

  return (
    <div className="bg-gray-50 min-h-screen pb-24 md:pb-12">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-diyar-dark transition cursor-pointer">
              {t('common.home')}
            </Link>
            <BreadcrumbChevron size={16} />
            <Link to={accountBackPath} className="hover:text-diyar-dark transition cursor-pointer">
              {t('common.myAccount')}
            </Link>
            <BreadcrumbChevron size={16} />
            <span className="font-bold text-diyar-dark">{t('profile.security.title')}</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-xl md:text-2xl font-bold text-diyar-dark mb-2 leading-snug text-balance">
            {t('profile.security.title')}
          </h1>
          <p className="text-gray-500 text-sm text-balance">{t('profile.security.description')}</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 md:p-6 border-b border-gray-100 bg-gray-50/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Lock size={20} />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-lg text-diyar-dark leading-snug text-balance">
                  {t('profile.security.recoveryTitle')}
                </h2>
                <p className="text-xs text-gray-500 text-balance">
                  {t('profile.security.recoveryHint')}
                </p>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-600 text-balance">
                  {t('profile.security.recoveryPhonePrompt')}
                </p>
                <p className="font-bold text-diyar-dark tracking-wide whitespace-nowrap" dir="ltr">
                  {maskedPhone || '—'}
                </p>
              </div>
              <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                {t('profile.security.emailResetUnavailable')}
              </p>
              <Link
                to="/profile/security/reset-password"
                className="inline-flex px-6 py-3 rounded-xl font-bold text-white bg-diyar-dark hover:bg-black transition-colors cursor-pointer"
              >
                {t('profile.security.forgotPassword')}
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 md:p-6 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Shield size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-lg text-diyar-dark leading-snug text-balance">
                    {t('profile.security.twoFactorTitle')}
                  </h2>
                  <p className="text-xs text-gray-500 text-balance">
                    {t('profile.security.twoFactorHint')}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <Smartphone size={24} className="text-gray-400 shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-sm text-gray-800 mb-1">
                    {t('profile.security.twoFactorSms')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t('profile.security.twoFactorDescription')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 md:p-6 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <MonitorSmartphone size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-lg text-diyar-dark leading-snug text-balance">
                    {t('profile.security.devicesTitle')}
                  </h2>
                  <p className="text-xs text-gray-500 text-balance">
                    {t('profile.security.devicesHint')}
                  </p>
                </div>
              </div>
              {otherSessionsCount > 0 ? (
                <button
                  type="button"
                  onClick={() => setConfirmLogoutOthers(true)}
                  disabled={logoutOthers.isPending}
                  className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-red-700 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {logoutOthers.isPending ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                  {t('profile.security.logoutOthers')}
                </button>
              ) : null}
            </div>

            <div className="p-6 space-y-4">
              {sessionsQuery.isLoading ? (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  <Loader2 size={24} className="animate-spin" />
                </div>
              ) : null}

              {sessionsQuery.isError ? (
                <p className="text-sm text-red-600">{t('profile.security.sessionsLoadError')}</p>
              ) : null}

              {!sessionsQuery.isLoading && !sessionsQuery.isError && sessions.length === 0 ? (
                <p className="text-sm text-gray-600">{t('profile.security.noSessions')}</p>
              ) : null}

              {sessions.map((session) => {
                const Icon = deviceIcon(session);
                const location = locationLabel(session, t);

                return (
                  <div
                    key={session.id}
                    className="flex items-start justify-between gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-50/40"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 text-gray-600 flex items-center justify-center shrink-0">
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="font-bold text-sm text-diyar-dark">{sessionLabel(session, t)}</p>
                          {session.is_current ? (
                            <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              {t('profile.security.currentDevice')}
                            </span>
                          ) : null}
                        </div>
                        <div className="space-y-1 text-xs text-gray-500">
                          {location ? (
                            <p className="flex items-center gap-1">
                              <Globe size={12} />
                              {location}
                            </p>
                          ) : null}
                          <p>
                            {t('profile.security.lastActive')}:{' '}
                            {formatRelativeTime(session.last_activity_at, locale)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {!session.is_current ? (
                      <button
                        type="button"
                        onClick={() => revokeSession.mutate(session.id)}
                        disabled={revokeSession.isPending}
                        className="shrink-0 px-3 py-2 rounded-lg text-xs font-bold text-red-700 hover:bg-red-50 transition-colors disabled:opacity-60 cursor-pointer"
                      >
                        {t('profile.security.signOutDevice')}
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {confirmLogoutOthers ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 space-y-4">
            <h3 className="font-bold text-lg text-diyar-dark">{t('profile.security.logoutOthersTitle')}</h3>
            <p className="text-sm text-gray-600">{t('profile.security.logoutOthersDescription')}</p>
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setConfirmLogoutOthers(false)}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  logoutOthers.mutate(undefined, {
                    onSettled: () => setConfirmLogoutOthers(false),
                  });
                }}
                disabled={logoutOthers.isPending}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-60 cursor-pointer"
              >
                {logoutOthers.isPending ? t('common.loading') : t('profile.security.logoutOthersConfirm')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
