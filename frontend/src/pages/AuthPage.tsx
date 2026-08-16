import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ChevronRight, Store, Briefcase, User, Megaphone } from 'lucide-react';
import { useAuth } from '../hooks/auth/useAuth.ts';
import { useOtpCooldown } from '../hooks/auth/useOtpCooldown.ts';
import { useToast } from '../hooks/useToast.ts';
import { resolveSafeReturnPath } from '../lib/auth/roles.ts';
import {
  isValidPasswordClient,
  isValidNameClient,
  isValidSaudiPhoneNational,
  maskPhoneForDisplay,
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  passwordsMatch,
} from '../lib/auth/validation.ts';
import {
  collectDisplayErrors,
  firstFieldError,
  isPhoneVerificationRequired,
  isUnexpectedServerError,
} from '../utils/errors.ts';
import { PrivacyPolicyModal } from '../components/modals/PrivacyPolicyModal.tsx';
import { AuthEmailInput, AuthFieldLabel } from '../components/auth/AuthInputIcon.tsx';
import { PasswordInput, PasswordStrengthField } from '../components/auth/PasswordStrengthField.tsx';
import { SaudiPhoneInput } from '../components/auth/SaudiPhoneInput.tsx';
import { useAuthFieldDirection, useLocale } from '../lib/i18n/localeContext.ts';

type AuthView = 'login' | 'register' | 'forgot' | 'otp' | 'reset';
type OtpContext = 'register' | 'forgot';
type LoginMethod = 'phone' | 'email';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t, locale } = useLocale();
  const fieldDirection = useAuthFieldDirection();
  const nameHint = t('validation.nameHint', { min: NAME_MIN_LENGTH, max: NAME_MAX_LENGTH });
  const saudiPhoneHint = t('validation.saudiPhoneHint');
  const passwordHint = t('validation.passwordHint');
  const passwordMismatchHint = t('validation.passwordMismatch');
  const {
    login,
    register,
    verifyOtp,
    resendOtp,
    forgotPassword,
    verifyPasswordResetOtp,
    resetPassword,
    error,
    clearError,
  } = useAuth();

  const [view, setView] = useState<AuthView>('login');
  const [previousView, setPreviousView] = useState<AuthView>('login');
  const [otpContext, setOtpContext] = useState<OtpContext>('register');
  const [pendingPhone, setPendingPhone] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  const [selectedRoles, setSelectedRoles] = useState<string[]>(['customer']);
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('phone');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetPasswordConfirm, setShowResetPasswordConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fatalError, setFatalError] = useState<Error | null>(null);
  const { secondsLeft, isCoolingDown, startCooldown } = useOtpCooldown(60);

  useEffect(() => {
    const state = location.state as { authView?: AuthView } | null;
    if (state?.authView) {
      setPreviousView('login');
      setView(state.authView);
    }
  }, [location.state]);

  const roles = [
    { id: 'customer', icon: <User size={20} /> },
    { id: 'merchant', icon: <Store size={20} /> },
    { id: 'service_provider', icon: <Briefcase size={20} /> },
    { id: 'marketer', icon: <Megaphone size={20} /> },
  ] as const;

  const redirectAfterAuth = (userRoles?: Array<{ name: string; status?: string }>) => {
    const from = (location.state as { from?: string } | null)?.from;
    navigate(resolveSafeReturnPath(from, userRoles), { replace: true });
  };

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

  const handleRoleToggle = (roleId: string) => {
    if (roleId === 'customer' && selectedRoles.length === 1 && selectedRoles[0] === 'customer') {
      return;
    }

    setSelectedRoles((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId],
    );
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    resetMessages();

    const identifier = loginMethod === 'phone' ? loginPhone.trim() : loginEmail.trim();

    if (loginMethod === 'phone' && !isValidSaudiPhoneNational(identifier)) {
      setFormError(saudiPhoneHint);
      toast.warning(saudiPhoneHint);
      setIsLoading(false);
      return;
    }

    try {
      const result = await login({
        method: loginMethod,
        identifier,
        password: loginPassword,
        remember: rememberMe,
      });
      toast.success(result.message ?? t('auth.toasts.loginSuccess'));
      redirectAfterAuth(result.user.roles);
    } catch (err) {
      const verification = isPhoneVerificationRequired(err);
      if (verification) {
        const phone = verification.phone || (loginMethod === 'phone' ? loginPhone.trim() : '');
        setPendingPhone(phone);
        setOtpContext('register');
        setOtpCode('');
        startCooldown();
        switchView('otp');
        resetMessages();
        toast.info(
          firstFieldError(err, 'phone_verification_required') ??
            t('auth.toasts.verificationRequired'),
        );
        return;
      }

      handleApiError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    resetMessages();

    if (!isValidNameClient(registerName)) {
      setFormError(nameHint);
      toast.warning(nameHint);
      setIsLoading(false);
      return;
    }

    if (!isValidSaudiPhoneNational(registerPhone.trim())) {
      setFormError(saudiPhoneHint);
      toast.warning(saudiPhoneHint);
      setIsLoading(false);
      return;
    }

    if (!isValidPasswordClient(registerPassword)) {
      setFormError(passwordHint);
      toast.warning(passwordHint);
      setIsLoading(false);
      return;
    }

    try {
      const result = await register({
        name: registerName.trim(),
        phone: registerPhone.trim(),
        email: registerEmail.trim() || undefined,
        password: registerPassword,
        roles: selectedRoles,
      });
      setPendingPhone(registerPhone.trim());
      setOtpContext('register');
      setOtpCode('');
      startCooldown();
      switchView('otp');
      toast.success(result.message ?? t('auth.toasts.registerSuccess'));
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    resetMessages();

    const phone = pendingPhone.trim();
    if (!isValidSaudiPhoneNational(phone)) {
      setFormError(saudiPhoneHint);
      toast.warning(saudiPhoneHint);
      setIsLoading(false);
      return;
    }

    try {
      const result = await forgotPassword(phone);
      setOtpContext('forgot');
      setOtpCode('');
      startCooldown();
      switchView('otp');
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
      if (otpContext === 'register') {
        const result = await verifyOtp({ phone: pendingPhone.trim(), code: otpCode });
        toast.success(result.message ?? t('auth.toasts.verifySuccess'));
        redirectAfterAuth(result.user.roles);
        return;
      }

      const result = await verifyPasswordResetOtp({
        phone: pendingPhone.trim(),
        code: otpCode,
      });
      toast.success(result.message ?? t('auth.toasts.resetOtpVerified'));
      switchView('reset');
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

    if (!isValidPasswordClient(resetPasswordValue)) {
      setFormError(passwordHint);
      toast.warning(passwordHint);
      setIsLoading(false);
      return;
    }

    if (!passwordsMatch(resetPasswordValue, resetPasswordConfirm)) {
      setFormError(passwordMismatchHint);
      toast.warning(passwordMismatchHint);
      setIsLoading(false);
      return;
    }

    try {
      const result = await resetPassword({
        phone: pendingPhone.trim(),
        code: otpCode,
        password: resetPasswordValue,
        password_confirmation: resetPasswordConfirm,
      });
      toast.success(result.message ?? t('auth.toasts.resetSuccess'));
      switchView('login');
      setLoginMethod('phone');
      setLoginPhone(pendingPhone.trim());
      setLoginPassword('');
      setResetPasswordValue('');
      setResetPasswordConfirm('');
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (isCoolingDown) {
      return;
    }

    setIsLoading(true);
    resetMessages();

    try {
      const result =
        otpContext === 'register'
          ? await resendOtp(pendingPhone.trim())
          : await forgotPassword(pendingPhone.trim());
      startCooldown();
      toast.info(result.message ?? t('auth.toasts.resendSuccess'));
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const switchView = (next: AuthView) => {
    resetMessages();
    setPreviousView(next === 'register' ? 'login' : view);
    setView(next);
  };

  const goBack = () => {
    resetMessages();
    if (view === 'register') {
      setView('login');
      return;
    }
    setView(previousView);
  };

  const openForgotPassword = () => {
    if (loginMethod === 'email') {
      toast.warning(t('auth.login.forgotEmailOnlyWarning'));
    }
    if (loginMethod === 'phone' && loginPhone.trim()) {
      setPendingPhone(loginPhone.trim());
    }
    switchView('forgot');
  };

  const viewTitle: Record<AuthView, string> = {
    login: t('auth.titles.login'),
    register: t('auth.titles.register'),
    forgot: t('auth.titles.forgot'),
    otp: t('auth.titles.otp'),
    reset: t('auth.titles.reset'),
  };

  return (
    <div className="min-h-dvh overflow-x-hidden bg-gray-50 flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8 relative">
      <Link
        to="/"
        className="absolute top-4 inset-e-4 md:top-8 md:inset-e-8 flex items-center gap-2 text-gray-500 hover:text-diyar-dark transition-colors font-bold px-4 py-2 border border-gray-200 rounded-full bg-white shadow-sm z-10 cursor-pointer"
      >
        <span className="text-sm">{t('common.back')}</span>
        <ChevronRight size={20} />
      </Link>

      <div className="w-full max-w-120 mx-auto mt-10 sm:mt-8 min-w-0">
        <Link to="/" className="flex items-center justify-center mb-6 sm:mb-8">
          <img src="/logo_diyar.svg" alt="DIYAR" className="h-10 sm:h-12" />
        </Link>

        <h2 className="text-center text-xl sm:text-2xl md:text-3xl font-extrabold text-diyar-dark mb-2 px-2">
          {viewTitle[view]}
        </h2>
      </div>

      {(formError || error) && (
        <div className="w-full max-w-120 mx-auto mb-4 min-w-0 px-1">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {formError ?? error}
          </div>
        </div>
      )}

      {fieldErrors.length > 0 && (
        <div className="w-full max-w-120 mx-auto mb-4 min-w-0 px-1">
          <ul className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 list-disc list-inside space-y-1">
            {fieldErrors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="w-full max-w-120 mx-auto min-w-0">
        <div className="bg-white py-6 sm:py-8 px-4 sm:px-8 md:px-10 shadow-xl shadow-diyar-brown/5 rounded-2xl md:rounded-3xl border border-gray-100 relative overflow-hidden">
          {view === 'login' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setLoginMethod('phone')}
                    className={`py-2.5 px-3 rounded-lg text-sm font-bold transition-colors cursor-pointer ${
                      loginMethod === 'phone'
                        ? 'bg-white text-diyar-dark shadow-sm'
                        : 'text-gray-500 hover:text-diyar-dark'
                    }`}
                  >
                    {t('auth.login.phoneTab')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod('email')}
                    className={`py-2.5 px-3 rounded-lg text-sm font-bold transition-colors cursor-pointer ${
                      loginMethod === 'email'
                        ? 'bg-white text-diyar-dark shadow-sm'
                        : 'text-gray-500 hover:text-diyar-dark'
                    }`}
                  >
                    {t('auth.login.emailTab')}
                  </button>
                </div>

                {loginMethod === 'phone' ? (
                  <div>
                    <AuthFieldLabel required hint={saudiPhoneHint}>
                      {t('auth.fields.phone')}
                    </AuthFieldLabel>
                    <SaudiPhoneInput id="login-phone" value={loginPhone} onChange={setLoginPhone} />
                  </div>
                ) : (
                  <div>
                    <AuthFieldLabel required>{t('auth.fields.email')}</AuthFieldLabel>
                    <AuthEmailInput
                      value={loginEmail}
                      onChange={setLoginEmail}
                      required
                      autoComplete="email"
                      direction={fieldDirection}
                    />
                  </div>
                )}

                <div>
                  <AuthFieldLabel required>{t('auth.fields.password')}</AuthFieldLabel>
                  <PasswordInput
                    value={loginPassword}
                    onChange={setLoginPassword}
                    showPassword={showPassword}
                    onToggleShow={() => setShowPassword(!showPassword)}
                    autoComplete="current-password"
                    direction={fieldDirection}
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-diyar-brown focus:ring-diyar-brown cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-600">
                      {t('auth.fields.rememberMe')}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={openForgotPassword}
                    className="text-sm font-bold text-diyar-brown hover:text-diyar-dark cursor-pointer"
                  >
                    {t('auth.login.forgotPassword')}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-xl text-white font-bold bg-diyar-dark hover:bg-black transition-colors flex justify-center items-center cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    t('auth.login.submit')
                  )}
                </button>
              </form>

              <div className="mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500 font-bold">
                      {t('auth.login.noAccount')}
                    </span>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => switchView('register')}
                    className="w-full py-3 px-4 rounded-xl text-diyar-dark font-bold bg-white border-2 border-gray-100 hover:border-diyar-brown hover:text-diyar-brown transition-colors cursor-pointer"
                  >
                    {t('auth.login.createAccount')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {view === 'register' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <button
                type="button"
                onClick={goBack}
                aria-label={t('auth.titles.login')}
                className="absolute top-4 inset-e-4 z-10 text-gray-400 hover:text-diyar-dark cursor-pointer"
              >
                <ChevronRight size={24} />
              </button>

              <form onSubmit={handleRegister} className="space-y-4 sm:space-y-5">
                <div>
                  <AuthFieldLabel required className="mb-3">
                    {t('auth.register.rolePrompt')}
                  </AuthFieldLabel>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {roles.map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => handleRoleToggle(role.id)}
                        className={`p-3 rounded-xl border-2 flex items-center gap-2 sm:gap-3 cursor-pointer transition-colors min-w-0 ${
                          selectedRoles.includes(role.id)
                            ? 'border-diyar-brown bg-orange-50 text-diyar-dark'
                            : 'border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div
                          className={
                            selectedRoles.includes(role.id) ? 'text-diyar-brown' : 'text-gray-400'
                          }
                        >
                          {role.icon}
                        </div>
                        <span className="font-bold text-sm truncate">
                          {t(`auth.roles.${role.id}`)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <AuthFieldLabel required hint={nameHint}>
                    {t('auth.fields.fullName')}
                  </AuthFieldLabel>
                  <input
                    type="text"
                    required
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value.slice(0, NAME_MAX_LENGTH))}
                    maxLength={NAME_MAX_LENGTH}
                    autoComplete="name"
                    className="w-full min-w-0 px-4 py-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-diyar-brown focus:border-diyar-brown outline-none transition-colors"
                    placeholder={t('auth.fields.fullName')}
                  />
                </div>

                <div>
                  <AuthFieldLabel>{t('auth.fields.emailOptional')}</AuthFieldLabel>
                  <AuthEmailInput
                    value={registerEmail}
                    onChange={setRegisterEmail}
                    autoComplete="email"
                    direction={fieldDirection}
                  />
                </div>

                <div>
                  <AuthFieldLabel required hint={saudiPhoneHint}>
                    {t('auth.fields.phone')}
                  </AuthFieldLabel>
                  <SaudiPhoneInput
                    id="register-phone"
                    value={registerPhone}
                    onChange={setRegisterPhone}
                  />
                </div>

                <div>
                  <AuthFieldLabel required>{t('auth.fields.password')}</AuthFieldLabel>
                  <PasswordStrengthField
                    value={registerPassword}
                    onChange={setRegisterPassword}
                    showPassword={showRegisterPassword}
                    onToggleShow={() => setShowRegisterPassword(!showRegisterPassword)}
                    direction={fieldDirection}
                  />
                </div>

                <p className="text-xs text-gray-500 leading-relaxed">
                  {t('auth.register.privacyPrefix')}{' '}
                  <button
                    type="button"
                    onClick={() => setIsPrivacyOpen(true)}
                    className="font-bold text-diyar-brown hover:text-diyar-dark hover:underline cursor-pointer"
                  >
                    {t('auth.register.privacyLink')}
                  </button>
                  .
                </p>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-xl text-white font-bold bg-diyar-dark hover:bg-black transition-colors flex justify-center items-center cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    t('auth.register.submit')
                  )}
                </button>
              </form>
            </div>
          )}

          {view === 'forgot' && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
              <button
                type="button"
                onClick={goBack}
                className="absolute top-4 inset-e-4 text-gray-400 hover:text-diyar-dark cursor-pointer"
              >
                <ChevronRight size={24} />
              </button>

              <div className="text-center mb-6 space-y-2">
                <p className="text-gray-600 text-sm">{t('auth.forgot.description')}</p>
                <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                  {t('auth.forgot.emailUnavailable')}
                </p>
              </div>

              <form onSubmit={handleForgot} className="space-y-6">
                <div>
                  <AuthFieldLabel required hint={saudiPhoneHint}>
                    {t('auth.fields.phone')}
                  </AuthFieldLabel>
                  <SaudiPhoneInput
                    id="forgot-phone"
                    value={pendingPhone}
                    onChange={setPendingPhone}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-xl text-white font-bold bg-diyar-dark hover:bg-black transition-colors flex justify-center items-center cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    t('auth.forgot.submit')
                  )}
                </button>
              </form>
            </div>
          )}

          {view === 'otp' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <button
                type="button"
                onClick={goBack}
                className="absolute top-4 inset-e-4 text-gray-400 hover:text-diyar-dark cursor-pointer"
              >
                <ChevronRight size={24} />
              </button>

              <div className="text-center mb-6 sm:mb-8">
                <p className="text-gray-600 text-sm">{t('auth.otp.description')}</p>
                <p className="font-bold text-diyar-dark mt-1 tracking-wide" dir="ltr">
                  +966 {maskPhoneForDisplay(pendingPhone)}
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
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
                      className="w-full max-w-xs min-w-0 text-center text-xl sm:text-2xl font-bold border border-gray-200 rounded-xl py-3 focus:ring-2 focus:ring-diyar-brown focus:border-diyar-brown outline-none transition-colors tracking-[0.35em] sm:tracking-[0.5em]"
                      placeholder="000000"
                      required
                    />
                  </div>
                </div>

                <div className="text-center mt-6">
                  <p className="text-sm text-gray-500 mb-2">{t('auth.otp.notReceived')}</p>
                  <button
                    type="button"
                    onClick={handleResendOtp}
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
                  className="w-full py-3.5 px-4 rounded-xl text-white font-bold bg-diyar-dark hover:bg-black transition-colors flex justify-center items-center mt-6 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : otpContext === 'register' ? (
                    t('auth.otp.verifyRegister')
                  ) : (
                    t('common.continue')
                  )}
                </button>
              </form>
            </div>
          )}

          {view === 'reset' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <button
                type="button"
                onClick={goBack}
                className="absolute top-4 inset-e-4 text-gray-400 hover:text-diyar-dark cursor-pointer"
              >
                <ChevronRight size={24} />
              </button>

              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <AuthFieldLabel required>{t('auth.fields.newPassword')}</AuthFieldLabel>
                  <PasswordStrengthField
                    value={resetPasswordValue}
                    onChange={setResetPasswordValue}
                    showPassword={showResetPassword}
                    onToggleShow={() => setShowResetPassword(!showResetPassword)}
                    direction={fieldDirection}
                  />
                </div>
                <div>
                  <AuthFieldLabel required>{t('auth.fields.confirmPassword')}</AuthFieldLabel>
                  <PasswordInput
                    value={resetPasswordConfirm}
                    onChange={setResetPasswordConfirm}
                    showPassword={showResetPasswordConfirm}
                    onToggleShow={() => setShowResetPasswordConfirm(!showResetPasswordConfirm)}
                    autoComplete="new-password"
                    direction={fieldDirection}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-xl text-white font-bold bg-diyar-dark hover:bg-black transition-colors flex justify-center items-center cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    t('auth.reset.submit')
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      <PrivacyPolicyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
    </div>
  );
}
