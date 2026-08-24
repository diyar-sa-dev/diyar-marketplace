import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { AuthEmailInput, AuthFieldLabel } from '../../components/auth/AuthInputIcon.tsx';
import { PasswordInput } from '../../components/auth/PasswordStrengthField.tsx';
import { SaudiPhoneInput } from '../../components/auth/SaudiPhoneInput.tsx';
import { LocaleSwitcher } from '../../components/common/LocaleSwitcher.tsx';
import { useToast } from '../../hooks/useToast.ts';
import { useAuthFieldDirection, useLocale } from '../../lib/i18n/localeContext.ts';
import { ADMIN_PANEL_PATH } from '../../lib/auth/roles.ts';
import { useAdminAuth } from '../auth/AdminAuthContext.tsx';
import { collectDisplayErrors, isUnexpectedServerError } from '../../utils/errors.ts';
import { ensureCsrfCookie } from '../../lib/csrf.ts';

type LoginMethod = 'phone' | 'email';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t, locale, dir } = useLocale();
  const fieldDirection = useAuthFieldDirection();
  const { login } = useAdminAuth();
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  useEffect(() => {
    void ensureCsrfCookie();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setFieldErrors([]);
    setIsLoading(true);

    try {
      await login({
        method: loginMethod,
        identifier: loginMethod === 'phone' ? phone.trim() : email.trim(),
        password,
        remember,
      });

      toast.success(t('auth.toasts.loginSuccess'));
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? ADMIN_PANEL_PATH, { replace: true });
    } catch (error) {
      if (isUnexpectedServerError(error, locale)) {
        const { message } = collectDisplayErrors(error, locale);
        setFormError(message);
        return;
      }

      const { message, fieldMessages } = collectDisplayErrors(error, locale);
      setFormError(message);
      setFieldErrors(fieldMessages);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-dvh bg-[#f7f4f1] flex flex-col items-center justify-center px-4 py-6 sm:px-6 sm:py-10"
      dir={dir}
    >
      <div className="w-full max-w-md mx-auto flex flex-col gap-4 sm:gap-6">
        <div className="flex w-full items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-600 transition-colors hover:text-diyar-dark cursor-pointer sm:px-4"
          >
            <span>{t('common.back')}</span>
            <ChevronRight size={18} />
          </Link>
          <LocaleSwitcher />
        </div>

        <div className="w-full rounded-2xl border border-gray-100 bg-white p-5 shadow-xl shadow-diyar-brown/5 sm:rounded-3xl sm:p-8">
          <div className="mb-6 text-center sm:mb-8">
            <img src="/logo_diyar.svg" alt="DIYAR" className="mx-auto mb-4 h-9 sm:h-10" />
            <h1 className="text-xl font-extrabold text-diyar-dark sm:text-2xl">
              {t('admin.login.title')}
            </h1>
            <p className="mt-2 px-1 text-sm leading-6 text-gray-500">{t('admin.login.subtitle')}</p>
          </div>

          {(formError || fieldErrors.length > 0) && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError ?? fieldErrors.join(' ')}
            </div>
          )}

          <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4 sm:space-y-5">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setLoginMethod('phone')}
                className={`cursor-pointer rounded-lg py-2.5 text-sm font-bold transition-colors ${
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
                className={`cursor-pointer rounded-lg py-2.5 text-sm font-bold transition-colors ${
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
                <AuthFieldLabel required>{t('auth.fields.phone')}</AuthFieldLabel>
                <SaudiPhoneInput id="admin-login-phone" value={phone} onChange={setPhone} />
              </div>
            ) : (
              <div>
                <AuthFieldLabel required>{t('auth.fields.email')}</AuthFieldLabel>
                <AuthEmailInput value={email} onChange={setEmail} direction={fieldDirection} />
              </div>
            )}

            <div>
              <AuthFieldLabel required>{t('auth.fields.password')}</AuthFieldLabel>
              <PasswordInput
                id="admin-login-password"
                value={password}
                onChange={setPassword}
                showPassword={showPassword}
                onToggleShow={() => setShowPassword((visible) => !visible)}
                direction={fieldDirection}
                autoComplete="current-password"
              />
            </div>

            <label className="flex cursor-pointer items-center justify-center gap-2 text-sm text-gray-600 sm:justify-start">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="cursor-pointer rounded border-gray-300 text-diyar-brown focus:ring-diyar-brown"
              />
              {t('auth.fields.rememberMe')}
            </label>

            <button
              type="submit"
              data-testid="admin-login-submit"
              disabled={isLoading}
              className="flex w-full cursor-pointer items-center justify-center rounded-xl bg-diyar-dark py-3.5 text-sm font-bold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? t('common.loading') : t('admin.login.submit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
