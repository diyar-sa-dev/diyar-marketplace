import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/auth/useAuth.ts';
import { useOtpCooldown } from '../hooks/auth/useOtpCooldown.ts';
import { useToast } from '../hooks/useToast.ts';
import {
  formatMaskedSaudiPhoneInternational,
  isValidPasswordClient,
  passwordsMatch,
} from '../lib/auth/validation.ts';
import { collectDisplayErrors, isUnexpectedServerError } from '../utils/errors.ts';
import { AuthFieldLabel } from '../components/auth/AuthInputIcon.tsx';
import { PasswordStrengthField } from '../components/auth/PasswordStrengthField.tsx';
import { useAuthFieldDirection, useLocale } from '../lib/i18n/localeContext.ts';

type ResetStep = 'request' | 'otp' | 'password';

export default function PasswordResetPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, locale, dir } = useLocale();
  const BreadcrumbChevron = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const fieldDirection = useAuthFieldDirection();
  const passwordHint = t('validation.passwordHint');
  const passwordMismatchHint = t('validation.passwordMismatch');
  const { user, forgotPassword, verifyPasswordResetOtp, resetPassword, clearError } = useAuth();

  const [step, setStep] = useState<ResetStep>('request');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fatalError, setFatalError] = useState<Error | null>(null);
  const { secondsLeft, isCoolingDown, startCooldown } = useOtpCooldown(60);

  const phone = user?.phone?.trim() ?? '';
  const maskedPhone = formatMaskedSaudiPhoneInternational(phone);

  const resetMessages = () => {
    setFormError(null);
    setFieldErrors([]);
    clearError();
  };

  const handleApiError = (err: unknown) => {
    if (isUnexpectedServerError(err, locale)) {
      const { message } = collectDisplayErrors(err, locale);
      setFatalError(new Error(message));
      return;
    }

    const { message, fieldMessages } = collectDisplayErrors(err, locale);
    setFormError(message);
    setFieldErrors(fieldMessages);
    clearError();
    toast.error(message);
  };

  if (fatalError) {
    throw fatalError;
  }

  useEffect(() => {
    if (!phone) {
      return;
    }
    resetMessages();
  }, [phone]);

  const handleSendOtp = async () => {
    if (!phone) {
      toast.warning(t('profile.security.noPhone'));
      return;
    }

    setIsLoading(true);
    resetMessages();

    try {
      const result = await forgotPassword(phone);
      startCooldown();
      setOtpCode('');
      setStep('otp');
      toast.info(result.message ?? t('auth.toasts.forgotSuccess'));
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    resetMessages();

    try {
      const result = await verifyPasswordResetOtp({ phone, code: otpCode });
      toast.success(result.message ?? t('auth.toasts.resetOtpVerified'));
      setStep('password');
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    resetMessages();

    if (!isValidPasswordClient(newPassword)) {
      setFormError(passwordHint);
      toast.warning(passwordHint);
      setIsLoading(false);
      return;
    }

    if (!passwordsMatch(newPassword, confirmPassword)) {
      setFormError(passwordMismatchHint);
      toast.warning(passwordMismatchHint);
      setIsLoading(false);
      return;
    }

    try {
      const result = await resetPassword({
        phone,
        code: otpCode,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      toast.success(result.message ?? t('auth.toasts.resetSuccess'));
      navigate('/profile/security', { replace: true });
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (isCoolingDown || isLoading) {
      return;
    }

    setIsLoading(true);
    resetMessages();

    try {
      const result = await forgotPassword(phone);
      startCooldown();
      toast.info(result.message ?? t('auth.toasts.resendSuccess'));
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsLoading(false);
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
            <Link to="/profile" className="hover:text-diyar-dark transition cursor-pointer">
              {t('common.myAccount')}
            </Link>
            <BreadcrumbChevron size={16} />
            <Link
              to="/profile/security"
              className="hover:text-diyar-dark transition cursor-pointer"
            >
              {t('profile.security.title')}
            </Link>
            <BreadcrumbChevron size={16} />
            <span className="font-bold text-diyar-dark">{t('profile.security.resetTitle')}</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-xl md:text-2xl font-bold text-diyar-dark mb-2">
            {t('profile.security.resetTitle')}
          </h1>
          <p className="text-gray-500 text-sm">{t('profile.security.resetDescription')}</p>
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

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden p-6 md:p-8">
          {step === 'request' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-sm text-gray-600 text-balance">
                  {t('profile.security.resetPhonePrompt')}
                </p>
                <p className="font-bold text-diyar-dark tracking-wide whitespace-nowrap" dir="ltr">
                  {maskedPhone || '—'}
                </p>
              </div>
              <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                {t('profile.security.emailResetUnavailable')}
              </p>
              <button
                type="button"
                onClick={() => void handleSendOtp()}
                disabled={isLoading || !phone}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-white bg-diyar-dark hover:bg-black transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  t('profile.security.sendResetOtp')
                )}
              </button>
            </div>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="text-center mb-2">
                <p className="text-gray-600 text-sm">{t('auth.otp.description')}</p>
                <p className="font-bold text-diyar-dark mt-1 tracking-wide whitespace-nowrap" dir="ltr">
                  {maskedPhone || '—'}
                </p>
              </div>

              <div>
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
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full max-w-xs min-w-0 text-center text-xl font-bold border border-gray-200 rounded-xl py-3 focus:ring-2 focus:ring-diyar-brown focus:border-diyar-brown outline-none tracking-[0.35em]"
                    placeholder="000000"
                    required
                  />
                </div>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => void handleResendOtp()}
                  disabled={isLoading || isCoolingDown}
                  className="text-sm font-bold text-diyar-brown hover:text-diyar-dark cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCoolingDown
                    ? t('auth.otp.resendCooldown', { seconds: secondsLeft })
                    : t('auth.otp.resend')}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || otpCode.length !== 6}
                className="w-full py-3.5 rounded-xl text-white font-bold bg-diyar-dark hover:bg-black transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  t('common.continue')
                )}
              </button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <AuthFieldLabel required>{t('auth.fields.newPassword')}</AuthFieldLabel>
                <PasswordStrengthField
                  value={newPassword}
                  onChange={setNewPassword}
                  showPassword={showPassword}
                  onToggleShow={() => setShowPassword(!showPassword)}
                  direction={fieldDirection}
                />
              </div>
              <div>
                <AuthFieldLabel required>{t('auth.fields.confirmPassword')}</AuthFieldLabel>
                <PasswordStrengthField
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  showPassword={showPassword}
                  onToggleShow={() => setShowPassword(!showPassword)}
                  direction={fieldDirection}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl text-white font-bold bg-diyar-dark hover:bg-black transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  t('auth.reset.submit')
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
