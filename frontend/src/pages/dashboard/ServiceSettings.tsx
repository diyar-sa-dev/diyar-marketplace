import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Save, Loader2, Pencil, Wallet } from 'lucide-react';
import { FieldError } from '../../components/dashboard/vendor/FieldError.tsx';
import { RequiredLabel } from '../../components/dashboard/vendor/RequiredLabel.tsx';
import { UserAvatar } from '../../components/profile/UserAvatar.tsx';
import { PageLoadingOverlay } from '../../components/common/PageLoadingOverlay.tsx';
import { LoadingState } from '../../components/common/LoadingState.tsx';
import { ErrorState } from '../../components/common/ErrorState.tsx';
import { WorkingHoursEditor } from '../../components/dashboard/WorkingHoursEditor.tsx';
import { ProviderWorkPolicyPanel } from '../../components/dashboard/provider/ProviderWorkPolicyPanel.tsx';
import {
  useDeleteProviderAvatar,
  useProviderSettings,
  useUpdateProviderBankAccount,
  useUpdateProviderNotificationSettings,
  useUpdateProviderProfileSettings,
  useUpdateProviderWorkingHours,
  useUploadProviderAvatar,
} from '../../hooks/provider/useProviderDashboard.ts';
import {
  useDeleteAvatar,
  useProfile,
  useUpdateProfile,
  useUploadAvatar,
} from '../../hooks/profile/useProfile.ts';
import { useAuth } from '../../hooks/auth/useAuth.ts';
import { useToast } from '../../hooks/useToast.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { parseApiError } from '../../utils/errors.ts';
import { saudiIbanValidationMessage, normalizeIban } from '../../lib/iban.ts';
import { mergeNotificationPreferences } from '../../lib/notificationPreferences.ts';
import {
  defaultWorkingHours,
  normalizeWorkingHours,
  validateWorkingHours,
} from '../../lib/workingHours.ts';
import type { VendorWorkingHour } from '../../api/vendorSettings.ts';
import type { Locale } from '../../lib/i18n/types.ts';

const TAB_IDS = ['profile', 'store', 'account', 'notifications'] as const;
type SettingsTab = (typeof TAB_IDS)[number];

const BANK_CODES = ['snb', 'alrajhi', 'riyad', 'bsf'] as const;

const NOTIFICATION_KEYS = [
  'new_bookings',
  'appointment_reminders',
  'messages',
  'new_reviews',
] as const;

const NOTIFICATION_I18N_KEYS: Record<(typeof NOTIFICATION_KEYS)[number], string> = {
  new_bookings: 'newBookings',
  appointment_reminders: 'appointmentReminders',
  messages: 'messages',
  new_reviews: 'newReviews',
};

const INPUT_CLASS =
  'w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-gray-50/50 placeholder:text-gray-400 text-start';

export default function ServiceSettings() {
  const { t, dir, locale, setLocale } = useLocale();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<SettingsTab>(() => {
    const tab = searchParams.get('tab');
    return TAB_IDS.includes(tab as SettingsTab) ? (tab as SettingsTab) : 'profile';
  });

  const { data: settings, isLoading, isError, error, refetch } = useProviderSettings();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProviderProfileSettings();
  const updateWorkingHours = useUpdateProviderWorkingHours();
  const uploadPersonalAvatar = useUploadAvatar();
  const deletePersonalAvatar = useDeleteAvatar();
  const uploadProfessionalAvatar = useUploadProviderAvatar();
  const deleteProfessionalAvatar = useDeleteProviderAvatar();
  const updateBankAccount = useUpdateProviderBankAccount();
  const updateNotifications = useUpdateProviderNotificationSettings();
  const updateUserProfile = useUpdateProfile();

  const [profileForm, setProfileForm] = useState({ specialty: '', bio: '', work_areas: '' });
  const [workingHours, setWorkingHours] = useState<VendorWorkingHour[]>(defaultWorkingHours);
  const [bankForm, setBankForm] = useState({
    bank_code: 'snb' as string,
    beneficiary_name: '',
    iban: '',
  });
  const [notifications, setNotifications] = useState({
    new_bookings: true,
    appointment_reminders: true,
    messages: true,
    new_reviews: false,
  });
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<Locale>(locale);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [ibanEditing, setIbanEditing] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && TAB_IDS.includes(tab as SettingsTab)) {
      setActiveTab(tab as SettingsTab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!settings) return;
    setProfileForm({
      specialty: settings.profile.specialty ?? '',
      bio: settings.profile.bio ?? '',
      work_areas: settings.profile.work_areas ?? '',
    });
    setWorkingHours(normalizeWorkingHours(settings.working_hours));
    setNotifications(settings.notifications);
    const activeBank = settings.bank_accounts[0];
    if (activeBank) {
      setBankForm({
        bank_code: activeBank.bank_code,
        beneficiary_name: activeBank.beneficiary_name,
        iban: '',
      });
    }
  }, [settings]);

  useEffect(() => {
    if (!profile) return;
    const prefs = profile.preferences as Record<string, unknown> | undefined;
    if (prefs?.email === false) {
      setEmailNotifications(false);
    }
    const prefLocale = prefs?.locale;
    if (prefLocale === 'ar' || prefLocale === 'en') {
      setSelectedLanguage(prefLocale);
    }
  }, [profile]);

  const selectTab = (tab: SettingsTab) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };

  const handleMutationError = (mutationError: unknown) => {
    toast.error(parseApiError(mutationError, locale).message);
  };

  const saveProfessionalProfile = async () => {
    setFieldErrors({});

    try {
      await updateProfile.mutateAsync(profileForm);
      toast.success(t('providerDashboard.settings.toast.profileSaved'));
    } catch (mutationError) {
      handleMutationError(mutationError);
    }
  };

  const saveStoreSettings = async () => {
    setFieldErrors({});
    const hoursError = validateWorkingHours(
      workingHours,
      (dayLabel) => t('vendor.settings.store.invalidWorkingHours', { day: dayLabel }),
      (day) => t(`vendor.settings.weekdays.${day}`),
    );
    if (hoursError) {
      toast.warning(hoursError);
      return;
    }

    try {
      await updateWorkingHours.mutateAsync(workingHours);
      toast.success(t('providerDashboard.settings.toast.workingHoursSaved'));
    } catch (mutationError) {
      handleMutationError(mutationError);
    }
  };

  const saveBankAccount = async () => {
    setFieldErrors({});
    const ibanValue = normalizeIban(bankForm.iban);
    const ibanMasked = settings?.bank_accounts[0]?.iban_masked;

    if (ibanMasked && !ibanEditing) {
      toast.warning(t('providerDashboard.settings.validation.ibanEditToSave'));
      return;
    }

    if (!bankForm.beneficiary_name.trim()) {
      setFieldErrors({
        beneficiary_name: t('providerDashboard.settings.validation.beneficiaryRequired'),
      });
      return;
    }

    const ibanError = saudiIbanValidationMessage(ibanValue, locale);
    if (ibanError) {
      setFieldErrors({ iban: ibanError });
      return;
    }

    try {
      await updateBankAccount.mutateAsync({
        bank_code: bankForm.bank_code,
        beneficiary_name: bankForm.beneficiary_name.trim(),
        iban: ibanValue,
      });
      setIbanEditing(false);
      setBankForm((prev) => ({ ...prev, iban: '' }));
      toast.success(t('providerDashboard.settings.toast.bankSaved'));
    } catch (mutationError) {
      handleMutationError(mutationError);
    }
  };

  const saveNotificationsTab = async () => {
    setFieldErrors({});
    setLocale(selectedLanguage);
    try {
      await updateNotifications.mutateAsync(notifications);
      await updateUserProfile.mutateAsync({
        preferences: {
          ...mergeNotificationPreferences(profile?.preferences, { email: emailNotifications }),
          locale: selectedLanguage,
        },
      });
      toast.success(t('providerDashboard.settings.toast.notificationsSaved'));
    } catch (mutationError) {
      handleMutationError(mutationError);
    }
  };

  if (isLoading) {
    return (
      <div className="relative min-h-96">
        <LoadingState className="min-h-96" />
      </div>
    );
  }

  if (isError || !settings) {
    return (
      <ErrorState
        message={t('providerDashboard.settings.loadError')}
        error={error as Error}
        onRetry={() => void refetch()}
        className="min-h-96"
      />
    );
  }

  const displayName = settings.account.name || profile?.name || '';
  const personalAvatarUrl = profile?.avatar_url ?? user?.avatar_url;
  const ibanMasked = settings.bank_accounts[0]?.iban_masked;
  const isSaving =
    updateProfile.isPending ||
    updateWorkingHours.isPending ||
    uploadPersonalAvatar.isPending ||
    deletePersonalAvatar.isPending ||
    uploadProfessionalAvatar.isPending ||
    deleteProfessionalAvatar.isPending ||
    updateBankAccount.isPending ||
    updateNotifications.isPending ||
    updateUserProfile.isPending;

  const tabs = [
    { id: 'profile' as const, label: t('providerDashboard.settings.tabs.profile') },
    { id: 'store' as const, label: t('providerDashboard.settings.tabs.store') },
    { id: 'account' as const, label: t('providerDashboard.settings.tabs.account') },
    { id: 'notifications' as const, label: t('providerDashboard.settings.tabs.notifications') },
  ];

  return (
    <div className="w-full space-y-6 relative" dir={dir}>
      {(uploadProfessionalAvatar.isPending ||
        deleteProfessionalAvatar.isPending ||
        uploadPersonalAvatar.isPending ||
        deletePersonalAvatar.isPending) && <PageLoadingOverlay />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-diyar-dark">
            {t('providerDashboard.settings.title')}
          </h2>
          <p className="text-gray-500 text-sm mt-1">{t('providerDashboard.settings.subtitle')}</p>
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
                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200/80'
                : 'text-gray-500 hover:text-diyar-dark hover:bg-white/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm w-full">
        {activeTab === 'profile' && (
          <div className="space-y-8 animate-in fade-in duration-300 w-full">
            <div>
              <h3 className="font-bold text-diyar-dark mb-4">
                {t('providerDashboard.settings.profile.avatarTitle')}
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <UserAvatar
                  name={displayName}
                  avatarUrl={settings.profile.avatar_url}
                  editable
                  isUploading={uploadProfessionalAvatar.isPending}
                  isDeleting={deleteProfessionalAvatar.isPending}
                  onUpload={(file) => {
                    void uploadProfessionalAvatar
                      .mutateAsync(file)
                      .then(() => {
                        toast.success(t('providerDashboard.settings.toast.avatarUpdated'));
                      })
                      .catch(handleMutationError);
                  }}
                  onDelete={() => {
                    void deleteProfessionalAvatar
                      .mutateAsync()
                      .then(() => {
                        toast.success(t('providerDashboard.settings.toast.avatarDeleted'));
                      })
                      .catch(handleMutationError);
                  }}
                />
                <div className="flex-1">
                  <p className="text-sm font-bold text-diyar-dark mb-1">{displayName}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {t('providerDashboard.settings.profile.avatarHint')}
                  </p>
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <RequiredLabel className="text-sm font-bold text-gray-700">
                  {t('providerDashboard.settings.profile.specialty')}
                </RequiredLabel>
                <input
                  type="text"
                  value={profileForm.specialty}
                  onChange={(e) =>
                    setProfileForm((prev) => ({ ...prev, specialty: e.target.value }))
                  }
                  placeholder={t('providerDashboard.settings.profile.specialtyPlaceholder')}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="space-y-2">
                <RequiredLabel className="text-sm font-bold text-gray-700">
                  {t('providerDashboard.settings.profile.bio')}
                </RequiredLabel>
                <textarea
                  rows={4}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder={t('providerDashboard.settings.profile.bioPlaceholder')}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="space-y-2">
                <RequiredLabel className="text-sm font-bold text-gray-700">
                  {t('providerDashboard.settings.profile.workAreas')}
                </RequiredLabel>
                <input
                  type="text"
                  value={profileForm.work_areas}
                  onChange={(e) =>
                    setProfileForm((prev) => ({ ...prev, work_areas: e.target.value }))
                  }
                  placeholder={t('providerDashboard.settings.profile.workAreasPlaceholder')}
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => void saveProfessionalProfile()}
                disabled={isSaving}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-3 hover:bg-blue-700 transition cursor-pointer disabled:opacity-60"
              >
                {updateProfile.isPending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                {t('providerDashboard.common.save')}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'store' && (
          <div className="space-y-10 animate-in fade-in duration-300 w-full">
            <div>
              <div className="mb-4">
                <h3 className="font-bold text-diyar-dark">
                  {t('vendor.settings.store.workingHoursTitle')}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {t('vendor.settings.store.workingHoursHint')}
                </p>
              </div>
              <WorkingHoursEditor hours={workingHours} onChange={setWorkingHours} />
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => void saveStoreSettings()}
                  disabled={updateWorkingHours.isPending}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-3 hover:bg-blue-700 transition cursor-pointer disabled:opacity-60"
                >
                  {updateWorkingHours.isPending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  {t('providerDashboard.settings.store.saveHours')}
                </button>
              </div>
            </div>

            <hr className="border-gray-100" />

            <div>
              <div className="mb-4">
                <h3 className="font-bold text-diyar-dark">
                  {t('providerDashboard.settings.workPolicy.title')}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {t('providerDashboard.settings.workPolicy.subtitle')}
                </p>
              </div>
              <ProviderWorkPolicyPanel />
            </div>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="space-y-8 animate-in fade-in duration-300 w-full">
            {profileLoading ? (
              <LoadingState />
            ) : (
              <>
                <div>
                  <h3 className="font-bold text-diyar-dark mb-4">
                    {t('providerDashboard.settings.account.avatarTitle')}
                  </h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                    <UserAvatar
                      name={displayName}
                      avatarUrl={personalAvatarUrl}
                      editable
                      isUploading={uploadPersonalAvatar.isPending}
                      isDeleting={deletePersonalAvatar.isPending}
                      onUpload={(file) => {
                        void uploadPersonalAvatar
                          .mutateAsync(file)
                          .then((result) => {
                            toast.success(
                              result.message ?? t('providerDashboard.settings.toast.avatarUpdated'),
                            );
                          })
                          .catch(handleMutationError);
                      }}
                      onDelete={() => {
                        void deletePersonalAvatar
                          .mutateAsync()
                          .then((result) => {
                            toast.success(
                              result.message ?? t('providerDashboard.settings.toast.avatarDeleted'),
                            );
                          })
                          .catch(handleMutationError);
                      }}
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 leading-relaxed mb-3">
                        {t('providerDashboard.settings.account.avatarFormats')}
                      </p>
                      <Link
                        to="/profile/personal-info"
                        className="text-sm font-bold text-blue-600 hover:text-diyar-dark transition inline-flex items-center gap-2 cursor-pointer"
                      >
                        {t('providerDashboard.settings.account.manageProfile')}
                      </Link>
                    </div>
                  </div>
                </div>

                <hr className="border-gray-100" />

                <div>
                  <h3 className="font-bold text-diyar-dark mb-2">
                    {t('providerDashboard.settings.account.securityLink')}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {t('providerDashboard.settings.account.securityHint')}
                  </p>
                  <Link
                    to="/profile/security"
                    className="text-sm font-bold text-blue-600 border border-blue-600 px-5 py-2.5 rounded-xl hover:bg-blue-50 transition inline-block cursor-pointer"
                  >
                    {t('providerDashboard.settings.account.securityLink')}
                  </Link>
                </div>

                <hr className="border-gray-100" />

                <div className="space-y-4">
                  <h3 className="font-bold text-diyar-dark border-b border-gray-100 pb-2">
                    {t('providerDashboard.settings.account.bankTitle')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-2">
                    <div className="space-y-2">
                      <RequiredLabel required className="text-sm font-bold text-gray-700">
                        {t('providerDashboard.settings.account.bankName')}
                      </RequiredLabel>
                      <select
                        value={bankForm.bank_code}
                        onChange={(e) =>
                          setBankForm((prev) => ({ ...prev, bank_code: e.target.value }))
                        }
                        className={`${INPUT_CLASS} appearance-none cursor-pointer`}
                      >
                        {BANK_CODES.map((code) => (
                          <option key={code} value={code}>
                            {t(`providerDashboard.settings.banks.${code}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <RequiredLabel required className="text-sm font-bold text-gray-700">
                        {t('providerDashboard.settings.account.beneficiaryFull')}
                      </RequiredLabel>
                      <input
                        type="text"
                        value={bankForm.beneficiary_name}
                        onChange={(e) =>
                          setBankForm((prev) => ({ ...prev, beneficiary_name: e.target.value }))
                        }
                        placeholder={t('providerDashboard.settings.account.beneficiaryPlaceholder')}
                        className={INPUT_CLASS}
                      />
                      <FieldError message={fieldErrors.beneficiary_name} />
                    </div>
                    <div className="space-y-2 xl:col-span-3">
                      <RequiredLabel required className="text-sm font-bold text-gray-700">
                        {t('providerDashboard.settings.account.iban')}
                      </RequiredLabel>
                      {!ibanEditing && ibanMasked && !bankForm.iban ? (
                        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/80 p-3.5">
                          <Wallet size={18} className="text-gray-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 mb-1">
                              {t('providerDashboard.settings.account.ibanCurrent')}
                            </p>
                            <p
                              className="font-mono text-sm text-diyar-dark tracking-wide"
                              dir="ltr"
                            >
                              {ibanMasked}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIbanEditing(true)}
                            className="shrink-0 rounded-lg border border-gray-200 bg-white p-2 text-blue-600 hover:bg-blue-50 cursor-pointer transition"
                            aria-label={t('providerDashboard.settings.account.ibanEdit')}
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
                            value={bankForm.iban}
                            onChange={(e) =>
                              setBankForm((prev) => ({
                                ...prev,
                                iban: e.target.value
                                  .toUpperCase()
                                  .replace(/[^A-Z0-9]/g, '')
                                  .slice(0, 24),
                              }))
                            }
                            placeholder={t('providerDashboard.settings.account.ibanPlaceholder')}
                            className={`${INPUT_CLASS} ps-10 pe-10 text-left font-mono tracking-wide`}
                            dir="ltr"
                            maxLength={24}
                          />
                          {ibanMasked && (
                            <button
                              type="button"
                              onClick={() => {
                                setIbanEditing(false);
                                setBankForm((prev) => ({ ...prev, iban: '' }));
                              }}
                              className="absolute top-1/2 -translate-y-1/2 inset-e-3 text-xs font-bold text-gray-500 hover:text-blue-600 cursor-pointer"
                            >
                              {t('providerDashboard.common.cancel')}
                            </button>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-gray-500">
                        {t('providerDashboard.settings.account.ibanFormatHint')}
                      </p>
                      <FieldError message={fieldErrors.iban} />
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => void saveBankAccount()}
                      disabled={isSaving}
                      className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-3 hover:bg-blue-700 transition cursor-pointer disabled:opacity-60"
                    >
                      {updateBankAccount.isPending ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Save size={18} />
                      )}
                      {t('providerDashboard.common.save')}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h3 className="font-bold text-diyar-dark mb-6">
                {t('providerDashboard.settings.notifications.title')}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                  <div>
                    <h4 className="font-bold text-diyar-dark">
                      {t('providerDashboard.settings.notifications.emailChannel.title')}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {t('providerDashboard.settings.notifications.emailChannel.desc')}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={emailNotifications}
                      onChange={() => setEmailNotifications((current) => !current)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:right-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>

                {NOTIFICATION_KEYS.map((key) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors"
                  >
                    <div>
                      <h4 className="font-bold text-diyar-dark">
                        {t(
                          `providerDashboard.settings.notifications.${NOTIFICATION_I18N_KEYS[key]}.title`,
                        )}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {t(
                          `providerDashboard.settings.notifications.${NOTIFICATION_I18N_KEYS[key]}.desc`,
                        )}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notifications[key]}
                        onChange={(e) =>
                          setNotifications((prev) => ({ ...prev, [key]: e.target.checked }))
                        }
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:right-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-gray-100" />

            <div>
              <h3 className="font-bold text-diyar-dark mb-4">
                {t('providerDashboard.settings.notifications.languageTitle')}
              </h3>
              <div className="w-full md:w-1/2 space-y-2">
                <RequiredLabel className="text-sm font-bold text-gray-700">
                  {t('providerDashboard.settings.notifications.dashboardLanguage')}
                </RequiredLabel>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value as Locale)}
                  className={`${INPUT_CLASS} appearance-none cursor-pointer`}
                >
                  <option value="ar">{t('language.options.ar')}</option>
                  <option value="en">{t('language.options.en')}</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => void saveNotificationsTab()}
                disabled={isSaving}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-3 hover:bg-blue-700 transition cursor-pointer disabled:opacity-60"
              >
                {updateNotifications.isPending || updateUserProfile.isPending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                {t('providerDashboard.common.save')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
