import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Lock, Shield, Smartphone, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/auth/useAuth.ts';
import { formatMaskedSaudiPhoneInternational } from '../lib/auth/validation.ts';
import { useLocale } from '../lib/i18n/localeContext.ts';

export default function SecurityPage() {
  const { user } = useAuth();
  const { t, dir } = useLocale();
  const BreadcrumbChevron = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const maskedPhone = formatMaskedSaudiPhoneInternational(user?.phone);

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
            <div className="p-5 md:p-6 border-b border-gray-100 bg-gray-50/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <LogOut size={20} />
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
            <div className="p-6">
              <p className="text-sm text-gray-600">{t('profile.security.devicesDescription')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
