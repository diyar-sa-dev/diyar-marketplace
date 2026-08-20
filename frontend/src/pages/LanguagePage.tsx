import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Globe, Check } from 'lucide-react';
import { useLocale } from '../hooks/useLocale.ts';
import { useAuth } from '../hooks/auth/useAuth.ts';
import { useUpdateProfile } from '../hooks/profile/useProfile.ts';
import { resolveAccountHubPath } from '../lib/auth/roles.ts';
import { useToast } from '../hooks/useToast.ts';
import type { Locale } from '../lib/i18n/types.ts';

export default function LanguagePage() {
  const { locale, setLocale, t } = useLocale();
  const { user, isAuthenticated } = useAuth();
  const accountHubPath = resolveAccountHubPath(user?.roles);
  const { toast } = useToast();
  const updateProfile = useUpdateProfile();
  const [selectedLang, setSelectedLang] = useState<Locale>(locale);

  const languages: Array<{ id: Locale; labelKey: string; flag: string }> = [
    { id: 'ar', labelKey: 'language.options.ar', flag: '🇸🇦' },
    { id: 'en', labelKey: 'language.options.en', flag: '🇺🇸' },
  ];

  const handleSave = () => {
    setLocale(selectedLang);

    if (isAuthenticated && user) {
      const currentPreferences =
        user.preferences && typeof user.preferences === 'object' ? user.preferences : {};

      void updateProfile
        .mutateAsync({
          preferences: {
            ...currentPreferences,
            locale: selectedLang,
          },
        })
        .catch(() => undefined);
    }

    toast.success(t('language.saved'));
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-24 md:pb-12">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-diyar-dark transition">
              {t('common.home')}
            </Link>
            <ChevronLeft size={16} />
            <Link to={accountHubPath} className="hover:text-diyar-dark transition">
              {t('common.myAccount')}
            </Link>
            <ChevronLeft size={16} />
            <span className="font-bold text-diyar-dark">{t('common.language')}</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-diyar-dark mb-2">
            {t('language.title')}
          </h1>
          <p className="text-gray-500 text-sm">{t('language.subtitle')}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 md:p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Globe size={20} />
            </div>
            <h2 className="font-bold text-lg text-diyar-dark">{t('language.panelTitle')}</h2>
          </div>

          <div className="divide-y divide-gray-50">
            {languages.map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => setSelectedLang(lang.id)}
                className={`w-full p-5 md:p-6 flex items-center justify-between gap-4 transition-colors hover:bg-gray-50 cursor-pointer ${
                  selectedLang === lang.id ? 'bg-orange-50/30' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{lang.flag}</span>
                  <div className="text-start flex flex-col">
                    <span
                      className={`font-bold text-sm ${
                        selectedLang === lang.id ? 'text-diyar-dark' : 'text-gray-800'
                      }`}
                    >
                      {t(lang.labelKey)}
                    </span>
                    <span className="text-xs text-gray-500" dir="ltr">
                      {lang.id.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selectedLang === lang.id
                      ? 'border-diyar-dark bg-diyar-dark text-white'
                      : 'border-gray-200'
                  }`}
                >
                  {selectedLang === lang.id && <Check size={14} strokeWidth={3} />}
                </div>
              </button>
            ))}
          </div>

          <div className="p-6 border-t border-gray-100">
            <button
              type="button"
              onClick={handleSave}
              className="w-full bg-diyar-dark text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-colors cursor-pointer"
            >
              {t('common.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
