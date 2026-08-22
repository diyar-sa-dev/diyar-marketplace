import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Save, Info, Wallet, Pencil } from 'lucide-react';
import { FieldError } from '../../components/dashboard/vendor/FieldError.tsx';
import { RequiredLabel } from '../../components/dashboard/vendor/RequiredLabel.tsx';
import { UserAvatar } from '../../components/profile/UserAvatar.tsx';
import { PageLoadingOverlay } from '../../components/common/PageLoadingOverlay.tsx';
import { LoadingState } from '../../components/common/LoadingState.tsx';
import { ErrorState } from '../../components/common/ErrorState.tsx';
import {
  useAffiliateSettings,
  useUpdateAffiliateSettings,
} from '../../hooks/affiliate/useAffiliate.ts';
import { useDeleteAvatar, useProfile, useUploadAvatar } from '../../hooks/profile/useProfile.ts';
import { useAuth } from '../../hooks/auth/useAuth.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { hasCustomerRole } from '../../lib/auth/roles.ts';
import { normalizeIban, saudiIbanValidationMessage } from '../../lib/iban.ts';
import { isValidOptionalUrl } from '../../lib/vendorFormValidation.ts';
import { parseApiError } from '../../utils/errors.ts';
import { usePortalTheme } from '../../lib/dashboard/portalTheme.ts';
import type { AffiliateSettingsPayload, AffiliateSocialLinks } from '../../types/affiliate.ts';

const TAB_IDS = ['account', 'bank', 'social'] as const;
type SettingsTab = (typeof TAB_IDS)[number];

const BANK_CODES = ['snb', 'alrajhi', 'riyad', 'bsf'] as const;

const INPUT_CLASS =
  'w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 bg-gray-50/50 placeholder:text-gray-400 text-start';

function maskAffiliateIban(iban: string | null | undefined): string | null {
  if (!iban) {
    return null;
  }

  const normalized = normalizeIban(iban);
  if (normalized.length < 8) {
    return normalized;
  }

  return `SA** **** **** ${normalized.slice(-4)}`;
}

export default function AffiliateSettings() {
  const { t, locale } = useLocale();
  const theme = usePortalTheme();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<SettingsTab>(() => {
    const tab = searchParams.get('tab');
    return TAB_IDS.includes(tab as SettingsTab) ? (tab as SettingsTab) : 'account';
  });

  const settingsQuery = useAffiliateSettings();
  const updateSettings = useUpdateAffiliateSettings();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const uploadAvatar = useUploadAvatar();
  const deleteAvatar = useDeleteAvatar();

  const [accountHolder, setAccountHolder] = useState('');
  const [iban, setIban] = useState('');
  const [ibanEditing, setIbanEditing] = useState(false);
  const [savedIbanMasked, setSavedIbanMasked] = useState<string | null>(null);
  const [bankCode, setBankCode] = useState('snb');
  const [socialLinks, setSocialLinks] = useState<AffiliateSocialLinks>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && TAB_IDS.includes(tab as SettingsTab)) {
      setActiveTab(tab as SettingsTab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!settingsQuery.data) {
      return;
    }

    const data = settingsQuery.data;
    setAccountHolder(data.payout_account_holder ?? '');
    setBankCode(data.payout_bank_code ?? 'snb');
    setSocialLinks(data.social_links ?? {});
    setSavedIbanMasked(data.payout_iban_masked ?? maskAffiliateIban(data.payout_iban));
    setIban('');
    setIbanEditing(false);
  }, [settingsQuery.data]);

  const tabs = useMemo(
    () =>
      TAB_IDS.map((id) => ({
        id,
        label: t(`affiliate.settings.tabs.${id}`),
      })),
    [t],
  );

  const selectTab = (tab: SettingsTab) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };

  const displayName = profile?.name ?? user?.name ?? '';
  const displayAvatarUrl = profile?.avatar_url ?? user?.avatar_url;
  const showCustomerProfileLink = hasCustomerRole(user?.roles);

  const saveSettings = async (payload: AffiliateSettingsPayload) => {
    try {
      await updateSettings.mutateAsync(payload);
      toast.success(t('affiliate.saveSuccess'));
    } catch (error) {
      toast.error(parseApiError(error, locale).message);
    }
  };

  const handleBankSave = () => {
    const errors: Record<string, string> = {};

    if (!accountHolder.trim()) {
      errors.payout_account_holder = t('affiliate.settings.bank.accountHolderRequired');
    }

    if (!bankCode) {
      errors.payout_bank_code = t('affiliate.settings.bank.bankRequired');
    }

    if (iban.trim()) {
      const ibanError = saudiIbanValidationMessage(iban, locale);
      if (ibanError) {
        errors.payout_iban = ibanError;
      }
    } else if (!savedIbanMasked) {
      errors.payout_iban = locale === 'ar' ? 'رقم الآيبان مطلوب.' : 'IBAN is required.';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    const payload: AffiliateSettingsPayload = {
      payout_account_holder: accountHolder.trim() || null,
      payout_bank_code: bankCode,
      payout_bank_name: t(`vendor.settings.banks.${bankCode}`),
    };

    if (iban.trim()) {
      payload.payout_iban = normalizeIban(iban);
    }

    void saveSettings(payload);
  };

  const validateSocialLinks = (): boolean => {
    const errors: Record<string, string> = {};
    const entries: Array<[keyof AffiliateSocialLinks, string | null | undefined]> = [
      ['twitter', socialLinks.twitter],
      ['instagram', socialLinks.instagram],
      ['tiktok', socialLinks.tiktok],
      ['website', socialLinks.website],
    ];

    entries.forEach(([key, value]) => {
      if (value?.trim() && !isValidOptionalUrl(value)) {
        errors[key] = t('affiliate.settings.social.urlInvalid');
      }
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSocialSave = () => {
    if (!validateSocialLinks()) {
      return;
    }

    const normalized: AffiliateSocialLinks = {
      twitter: socialLinks.twitter?.trim() || null,
      instagram: socialLinks.instagram?.trim() || null,
      tiktok: socialLinks.tiktok?.trim() || null,
      website: socialLinks.website?.trim() || null,
    };

    void saveSettings({ social_links: normalized });
  };

  const handleMutationError = (error: unknown) => {
    toast.error(parseApiError(error, locale).message);
  };

  if (settingsQuery.isLoading) {
    return <LoadingState className="min-h-60" />;
  }

  if (settingsQuery.isError || !settingsQuery.data) {
    return (
      <ErrorState
        message={t('affiliate.settings.loadError')}
        onRetry={() => void settingsQuery.refetch()}
      />
    );
  }

  const saveButtonClass = `${theme.button} px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition cursor-pointer disabled:opacity-60`;

  return (
    <div className="w-full space-y-6 relative animate-in fade-in duration-300">
      {(uploadAvatar.isPending || deleteAvatar.isPending || updateSettings.isPending) && (
        <PageLoadingOverlay />
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-diyar-dark">{t('affiliate.settings.title')}</h2>
          <p className="text-gray-500 text-sm mt-1">{t('affiliate.settings.subtitle')}</p>
        </div>
      </div>

      <div className="flex gap-1.5 p-1.5 bg-gray-100/90 rounded-2xl overflow-x-auto scrollbar-hide border border-gray-100">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => selectTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              activeTab === tab.id
                ? theme.tabActive
                : 'text-gray-500 hover:text-diyar-dark hover:bg-white/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm w-full">
        {activeTab === 'account' && (
          <div className="space-y-8 animate-in fade-in duration-300 max-w-2xl">
            {profileLoading ? (
              <LoadingState />
            ) : (
              <>
                <div>
                  <h3 className="font-bold text-diyar-dark mb-4">
                    {t('affiliate.settings.account.avatarTitle')}
                  </h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                    <UserAvatar
                      name={displayName}
                      avatarUrl={displayAvatarUrl}
                      editable
                      isUploading={uploadAvatar.isPending}
                      isDeleting={deleteAvatar.isPending}
                      onUpload={(file) => {
                        void uploadAvatar
                          .mutateAsync(file)
                          .then((result) => {
                            toast.success(result.message ?? t('affiliate.saveSuccess'));
                          })
                          .catch(handleMutationError);
                      }}
                      onDelete={() => {
                        void deleteAvatar
                          .mutateAsync()
                          .then((result) => {
                            toast.success(result.message ?? t('affiliate.saveSuccess'));
                          })
                          .catch(handleMutationError);
                      }}
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 leading-relaxed mb-3">
                        {t('affiliate.settings.account.avatarHint')}
                      </p>
                      {showCustomerProfileLink && (
                        <Link
                          to="/profile/personal-info"
                          className={`text-sm font-bold ${theme.link} transition inline-flex items-center gap-2 cursor-pointer`}
                        >
                          {t('affiliate.settings.account.manageProfile')}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                <hr className="border-gray-100" />

                <div>
                  <h3 className="font-bold text-diyar-dark mb-2">
                    {t('affiliate.settings.account.securityTitle')}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {t('affiliate.settings.account.securityHint')}
                  </p>
                  <Link
                    to="/profile/security"
                    className={`text-sm font-bold ${theme.outline} px-5 py-2.5 rounded-xl transition inline-block cursor-pointer`}
                  >
                    {t('affiliate.settings.account.securityLink')}
                  </Link>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'bank' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className={`${theme.notice} rounded-xl p-4 flex items-start gap-4`}>
              <Info className={`${theme.icon} mt-0.5 shrink-0`} size={20} />
              <div className="text-sm leading-relaxed">
                {t('affiliate.settings.bank.infoBanner')}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <RequiredLabel required className="text-sm font-bold text-gray-700">
                  {t('affiliate.settings.bank.bankName')}
                </RequiredLabel>
                <select
                  value={bankCode}
                  onChange={(event) => setBankCode(event.target.value)}
                  className={`${INPUT_CLASS} appearance-none cursor-pointer`}
                >
                  {BANK_CODES.map((code) => (
                    <option key={code} value={code}>
                      {t(`vendor.settings.banks.${code}`)}
                    </option>
                  ))}
                </select>
                <FieldError message={fieldErrors.payout_bank_code} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <RequiredLabel required className="text-sm font-bold text-gray-700">
                  {t('affiliate.settings.bank.accountHolder')}
                </RequiredLabel>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(event) => setAccountHolder(event.target.value)}
                  className={INPUT_CLASS}
                />
                <FieldError message={fieldErrors.payout_account_holder} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <RequiredLabel required className="text-sm font-bold text-gray-700">
                  {t('affiliate.settings.bank.iban')}
                </RequiredLabel>
                {!ibanEditing && savedIbanMasked && !iban ? (
                  <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/80 p-3.5">
                    <Wallet size={18} className="text-gray-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">
                        {t('affiliate.settings.bank.ibanCurrent')}
                      </p>
                      <p className="font-mono text-sm text-diyar-dark tracking-wide" dir="ltr">
                        {savedIbanMasked}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIbanEditing(true)}
                      className={`shrink-0 rounded-lg border border-gray-200 bg-white p-2 ${theme.icon} ${theme.buttonSoft} cursor-pointer transition`}
                      aria-label={t('affiliate.settings.bank.ibanEdit')}
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Wallet
                      size={18}
                      className="pointer-events-none absolute top-1/2 -translate-y-1/2 inset-s-3.5 text-gray-400"
                    />
                    <input
                      type="text"
                      value={iban}
                      onChange={(event) =>
                        setIban(
                          event.target.value
                            .toUpperCase()
                            .replace(/[^A-Z0-9]/g, '')
                            .slice(0, 24),
                        )
                      }
                      placeholder={t('affiliate.settings.bank.ibanPlaceholder')}
                      className={`${INPUT_CLASS} ps-10 pe-10 text-left font-mono tracking-wide`}
                      dir="ltr"
                      maxLength={24}
                      inputMode="text"
                      autoComplete="off"
                    />
                    {savedIbanMasked && (
                      <button
                        type="button"
                        onClick={() => {
                          setIbanEditing(false);
                          setIban('');
                        }}
                        className={`absolute top-1/2 -translate-y-1/2 inset-e-3 text-xs font-bold text-gray-500 ${theme.link} cursor-pointer`}
                      >
                        {t('common.cancel')}
                      </button>
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  {t('affiliate.settings.bank.ibanFormatHint')}
                </p>
                <FieldError message={fieldErrors.payout_iban} />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                disabled={updateSettings.isPending}
                onClick={handleBankSave}
                className={saveButtonClass}
              >
                <Save size={18} />
                {updateSettings.isPending
                  ? t('affiliate.settings.saving')
                  : t('affiliate.settings.bank.save')}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <h3 className="font-bold text-diyar-dark">{t('affiliate.settings.social.title')}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(
                [
                  ['twitter', 'https://twitter.com/...'],
                  ['instagram', 'https://instagram.com/...'],
                  ['tiktok', 'https://tiktok.com/@...'],
                  ['website', 'https://...'],
                ] as const
              ).map(([key, placeholder]) => (
                <div key={key} className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">
                    {t(`affiliate.settings.social.${key}`)}
                  </label>
                  <input
                    type="url"
                    placeholder={placeholder}
                    value={socialLinks[key] ?? ''}
                    onChange={(event) =>
                      setSocialLinks((prev) => ({ ...prev, [key]: event.target.value }))
                    }
                    className={`${INPUT_CLASS} dir-ltr text-left`}
                    dir="ltr"
                  />
                  <FieldError message={fieldErrors[key]} />
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                disabled={updateSettings.isPending}
                onClick={handleSocialSave}
                className={saveButtonClass}
              >
                <Save size={18} />
                {updateSettings.isPending
                  ? t('affiliate.settings.saving')
                  : t('affiliate.settings.social.save')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
