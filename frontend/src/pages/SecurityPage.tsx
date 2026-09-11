import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Globe,
  Laptop,
  Loader2,
  Lock,
  LogOut,
  MapPin,
  MonitorSmartphone,
  Network,
  Shield,
  Smartphone,
  Tablet,
} from 'lucide-react';
import { AuthFieldLabel } from '../components/auth/AuthInputIcon.tsx';
import { OtpCodeField } from '../components/auth/OtpCodeField.tsx';
import { OtpResendAction } from '../components/auth/OtpResendAction.tsx';
import { PasswordInput } from '../components/auth/PasswordStrengthField.tsx';
import { useAuth } from '../hooks/auth/useAuth.ts';
import { useOtpCooldown } from '../hooks/auth/useOtpCooldown.ts';
import {
  useLogoutOtherSecuritySessions,
  useRevokeSecurityDevice,
  useRevokeSecuritySession,
  useSecuritySessions,
} from '../hooks/profile/useSecuritySessions.ts';
import {
  useConfirmTwoFactor,
  useDisableTwoFactor,
  useEnableTwoFactor,
  useTwoFactorStatus,
} from '../hooks/profile/useTwoFactor.ts';
import { useToast } from '../hooks/useToast.ts';
import { collectDisplayErrors } from '../utils/errors.ts';
import { formatMaskedSaudiPhoneInternational } from '../lib/auth/validation.ts';
import { resolveAccountSettingsBackPath } from '../lib/auth/roles.ts';
import { formatWesternDateTime } from '../lib/intlLocale.ts';
import { useAuthFieldDirection, useLocale } from '../lib/i18n/localeContext.ts';
import type { SecurityDevice, SecuritySession } from '../types/profileSecurity.ts';

function deviceIcon(device: Pick<SecurityDevice, 'device_type'>) {
  if (device.device_type === 'mobile') {
    return Smartphone;
  }
  if (device.device_type === 'tablet') {
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

function deviceTitle(device: SecurityDevice, t: (key: string) => string): string {
  const parts = [
    device.device_name,
    device.browser
      ? `${device.browser}${device.browser_version ? ` ${device.browser_version}` : ''}`
      : null,
    device.platform
      ? `${device.platform}${device.platform_version ? ` ${device.platform_version}` : ''}`
      : null,
  ].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(' · ');
  }

  return t('profile.security.unknownDevice');
}

function locationLabel(
  device: Pick<SecurityDevice, 'city' | 'region' | 'country' | 'location_source' | 'is_local_ip'>,
  t: (key: string) => string,
): string | null {
  if (device.is_local_ip) {
    return t('profile.security.localNetwork');
  }

  const parts = [device.city, device.region, device.country].filter(Boolean);
  if (parts.length === 0) {
    return null;
  }

  const label = parts.join(', ');
  if (device.location_source === 'ip_geolocation' || device.location_source === 'proxy_header') {
    return `${label} (${t('profile.security.approximateLocation')})`;
  }

  return label;
}

function sessionKindLabel(
  session: SecuritySession,
  index: number,
  total: number,
  t: (key: string) => string,
): string {
  if (session.is_current) {
    return t('profile.security.currentBrowserSession');
  }

  if (total > 1 && index === 1) {
    return t('profile.security.otherBrowserWindow');
  }

  return t('profile.security.sessionNumber').replace('{n}', String(index + 1));
}

function DeviceCard({
  device,
  t,
  locale,
  onRevokeDevice,
  onRevokeSession,
  isRevokingDevice,
  isRevokingSession,
}: {
  device: SecurityDevice;
  t: (key: string) => string;
  locale: string;
  onRevokeDevice: (device: SecurityDevice) => void;
  onRevokeSession: (sessionId: string) => void;
  isRevokingDevice: boolean;
  isRevokingSession: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = deviceIcon(device);
  const location = locationLabel(device, t);
  const hasMultipleSessions = device.session_count > 1;
  const canRevokeDevice = !device.is_current || (device.is_current && hasMultipleSessions);

  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50/40 overflow-hidden">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 text-gray-600 flex items-center justify-center shrink-0">
            <Icon size={18} />
          </div>
          <div className="min-w-0 space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold text-sm text-diyar-dark break-words text-balance">
                {deviceTitle(device, t)}
              </p>
              {device.is_current ? (
                <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {t('profile.security.currentDevice')}
                </span>
              ) : null}
              {hasMultipleSessions ? (
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                  {t('profile.security.activeSessionsCount').replace('{n}', String(device.session_count))}
                </span>
              ) : null}
            </div>

            <div className="grid gap-1.5 text-xs text-gray-600">
              {location ? (
                <p className="flex items-start gap-1.5">
                  <MapPin size={12} className="shrink-0 text-gray-400 mt-0.5" />
                  <span className="break-words">{location}</span>
                </p>
              ) : null}
              {device.ip_address ? (
                <p className="flex items-start gap-1.5">
                  <Network size={12} className="shrink-0 text-gray-400 mt-0.5" />
                  <span className="min-w-0 break-all" dir="ltr">
                    {t('profile.security.ipAddress')}:{' '}
                    <span className="font-mono">{device.ip_address}</span>
                  </span>
                </p>
              ) : null}
              <p className="flex items-start gap-1.5">
                <Clock size={12} className="shrink-0 text-gray-400 mt-0.5" />
                <span className="min-w-0">
                  {t('profile.security.lastActive')}: {formatRelativeTime(device.last_activity_at, locale)}
                  <span className="block sm:inline sm:ms-1" dir="ltr">
                    {formatWesternDateTime(device.last_activity_at)}
                  </span>
                </span>
              </p>
              <p className="flex items-start gap-1.5">
                <Globe size={12} className="shrink-0 text-gray-400 mt-0.5" />
                <span className="min-w-0">
                  {t('profile.security.firstSeen')}:{' '}
                  <span className="block sm:inline sm:ms-1 break-words" dir="ltr">
                    {formatWesternDateTime(device.first_seen_at)}
                  </span>
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-row flex-wrap sm:flex-col items-stretch sm:items-end gap-2 w-full sm:w-auto shrink-0">
          {canRevokeDevice ? (
            <button
              type="button"
              onClick={() => onRevokeDevice(device)}
              disabled={isRevokingDevice}
              className="flex-1 sm:flex-none px-3 py-2 rounded-lg text-xs font-bold text-red-700 hover:bg-red-50 transition-colors disabled:opacity-60 cursor-pointer text-center"
            >
              {device.is_current
                ? t('profile.security.signOutOtherWindows')
                : t('profile.security.signOutDevice')}
            </button>
          ) : null}

          {hasMultipleSessions ? (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-gray-600 hover:bg-white transition-colors cursor-pointer"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {expanded ? t('profile.security.hideSessions') : t('profile.security.showSessions')}
            </button>
          ) : null}
        </div>
      </div>

      {expanded && hasMultipleSessions ? (
        <div className="border-t border-gray-100 bg-white/70 px-4 py-3 space-y-2">
          {device.sessions.map((session, index) => (
            <div
              key={session.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2.5"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold text-diyar-dark">
                    {sessionKindLabel(session, index, device.sessions.length, t)}
                  </p>
                  {session.is_current ? (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                      {t('profile.security.currentDevice')}
                    </span>
                  ) : null}
                </div>
                <p className="text-[11px] text-gray-500">
                  {t('profile.security.lastActive')}: {formatRelativeTime(session.last_activity_at, locale)}
                  {' · '}
                  <span dir="ltr">{formatWesternDateTime(session.last_activity_at)}</span>
                </p>
              </div>

              {!session.is_current ? (
                <button
                  type="button"
                  onClick={() => onRevokeSession(session.id)}
                  disabled={isRevokingSession}
                  className="shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-red-700 hover:bg-red-50 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {t('profile.security.signOutSession')}
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

type TwoFactorFlow = 'idle' | 'enabling' | 'disabling_password' | 'disabling_otp';

function TwoFactorPanel({ maskedPhone }: { maskedPhone: string }) {
  const { t } = useLocale();
  const fieldDirection = useAuthFieldDirection();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const statusQuery = useTwoFactorStatus(
    user?.two_factor_enabled !== undefined
      ? { enabled: !!user.two_factor_enabled, phone_masked: maskedPhone || null }
      : undefined,
  );
  const enableMutation = useEnableTwoFactor();
  const confirmMutation = useConfirmTwoFactor();
  const disableMutation = useDisableTwoFactor();
  const { secondsLeft, isCoolingDown, startCooldown } = useOtpCooldown(60);
  const [flow, setFlow] = useState<TwoFactorFlow>('idle');
  const [otpCode, setOtpCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const apiUnavailable = statusQuery.data?.apiUnavailable === true;
  const enabled = statusQuery.data?.enabled ?? !!user?.two_factor_enabled;
  const isSettingUp = flow === 'enabling';
  const statusLoading = statusQuery.isFetching && statusQuery.data === undefined;
  const statusLabel = isSettingUp
    ? t('profile.security.twoFactorSettingUp')
    : enabled
      ? t('profile.security.twoFactorEnabled')
      : t('profile.security.twoFactorDisabled');
  const statusClass = enabled
    ? 'bg-emerald-50 text-emerald-700'
    : isSettingUp
      ? 'bg-amber-50 text-amber-700'
      : 'bg-gray-100 text-gray-600';
  const actionsDisabled = busy || apiUnavailable;

  const resetFlow = () => {
    setFlow('idle');
    setOtpCode('');
    setPassword('');
    setFormError(null);
  };

  const handleApiError = (error: unknown) => {
    const { message, fieldMessages } = collectDisplayErrors(error);
    setFormError(message);
    fieldMessages.forEach((entry) => toast.error(entry));
  };

  const handleEnableStart = async () => {
    setBusy(true);
    setFormError(null);
    try {
      const result = await enableMutation.mutateAsync();
      setFlow('enabling');
      setOtpCode('');
      startCooldown();
      toast.info(result.message ?? t('profile.security.twoFactorCodeSent'));
    } catch (error) {
      handleApiError(error);
    } finally {
      setBusy(false);
    }
  };

  const handleEnableConfirm = async (event: React.FormEvent) => {
    event.preventDefault();
    if (otpCode.length !== 6) {
      return;
    }

    setBusy(true);
    setFormError(null);
    try {
      const result = await confirmMutation.mutateAsync(otpCode);
      if (result.user) {
        updateUser(result.user);
      }
      resetFlow();
      toast.success(result.message ?? t('profile.security.twoFactorEnabledSuccess'));
    } catch (error) {
      handleApiError(error);
    } finally {
      setBusy(false);
    }
  };

  const handleDisablePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!password.trim()) {
      return;
    }

    setBusy(true);
    setFormError(null);
    try {
      const result = await disableMutation.mutateAsync({ password });
      setFlow('disabling_otp');
      setOtpCode('');
      startCooldown();
      toast.info(result.message ?? t('profile.security.twoFactorCodeSent'));
    } catch (error) {
      handleApiError(error);
    } finally {
      setBusy(false);
    }
  };

  const handleDisableConfirm = async (event: React.FormEvent) => {
    event.preventDefault();
    if (otpCode.length !== 6 || !password.trim()) {
      return;
    }

    setBusy(true);
    setFormError(null);
    try {
      const result = await disableMutation.mutateAsync({ password, code: otpCode });
      if (result.user) {
        updateUser(result.user);
      }
      resetFlow();
      toast.success(result.message ?? t('profile.security.twoFactorDisabledSuccess'));
    } catch (error) {
      handleApiError(error);
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (isCoolingDown || busy) {
      return;
    }

    setBusy(true);
    setFormError(null);
    try {
      const result =
        flow === 'enabling'
          ? await enableMutation.mutateAsync()
          : await disableMutation.mutateAsync({ password });
      startCooldown();
      toast.info(result.message ?? t('profile.security.twoFactorCodeSent'));
    } catch (error) {
      handleApiError(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 md:p-6 border-b border-gray-100 bg-gray-50/30 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Shield size={20} />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-lg text-diyar-dark leading-snug text-balance">
              {t('profile.security.twoFactorTitle')}
            </h2>
            <p className="text-xs text-gray-500 text-balance">{t('profile.security.twoFactorHint')}</p>
          </div>
        </div>
        <span className={`self-start sm:self-auto shrink-0 rounded-full px-3 py-1 text-xs font-bold ${statusClass}`}>
          {statusLoading ? <Loader2 size={14} className="animate-spin" /> : statusLabel}
        </span>
      </div>

      <div className="p-6 md:p-8 space-y-5">
        <div className="flex items-start gap-4">
          <Smartphone size={24} className="text-gray-400 shrink-0 mt-1" />
          <div className="space-y-2 min-w-0">
            <h3 className="font-bold text-sm text-gray-800">{t('profile.security.twoFactorSms')}</h3>
            <p className="text-sm text-gray-600 text-balance">
              {t('profile.security.twoFactorDescription')}
            </p>
            {maskedPhone ? (
              <p className="text-sm text-gray-500">
                {t('profile.security.twoFactorPhoneLabel')}:{' '}
                <span className="font-bold text-diyar-dark whitespace-nowrap" dir="ltr">
                  {maskedPhone}
                </span>
              </p>
            ) : null}
          </div>
        </div>

        {apiUnavailable ? (
          <p className="text-sm text-amber-800 bg-amber-50 rounded-lg px-3 py-2 text-balance">
            {t('profile.security.twoFactorUnavailable')}
          </p>
        ) : null}

        {formError ? (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{formError}</p>
        ) : null}

        {flow === 'idle' && !enabled ? (
          <button
            type="button"
            onClick={() => void handleEnableStart()}
            disabled={actionsDisabled}
            className="inline-flex w-full sm:w-auto justify-center px-6 py-3 rounded-xl font-bold text-white bg-diyar-dark hover:bg-black transition-colors cursor-pointer disabled:opacity-60"
          >
            {busy ? <Loader2 size={18} className="animate-spin" /> : t('profile.security.twoFactorEnable')}
          </button>
        ) : null}

        {flow === 'enabling' ? (
          <form onSubmit={(event) => void handleEnableConfirm(event)} className="space-y-4 max-w-md">
            <p className="text-sm text-gray-600">{t('profile.security.twoFactorSetupPrompt')}</p>
            <OtpCodeField
              label={t('auth.fields.otpCode')}
              placeholder={t('auth.otp.placeholder')}
              value={otpCode}
              onChange={setOtpCode}
              disabled={busy}
              autoFocus
              labelDir={fieldDirection}
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={busy || otpCode.length !== 6}
                className="px-6 py-3 rounded-xl font-bold text-white bg-diyar-dark hover:bg-black transition-colors cursor-pointer disabled:opacity-60"
              >
                {t('profile.security.twoFactorConfirm')}
              </button>
              <button
                type="button"
                onClick={resetFlow}
                disabled={busy}
                className="px-4 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                {t('profile.security.twoFactorCancel')}
              </button>
              <OtpResendAction
                layout="inline"
                align="start"
                onResend={() => void handleResend()}
                disabled={busy}
                isCoolingDown={isCoolingDown}
                secondsLeft={secondsLeft}
                resendLabel={t('profile.security.twoFactorResend')}
                cooldownLabelKey="profile.security.twoFactorResendCooldown"
              />
            </div>
          </form>
        ) : null}

        {flow === 'idle' && enabled ? (
          <button
            type="button"
            onClick={() => {
              setFlow('disabling_password');
              setPassword('');
              setOtpCode('');
              setFormError(null);
            }}
            disabled={actionsDisabled}
            className="inline-flex w-full sm:w-auto justify-center px-6 py-3 rounded-xl font-bold text-red-700 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-60"
          >
            {t('profile.security.twoFactorDisable')}
          </button>
        ) : null}

        {flow === 'disabling_password' ? (
          <form onSubmit={(event) => void handleDisablePassword(event)} className="space-y-4 max-w-md">
            <p className="text-sm text-gray-600">{t('profile.security.twoFactorDisablePrompt')}</p>
            <div>
              <AuthFieldLabel>{t('profile.security.twoFactorPasswordLabel')}</AuthFieldLabel>
              <PasswordInput
                value={password}
                onChange={setPassword}
                showPassword={showPassword}
                onToggleShow={() => setShowPassword((current) => !current)}
                autoComplete="current-password"
                direction={fieldDirection}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={busy || !password.trim()}
                className="px-6 py-3 rounded-xl font-bold text-white bg-diyar-dark hover:bg-black transition-colors cursor-pointer disabled:opacity-60"
              >
                {t('common.continue')}
              </button>
              <button
                type="button"
                onClick={resetFlow}
                disabled={busy}
                className="px-4 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                {t('profile.security.twoFactorCancel')}
              </button>
            </div>
          </form>
        ) : null}

        {flow === 'disabling_otp' ? (
          <form onSubmit={(event) => void handleDisableConfirm(event)} className="space-y-4 max-w-md">
            <p className="text-sm text-gray-600">{t('profile.security.twoFactorDisableOtpPrompt')}</p>
            <OtpCodeField
              label={t('auth.fields.otpCode')}
              placeholder={t('auth.otp.placeholder')}
              value={otpCode}
              onChange={setOtpCode}
              disabled={busy}
              autoFocus
              labelDir={fieldDirection}
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={busy || otpCode.length !== 6}
                className="px-6 py-3 rounded-xl font-bold text-white bg-diyar-dark hover:bg-black transition-colors cursor-pointer disabled:opacity-60"
              >
                {t('profile.security.twoFactorConfirmDisable')}
              </button>
              <button
                type="button"
                onClick={resetFlow}
                disabled={busy}
                className="px-4 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                {t('profile.security.twoFactorCancel')}
              </button>
              <OtpResendAction
                layout="inline"
                align="start"
                onResend={() => void handleResend()}
                disabled={busy}
                isCoolingDown={isCoolingDown}
                secondsLeft={secondsLeft}
                resendLabel={t('profile.security.twoFactorResend')}
                cooldownLabelKey="profile.security.twoFactorResendCooldown"
              />
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}

export default function SecurityPage() {
  const { user } = useAuth();
  const { t, dir, locale } = useLocale();
  const BreadcrumbChevron = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const maskedPhone = formatMaskedSaudiPhoneInternational(user?.phone);
  const accountBackPath = resolveAccountSettingsBackPath(user?.roles);

  const devicesQuery = useSecuritySessions();
  const revokeSession = useRevokeSecuritySession();
  const revokeDevice = useRevokeSecurityDevice();
  const logoutOthers = useLogoutOtherSecuritySessions();
  const [confirmLogoutOthers, setConfirmLogoutOthers] = useState(false);

  const devices = devicesQuery.data ?? [];
  const otherSessionsCount = useMemo(
    () =>
      devices.reduce(
        (count, device) => count + device.sessions.filter((session) => !session.is_current).length,
        0,
      ),
    [devices],
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

          <TwoFactorPanel maskedPhone={maskedPhone} />

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 md:p-6 border-b border-gray-100 bg-gray-50/30 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                  className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-red-700 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {logoutOthers.isPending ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                  {t('profile.security.logoutOthers')}
                </button>
              ) : null}
            </div>

            <div className="p-6 space-y-4">
              {devicesQuery.isLoading ? (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  <Loader2 size={24} className="animate-spin" />
                </div>
              ) : null}

              {devicesQuery.isError ? (
                <p className="text-sm text-red-600">{t('profile.security.sessionsLoadError')}</p>
              ) : null}

              {!devicesQuery.isLoading && !devicesQuery.isError && devices.length === 0 ? (
                <p className="text-sm text-gray-600">{t('profile.security.noSessions')}</p>
              ) : null}

              {devices.map((device) => (
                <DeviceCard
                  key={device.fingerprint}
                  device={device}
                  t={t}
                  locale={locale}
                  onRevokeDevice={(device) => revokeDevice.mutate(device)}
                  onRevokeSession={(sessionId) => revokeSession.mutate(sessionId)}
                  isRevokingDevice={revokeDevice.isPending}
                  isRevokingSession={revokeSession.isPending}
                />
              ))}
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
