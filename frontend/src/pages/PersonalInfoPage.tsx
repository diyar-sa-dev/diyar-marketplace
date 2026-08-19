import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ChevronLeft, ChevronRight, Mail, User, X } from 'lucide-react';
import { resolveAccountSettingsBackPath } from '../lib/auth/roles.ts';
import { useAuth } from '../hooks/auth/useAuth.ts';
import { useOtpCooldown } from '../hooks/auth/useOtpCooldown.ts';
import { useToast } from '../hooks/useToast.ts';
import {
  useRequestPhoneChange,
  useResendPhoneChange,
  useRequestEmailVerification,
  useResendEmailVerification,
  useUpdateProfile,
  useVerifyPhoneChange,
  useVerifyEmailVerification,
} from '../hooks/profile/useProfile.ts';
import {
  isValidNameClient,
  isValidSaudiPhoneNational,
  maskPhoneForDisplay,
  maskEmailForDisplay,
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  toSaudiPhoneNationalInput,
} from '../lib/auth/validation.ts';
import { SaudiPhoneInput } from '../components/auth/SaudiPhoneInput.tsx';
import { ReadOnlySaudiPhoneDisplay } from '../components/auth/ReadOnlySaudiPhoneDisplay.tsx';
import { AuthEmailInput, AuthFieldLabel } from '../components/auth/AuthInputIcon.tsx';
import { useAuthFieldDirection, useLocale } from '../lib/i18n/localeContext.ts';
import { collectDisplayErrors, isUnexpectedServerError } from '../utils/errors.ts';

type PhoneChangeStep = 'phone' | 'otp';
type EmailVerifyStep = 'intro' | 'otp';

export default function PersonalInfoPage() {
  const { user } = useAuth();
  const accountBackPath = resolveAccountSettingsBackPath(user?.roles);
  const { toast } = useToast();
  const { t, locale, dir } = useLocale();
  const BreadcrumbChevron = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const fieldDirection = useAuthFieldDirection();
  const updateProfile = useUpdateProfile();
  const requestPhoneChange = useRequestPhoneChange();
  const resendPhoneChange = useResendPhoneChange();
  const verifyPhoneChange = useVerifyPhoneChange();
  const requestEmailVerification = useRequestEmailVerification();
  const resendEmailVerification = useResendEmailVerification();
  const verifyEmailVerification = useVerifyEmailVerification();
  const { secondsLeft, isCoolingDown, startCooldown } = useOtpCooldown(60);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [fatalError, setFatalError] = useState<Error | null>(null);

  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [phoneChangeStep, setPhoneChangeStep] = useState<PhoneChangeStep>('phone');
  const [newPhone, setNewPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [phoneModalError, setPhoneModalError] = useState<string | null>(null);

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailVerifyStep, setEmailVerifyStep] = useState<EmailVerifyStep>('intro');
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [emailModalError, setEmailModalError] = useState<string | null>(null);

  const emailNeedsVerification = useMemo(
    () => Boolean(user?.email && !user.email_verified_at),
    [user?.email, user?.email_verified_at],
  );

  const nameHint = t('validation.nameHint', { min: NAME_MIN_LENGTH, max: NAME_MAX_LENGTH });
  const saudiPhoneHint = t('validation.saudiPhoneHint');

  useEffect(() => {
    setName(user?.name ?? '');
    setEmail(user?.email ?? '');
  }, [user]);

  if (fatalError) {
    throw fatalError;
  }

  const handleApiError = (
    error: unknown,
    setError: (message: string | null) => void,
    setFields: (messages: string[]) => void,
  ) => {
    if (isUnexpectedServerError(error, locale)) {
      const { message } = collectDisplayErrors(error, locale);
      setFatalError(new Error(message));
      return;
    }

    const { message, fieldMessages } = collectDisplayErrors(error, locale);
    setError(message);
    setFields(fieldMessages);
    toast.error(message);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setFieldErrors([]);

    if (!isValidNameClient(name)) {
      setFormError(nameHint);
      toast.warning(nameHint);
      return;
    }

    try {
      const result = await updateProfile.mutateAsync({
        name: name.trim(),
        email: email.trim() || null,
      });
      toast.success(result.message ?? t('profile.personalInfo.saveSuccess'));
    } catch (error) {
      handleApiError(error, setFormError, setFieldErrors);
    }
  };

  const openPhoneModal = () => {
    setPhoneChangeStep('phone');
    setNewPhone('');
    setOtpCode('');
    setPhoneModalError(null);
    setIsPhoneModalOpen(true);
  };

  const closePhoneModal = () => {
    if (requestPhoneChange.isPending || verifyPhoneChange.isPending) {
      return;
    }
    setIsPhoneModalOpen(false);
  };

  const handleRequestPhoneChange = async () => {
    setPhoneModalError(null);

    if (!isValidSaudiPhoneNational(newPhone.trim())) {
      setPhoneModalError(saudiPhoneHint);
      toast.warning(saudiPhoneHint);
      return;
    }

    if (toSaudiPhoneNationalInput(user?.phone) === newPhone.trim()) {
      toast.warning(t('profile.personalInfo.phoneLockedHint'));
      return;
    }

    try {
      const message = await requestPhoneChange.mutateAsync(newPhone.trim());
      startCooldown();
      setOtpCode('');
      setPhoneChangeStep('otp');
      toast.info(message ?? t('auth.toasts.forgotSuccess'));
    } catch (error) {
      handleApiError(error, setPhoneModalError, () => undefined);
    }
  };

  const handleResendPhoneOtp = async () => {
    if (isCoolingDown || resendPhoneChange.isPending) {
      return;
    }

    setPhoneModalError(null);

    try {
      const message = await resendPhoneChange.mutateAsync(newPhone.trim());
      startCooldown();
      toast.info(message ?? t('auth.toasts.resendSuccess'));
    } catch (error) {
      handleApiError(error, setPhoneModalError, () => undefined);
    }
  };

  const handleVerifyPhoneChange = async (event: React.FormEvent) => {
    event.preventDefault();
    setPhoneModalError(null);

    try {
      const result = await verifyPhoneChange.mutateAsync({
        phone: newPhone.trim(),
        code: otpCode,
      });
      toast.success(result.message ?? t('profile.personalInfo.phoneChanged'));
      setIsPhoneModalOpen(false);
    } catch (error) {
      handleApiError(error, setPhoneModalError, () => undefined);
    }
  };

  const phoneChangeBusy =
    requestPhoneChange.isPending || resendPhoneChange.isPending || verifyPhoneChange.isPending;

  const emailVerifyBusy =
    requestEmailVerification.isPending ||
    resendEmailVerification.isPending ||
    verifyEmailVerification.isPending;

  const openEmailModal = () => {
    setEmailVerifyStep('intro');
    setEmailOtpCode('');
    setEmailModalError(null);
    setIsEmailModalOpen(true);
  };

  const closeEmailModal = () => {
    if (emailVerifyBusy) {
      return;
    }
    setIsEmailModalOpen(false);
  };

  const handleRequestEmailVerification = async () => {
    setEmailModalError(null);

    try {
      const message = await requestEmailVerification.mutateAsync();
      startCooldown();
      setEmailOtpCode('');
      setEmailVerifyStep('otp');
      toast.info(message ?? t('auth.toasts.resendSuccess'));
    } catch (error) {
      handleApiError(error, setEmailModalError, () => undefined);
    }
  };

  const handleResendEmailOtp = async () => {
    if (isCoolingDown || resendEmailVerification.isPending) {
      return;
    }

    setEmailModalError(null);

    try {
      const message = await resendEmailVerification.mutateAsync();
      startCooldown();
      toast.info(message ?? t('auth.toasts.resendSuccess'));
    } catch (error) {
      handleApiError(error, setEmailModalError, () => undefined);
    }
  };

  const handleVerifyEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    setEmailModalError(null);

    try {
      const result = await verifyEmailVerification.mutateAsync(emailOtpCode);
      toast.success(result.message ?? t('profile.personalInfo.emailVerified'));
      setIsEmailModalOpen(false);
    } catch (error) {
      handleApiError(error, setEmailModalError, () => undefined);
    }
  };

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
            <span className="font-bold text-diyar-dark">{t('profile.personalInfo.title')}</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-xl md:text-2xl font-bold text-diyar-dark mb-2">
            {t('profile.personalInfo.title')}
          </h1>
          <p className="text-gray-500 text-sm">{t('profile.personalInfo.subtitle')}</p>
        </div>

        {(formError || fieldErrors.length > 0) && (
          <div className="mb-4 space-y-2">
            {formError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}
            {fieldErrors.length > 0 && (
              <ul className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 list-disc list-inside space-y-1">
                {fieldErrors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="p-6 md:p-8 space-y-5">
            <div>
              <AuthFieldLabel required hint={nameHint}>
                {t('auth.fields.fullName')}
              </AuthFieldLabel>
              <div className="relative">
                <User
                  size={18}
                  className="absolute inset-e-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value.slice(0, NAME_MAX_LENGTH))}
                  maxLength={NAME_MAX_LENGTH}
                  autoComplete="name"
                  className="w-full bg-white border border-gray-200 rounded-xl py-3 pe-11 ps-4 text-gray-800 focus:ring-1 focus:ring-diyar-brown focus:border-diyar-brown outline-none"
                />
              </div>
            </div>

            <div>
              <AuthFieldLabel>{t('auth.fields.email')}</AuthFieldLabel>
              <AuthEmailInput
                value={email}
                onChange={setEmail}
                autoComplete="email"
                direction={fieldDirection}
              />
              {user?.email && user.email_verified_at ? (
                <p className="mt-2 text-xs font-bold text-green-700">
                  {t('profile.personalInfo.emailVerifiedBadge')}
                </p>
              ) : null}
              {emailNeedsVerification ? (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-start gap-2 text-amber-900 text-sm flex-1">
                    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                    <span>{t('profile.personalInfo.emailNotVerified')}</span>
                  </div>
                  <button
                    type="button"
                    onClick={openEmailModal}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-diyar-brown text-white text-sm font-bold px-4 py-2 hover:bg-[#856b54] transition cursor-pointer shrink-0"
                  >
                    <Mail size={16} />
                    {t('profile.personalInfo.verifyEmail')}
                  </button>
                </div>
              ) : null}
            </div>

            <div>
              <AuthFieldLabel>{t('auth.fields.phone')}</AuthFieldLabel>
              <ReadOnlySaudiPhoneDisplay phone={user?.phone} id="personal-info-phone" />
              <p className="mt-2 text-xs text-gray-500">
                {t('profile.personalInfo.phoneLockedHint')}
              </p>
              <button
                type="button"
                onClick={openPhoneModal}
                className="mt-3 text-sm font-bold text-diyar-brown hover:text-diyar-dark cursor-pointer"
              >
                {t('profile.personalInfo.changePhone')}
              </button>
            </div>
          </div>

          <div className="px-6 md:px-8 pb-8 flex justify-center">
            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="min-w-48 py-3 px-6 rounded-xl font-bold text-white bg-diyar-dark hover:bg-black transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {updateProfile.isPending ? (
                <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                t('common.save')
              )}
            </button>
          </div>
        </form>
      </div>

      {isPhoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"
            aria-label={t('profile.addresses.cancel')}
            onClick={closePhoneModal}
          />
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-diyar-dark">
                {t('profile.personalInfo.changePhone')}
              </h2>
              <button
                type="button"
                onClick={closePhoneModal}
                disabled={phoneChangeBusy}
                className="w-10 h-10 rounded-full bg-gray-50 text-gray-500 flex items-center justify-center hover:bg-gray-100 cursor-pointer disabled:opacity-60"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 md:p-6 space-y-4">
              {phoneModalError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {phoneModalError}
                </div>
              )}

              {phoneChangeStep === 'phone' ? (
                <>
                  <AuthFieldLabel required hint={saudiPhoneHint}>
                    {t('profile.personalInfo.newPhone')}
                  </AuthFieldLabel>
                  <SaudiPhoneInput id="new-phone-change" value={newPhone} onChange={setNewPhone} />
                  <button
                    type="button"
                    onClick={() => void handleRequestPhoneChange()}
                    disabled={phoneChangeBusy}
                    className="w-full py-3 rounded-xl font-bold text-white bg-diyar-dark hover:bg-black transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {requestPhoneChange.isPending ? (
                      <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      t('profile.personalInfo.sendOtp')
                    )}
                  </button>
                </>
              ) : (
                <form
                  onSubmit={(event) => void handleVerifyPhoneChange(event)}
                  className="space-y-4"
                >
                  <p className="text-sm text-gray-600 text-center">
                    {t('auth.otp.description')}{' '}
                    <span className="font-bold text-diyar-dark" dir="ltr">
                      +966 {maskPhoneForDisplay(newPhone)}
                    </span>
                  </p>
                  <AuthFieldLabel required className="text-center">
                    {t('auth.fields.otpCode')}
                  </AuthFieldLabel>
                  <div className="flex justify-center" dir="ltr">
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={otpCode}
                      onChange={(event) =>
                        setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                      }
                      className="w-full max-w-xs text-center text-xl font-bold border border-gray-200 rounded-xl py-3 focus:ring-2 focus:ring-diyar-brown focus:border-diyar-brown outline-none tracking-[0.35em]"
                      placeholder="000000"
                      required
                    />
                  </div>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => void handleResendPhoneOtp()}
                      disabled={phoneChangeBusy || isCoolingDown}
                      className="text-sm font-bold text-diyar-brown hover:text-diyar-dark cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCoolingDown
                        ? t('auth.otp.resendCooldown', { seconds: secondsLeft })
                        : t('auth.otp.resend')}
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={phoneChangeBusy || otpCode.length !== 6}
                    className="w-full py-3 rounded-xl font-bold text-white bg-diyar-dark hover:bg-black transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {verifyPhoneChange.isPending ? (
                      <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      t('profile.personalInfo.verifyPhone')
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"
            aria-label={t('profile.addresses.cancel')}
            onClick={closeEmailModal}
          />
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-diyar-dark">
                {t('profile.personalInfo.emailVerifyTitle')}
              </h2>
              <button
                type="button"
                onClick={closeEmailModal}
                disabled={emailVerifyBusy}
                className="w-10 h-10 rounded-full bg-gray-50 text-gray-500 flex items-center justify-center hover:bg-gray-100 cursor-pointer disabled:opacity-60"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 md:p-6 space-y-4">
              {emailModalError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {emailModalError}
                </div>
              )}

              {emailVerifyStep === 'intro' ? (
                <>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t('profile.personalInfo.emailVerifyHint')}
                  </p>
                  <p className="text-sm font-bold text-diyar-dark tabular-nums" dir="ltr">
                    {maskEmailForDisplay(user?.email)}
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleRequestEmailVerification()}
                    disabled={emailVerifyBusy}
                    className="w-full py-3 rounded-xl font-bold text-white bg-diyar-dark hover:bg-black transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {requestEmailVerification.isPending ? (
                      <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      t('profile.personalInfo.sendOtp')
                    )}
                  </button>
                </>
              ) : (
                <form onSubmit={(event) => void handleVerifyEmail(event)} className="space-y-4">
                  <p className="text-sm text-gray-600 text-center">
                    {t('auth.otp.emailDescription')}
                  </p>
                  <p
                    className="text-sm font-bold text-diyar-dark text-center tabular-nums"
                    dir="ltr"
                  >
                    {maskEmailForDisplay(user?.email)}
                  </p>
                  <AuthFieldLabel required className="text-center">
                    {t('auth.fields.otpCode')}
                  </AuthFieldLabel>
                  <div className="flex justify-center" dir="ltr">
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={emailOtpCode}
                      onChange={(event) =>
                        setEmailOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                      }
                      className="w-full max-w-xs text-center text-xl font-bold border border-gray-200 rounded-xl py-3 focus:ring-2 focus:ring-diyar-brown focus:border-diyar-brown outline-none tracking-[0.35em]"
                      placeholder="000000"
                      required
                    />
                  </div>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => void handleResendEmailOtp()}
                      disabled={emailVerifyBusy || isCoolingDown}
                      className="text-sm font-bold text-diyar-brown hover:text-diyar-dark cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCoolingDown
                        ? t('auth.otp.resendCooldown', { seconds: secondsLeft })
                        : t('auth.otp.resend')}
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={emailVerifyBusy || emailOtpCode.length !== 6}
                    className="w-full py-3 rounded-xl font-bold text-white bg-diyar-dark hover:bg-black transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {verifyEmailVerification.isPending ? (
                      <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      t('profile.personalInfo.verifyEmail')
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
