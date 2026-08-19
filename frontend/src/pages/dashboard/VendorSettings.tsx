import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Camera, Save, Info, Globe, Wallet, Trash2, Pencil, ExternalLink } from 'lucide-react';
import { VendorShippingSettingsPanel } from '../../components/dashboard/vendor/shipping/VendorShippingSettingsPanel.tsx';
import { VendorReturnPolicyPanel } from '../../components/dashboard/vendor/returns/VendorReturnPolicyPanel.tsx';
import { RequiredLabel } from '../../components/dashboard/vendor/RequiredLabel.tsx';
import { FieldError } from '../../components/dashboard/vendor/FieldError.tsx';
import { UserAvatar } from '../../components/profile/UserAvatar.tsx';
import { PageLoadingOverlay } from '../../components/common/PageLoadingOverlay.tsx';
import { LoadingState } from '../../components/common/LoadingState.tsx';
import { ErrorState } from '../../components/common/ErrorState.tsx';
import {
  useDeleteVendorCover,
  useDeleteVendorLogo,
  useUpdateVendorBankAccount,
  useUpdateVendorLegalProfile,
  useUpdateVendorSettings,
  useUpdateVendorWorkingHours,
  useUploadVendorCover,
  useUploadVendorLogo,
  useVendorSettings,
} from '../../hooks/vendor/useVendorSettings.ts';
import {
  useDeleteAvatar,
  useProfile,
  useUpdateProfile,
  useUploadAvatar,
} from '../../hooks/profile/useProfile.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { useAuth } from '../../hooks/auth/useAuth.ts';
import { resolveMediaUrl } from '../../lib/media.ts';
import { getFieldErrors, parseApiError } from '../../utils/errors.ts';
import type {
  BusinessEntityType,
  SaudiBankCode,
  VendorWorkingHour,
  Weekday,
} from '../../api/vendorSettings.ts';
import type { Locale } from '../../lib/i18n/types.ts';
import { PLACEHOLDER_STORE_COVER, PLACEHOLDER_STORE_LOGO } from '../../lib/storeMediaDefaults.ts';
import { hasCustomerRole } from '../../lib/auth/roles.ts';
import { SaudiPhoneInput } from '../../components/auth/SaudiPhoneInput.tsx';
import { isValidSaudiPhoneNational, toSaudiPhoneNationalInput } from '../../lib/auth/validation.ts';
import { digitsOnly, isValidOptionalUrl } from '../../lib/vendorFormValidation.ts';
import {
  mergeNotificationPreferences,
  readNotificationPreferences,
} from '../../lib/notificationPreferences.ts';

const STORE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function sanitizeStoreSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .slice(0, 80);
}

const TAB_IDS = [
  'store',
  'appearance',
  'business',
  'shipping',
  'returns',
  'account',
  'notifications',
] as const;

type SettingsTab = (typeof TAB_IDS)[number];

const WEEKDAYS: Weekday[] = [
  'saturday',
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
];

const BANK_CODES: SaudiBankCode[] = ['snb', 'alrajhi', 'riyad', 'bsf'];

const ENTITY_TYPES: BusinessEntityType[] = [
  'sole_proprietorship',
  'freelancer_document',
  'company',
];

const INPUT_CLASS =
  'w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown bg-gray-50/50 placeholder:text-gray-400 text-start';

function defaultWorkingHours(): VendorWorkingHour[] {
  return WEEKDAYS.map((day) => ({
    day,
    is_closed: day === 'friday',
    opens_at: day === 'friday' ? '16:00' : '09:00',
    closes_at: '22:00',
  }));
}

function normalizeWorkingHours(hours: VendorWorkingHour[] | undefined): VendorWorkingHour[] {
  if (!hours?.length) {
    return defaultWorkingHours();
  }

  const byDay = new Map(hours.map((entry) => [entry.day, entry]));
  return WEEKDAYS.map((day) => {
    const existing = byDay.get(day);
    if (!existing) {
      return defaultWorkingHours().find((entry) => entry.day === day)!;
    }
    return {
      day,
      is_closed: existing.is_closed,
      opens_at: existing.is_closed ? null : (existing.opens_at ?? '09:00'),
      closes_at: existing.is_closed ? null : (existing.closes_at ?? '22:00'),
    };
  });
}

function firstFieldErrorMap(error: unknown): Record<string, string> {
  const fields = getFieldErrors(error);
  return Object.fromEntries(
    Object.entries(fields).map(([field, messages]) => [field, messages[0] ?? '']),
  );
}

function readPreferenceLocale(preferences: Record<string, unknown> | undefined): Locale | null {
  const value = preferences?.locale;
  return value === 'ar' || value === 'en' ? value : null;
}

export default function VendorSettings() {
  const { t, locale, dir, setLocale } = useLocale();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: settings, isLoading, isError, error, refetch } = useVendorSettings();
  const { data: profile, isLoading: profileLoading } = useProfile();

  const updateSettings = useUpdateVendorSettings();
  const updateWorkingHours = useUpdateVendorWorkingHours();
  const uploadLogo = useUploadVendorLogo();
  const deleteLogo = useDeleteVendorLogo();
  const uploadCover = useUploadVendorCover();
  const deleteCover = useDeleteVendorCover();
  const updateLegal = useUpdateVendorLegalProfile();
  const updateBank = useUpdateVendorBankAccount();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const deleteAvatar = useDeleteAvatar();

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<SettingsTab>(() => {
    const tab = searchParams.get('tab');
    return TAB_IDS.includes(tab as SettingsTab) ? (tab as SettingsTab) : 'store';
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && TAB_IDS.includes(tab as SettingsTab)) {
      setActiveTab(tab as SettingsTab);
    }
  }, [searchParams]);

  const selectTab = (tab: SettingsTab) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };

  const [businessName, setBusinessName] = useState('');
  const [storeSlug, setStoreSlug] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [workingHours, setWorkingHours] = useState<VendorWorkingHour[]>(defaultWorkingHours);

  const [entityType, setEntityType] = useState<BusinessEntityType>('sole_proprietorship');
  const [crNumber, setCrNumber] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [bankCode, setBankCode] = useState<SaudiBankCode>('snb');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [iban, setIban] = useState('');
  const [ibanEditing, setIbanEditing] = useState(false);

  const [selectedLanguage, setSelectedLanguage] = useState<Locale>(locale);
  const [emailNotifications, setEmailNotifications] = useState(true);

  useEffect(() => {
    if (!settings) {
      return;
    }

    setBusinessName(settings.business_name ?? '');
    setStoreSlug(settings.slug ?? '');
    setWebsiteUrl(settings.website_url ?? '');
    setDescription(settings.description ?? '');
    setLocation(settings.location ?? '');
    setSupportPhone(toSaudiPhoneNationalInput(settings.support_phone));
    setSupportEmail(settings.support_email ?? '');
    setWorkingHours(normalizeWorkingHours(settings.working_hours));

    setEntityType(settings.legal_profile?.entity_type ?? 'sole_proprietorship');
    setCrNumber(settings.legal_profile?.commercial_registration_number ?? '');
    setTaxNumber(settings.legal_profile?.tax_number ?? '');
    setBankCode(settings.bank_account?.bank_code ?? 'snb');
    setBeneficiaryName(settings.bank_account?.beneficiary_name ?? '');
    setIban('');
  }, [settings]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    const storedLocale = readPreferenceLocale(profile.preferences);
    if (storedLocale) {
      setSelectedLanguage(storedLocale);
    }

    setEmailNotifications(readNotificationPreferences(profile.preferences).email);
  }, [profile]);

  const tabs = useMemo(
    () =>
      TAB_IDS.map((id) => ({
        id,
        label: t(`vendor.settings.tabs.${id}`),
      })),
    [t],
  );

  const logoUrl = resolveMediaUrl(settings?.logo_url);
  const coverUrl = resolveMediaUrl(settings?.cover_url);
  const logoPreview = logoUrl ?? PLACEHOLDER_STORE_LOGO;
  const coverPreview = coverUrl ?? PLACEHOLDER_STORE_COVER;
  const ibanMasked = settings?.bank_account?.iban_masked;
  const displayName = profile?.name ?? user?.name ?? '';
  const displayAvatarUrl = profile?.avatar_url ?? user?.avatar_url;
  const showCustomerProfileLink = hasCustomerRole(user?.roles);

  const isSavingStore = updateSettings.isPending || updateWorkingHours.isPending;
  const isSavingBusiness = updateLegal.isPending || updateBank.isPending;
  const isSavingNotifications = updateProfile.isPending;

  const handleMutationError = (mutationError: unknown) => {
    setFieldErrors(firstFieldErrorMap(mutationError));
    toast.error(parseApiError(mutationError, locale).message);
  };

  const handleSaveStore = async () => {
    setFieldErrors({});

    const nationalPhone = supportPhone.trim();
    const nextErrors: Record<string, string> = {};

    if (!nationalPhone) {
      nextErrors.support_phone = t('vendor.settings.store.supportPhoneRequired');
    } else if (!isValidSaudiPhoneNational(nationalPhone)) {
      nextErrors.support_phone = t('vendor.settings.store.supportPhoneInvalid');
    }

    const slug = sanitizeStoreSlug(storeSlug.trim());
    if (!slug) {
      nextErrors.slug = t('vendor.settings.store.slugRequired');
    } else if (!STORE_SLUG_PATTERN.test(slug)) {
      nextErrors.slug = t('vendor.settings.store.slugInvalid');
    }

    const website = websiteUrl.trim();
    if (website && !isValidOptionalUrl(website)) {
      nextErrors.website_url = t('vendor.settings.store.websiteUrlInvalid');
    }

    for (const entry of workingHours) {
      if (
        !entry.is_closed &&
        entry.opens_at &&
        entry.closes_at &&
        entry.opens_at >= entry.closes_at
      ) {
        toast.warning(
          t('vendor.settings.store.invalidWorkingHours', {
            day: t(`vendor.settings.weekdays.${entry.day}`),
          }),
        );
        return;
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      toast.warning(Object.values(nextErrors)[0]);
      return;
    }

    try {
      await updateSettings.mutateAsync({
        business_name: businessName.trim(),
        slug,
        description: description.trim() || null,
        location: location.trim() || null,
        support_phone: nationalPhone ? `+966${nationalPhone}` : null,
        support_email: supportEmail.trim() || null,
        website_url: website || null,
      });
      await updateWorkingHours.mutateAsync(workingHours);
      toast.success(t('vendor.settings.saveSuccess'));
    } catch (mutationError) {
      handleMutationError(mutationError);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setFieldErrors({});
    try {
      await uploadLogo.mutateAsync(file);
      toast.success(t('vendor.settings.store.logoUploadSuccess'));
    } catch (mutationError) {
      handleMutationError(mutationError);
    }
  };

  const handleLogoDelete = async () => {
    setFieldErrors({});
    try {
      await deleteLogo.mutateAsync();
      toast.success(t('vendor.settings.store.logoDeleteSuccess'));
    } catch (mutationError) {
      handleMutationError(mutationError);
    }
  };

  const handleCoverUpload = async (file: File) => {
    setFieldErrors({});
    try {
      await uploadCover.mutateAsync(file);
      toast.success(t('vendor.settings.appearance.coverUploadSuccess'));
    } catch (mutationError) {
      handleMutationError(mutationError);
    }
  };

  const handleCoverDelete = async () => {
    setFieldErrors({});
    try {
      await deleteCover.mutateAsync();
      toast.success(t('vendor.settings.appearance.coverDeleteSuccess'));
    } catch (mutationError) {
      handleMutationError(mutationError);
    }
  };

  const handleSaveBusiness = async () => {
    setFieldErrors({});

    const crDigits = digitsOnly(crNumber);
    const taxDigits = digitsOnly(taxNumber);
    const nextErrors: Record<string, string> = {};

    if (crDigits.length !== 10) {
      nextErrors.commercial_registration_number = t('vendor.settings.business.crDigitsOnly');
    }

    if (taxNumber.trim() && taxDigits.length !== 15) {
      nextErrors.tax_number = t('vendor.settings.business.taxDigitsOnly');
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      toast.warning(Object.values(nextErrors)[0]);
      return;
    }

    try {
      await updateLegal.mutateAsync({
        entity_type: entityType,
        commercial_registration_number: crDigits,
        tax_number: taxDigits || null,
      });

      const ibanValue = iban.replace(/\s+/g, '').trim().toUpperCase();
      const existingBank = settings?.bank_account;
      const beneficiary = beneficiaryName.trim();

      if (!beneficiary) {
        setFieldErrors({ beneficiary_name: t('vendor.settings.business.beneficiaryRequired') });
        toast.warning(t('vendor.settings.business.beneficiaryRequired'));
        return;
      }

      const bankChanged =
        !existingBank ||
        bankCode !== existingBank.bank_code ||
        beneficiary !== (existingBank.beneficiary_name ?? '') ||
        ibanValue.length > 0;

      if (bankChanged) {
        if (!ibanValue) {
          setFieldErrors({ iban: t('vendor.settings.business.ibanRequired') });
          toast.warning(t('vendor.settings.business.ibanRequired'));
          return;
        }

        if (ibanValue.length !== 24 || !ibanValue.startsWith('SA')) {
          setFieldErrors({ iban: t('vendor.settings.business.ibanInvalid') });
          toast.warning(t('vendor.settings.business.ibanInvalid'));
          return;
        }

        await updateBank.mutateAsync({
          bank_code: bankCode,
          beneficiary_name: beneficiary,
          iban: ibanValue,
        });
        setIban('');
        setIbanEditing(false);
      }

      toast.success(t('vendor.settings.saveSuccess'));
    } catch (mutationError) {
      handleMutationError(mutationError);
    }
  };

  const handleSaveNotifications = async () => {
    setFieldErrors({});
    setLocale(selectedLanguage);

    try {
      await updateProfile.mutateAsync({
        preferences: {
          ...mergeNotificationPreferences(profile?.preferences, {
            email: emailNotifications,
          }),
          locale: selectedLanguage,
        },
      });
      toast.success(t('vendor.settings.notifications.languageSaved'));
    } catch (mutationError) {
      handleMutationError(mutationError);
    }
  };

  const updateHour = (day: Weekday, patch: Partial<VendorWorkingHour>) => {
    setWorkingHours((current) =>
      current.map((entry) => (entry.day === day ? { ...entry, ...patch } : entry)),
    );
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
        error={error}
        title={t('vendor.settings.loadError')}
        onRetry={() => void refetch()}
        className="min-h-96"
      />
    );
  }

  return (
    <div className="w-full space-y-6 relative">
      {(uploadLogo.isPending ||
        deleteLogo.isPending ||
        uploadCover.isPending ||
        deleteCover.isPending ||
        uploadAvatar.isPending ||
        deleteAvatar.isPending) && <PageLoadingOverlay />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-diyar-dark">{t('vendor.settings.title')}</h2>
          <p className="text-gray-500 text-sm mt-1">{t('vendor.settings.subtitle')}</p>
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
                ? 'bg-white text-diyar-brown shadow-sm ring-1 ring-gray-200/80'
                : 'text-gray-500 hover:text-diyar-dark hover:bg-white/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm w-full">
        {activeTab === 'store' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h3 className="font-bold text-diyar-dark mb-4">
                {t('vendor.settings.store.logoTitle')}
              </h3>
              <div className="flex items-center gap-6">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="w-24 h-24 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 relative overflow-hidden group cursor-pointer hover:border-diyar-brown/50 hover:bg-amber-50/20 transition-colors"
                  aria-label={t('vendor.settings.store.changeLogo')}
                >
                  <img src={logoPreview} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white" size={24} />
                  </div>
                </button>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/svg+xml"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void handleLogoUpload(file);
                    }
                    event.target.value = '';
                  }}
                />
                <div>
                  <p className="text-sm text-gray-500 mb-2">
                    {t('vendor.settings.store.logoFormats')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="text-sm font-bold text-diyar-brown border border-diyar-brown px-4 py-2 rounded-xl hover:bg-amber-50 transition cursor-pointer"
                    >
                      {t('vendor.settings.store.changeLogo')}
                    </button>
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => void handleLogoDelete()}
                        disabled={deleteLogo.isPending}
                        className="text-sm font-bold text-red-600 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition cursor-pointer disabled:opacity-60"
                      >
                        {t('vendor.settings.store.removeLogo')}
                      </button>
                    )}
                  </div>
                  <FieldError message={fieldErrors.logo} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <RequiredLabel required className="text-sm font-bold text-gray-700">
                  {t('vendor.settings.store.storeName')}
                </RequiredLabel>
                <input
                  type="text"
                  value={businessName}
                  onChange={(event) => setBusinessName(event.target.value)}
                  placeholder={t('vendor.settings.store.placeholders.storeName')}
                  className={INPUT_CLASS}
                />
                <FieldError message={fieldErrors.business_name} />
              </div>

              <div className="space-y-2">
                <RequiredLabel required className="text-sm font-bold text-gray-700">
                  {t('vendor.settings.store.slug')}
                </RequiredLabel>
                <div className="relative" dir="ltr">
                  <span className="absolute inset-y-0 inset-s-0 flex items-center ps-3 text-xs font-bold text-gray-400 pointer-events-none">
                    /store/
                  </span>
                  <input
                    type="text"
                    value={storeSlug}
                    onChange={(event) => setStoreSlug(sanitizeStoreSlug(event.target.value))}
                    placeholder="my-store-name"
                    className={`${INPUT_CLASS} ps-19 font-mono text-sm`}
                    dir="ltr"
                    autoComplete="off"
                    spellCheck={false}
                    maxLength={80}
                  />
                </div>
                <p className="text-xs text-gray-500">{t('vendor.settings.store.slugHint')}</p>
                {storeSlug ? (
                  <p className="text-xs text-diyar-brown font-medium" dir="ltr">
                    {t('vendor.settings.store.storePathHint', { slug: storeSlug })}
                  </p>
                ) : null}
                <FieldError message={fieldErrors.slug} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <RequiredLabel className="text-sm font-bold text-gray-700">
                  {t('vendor.settings.store.description')}
                </RequiredLabel>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder={t('vendor.settings.store.placeholders.description')}
                  className={INPUT_CLASS}
                />
                <p className="text-xs text-gray-500">
                  {t('vendor.settings.store.descriptionHint')}
                </p>
                <FieldError message={fieldErrors.description} />
              </div>

              <div className="space-y-2">
                <RequiredLabel className="text-sm font-bold text-gray-700">
                  {t('vendor.settings.store.location')}
                </RequiredLabel>
                <input
                  type="text"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder={t('vendor.settings.store.placeholders.location')}
                  className={INPUT_CLASS}
                />
                <FieldError message={fieldErrors.location} />
              </div>

              <div className="space-y-2">
                <RequiredLabel className="text-sm font-bold text-gray-700">
                  {t('vendor.settings.store.storeWebsiteUrl')}
                </RequiredLabel>
                <p className="text-xs text-gray-500">
                  {t('vendor.settings.store.externalWebsiteHint')}
                </p>
                <div className="relative mt-1">
                  <Globe
                    size={16}
                    className="absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none inset-s-3.5"
                  />
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(event) => setWebsiteUrl(event.target.value)}
                    placeholder={t('vendor.settings.store.placeholders.websiteUrl')}
                    className={`${INPUT_CLASS} dir-ltr text-left ps-10`}
                    dir="ltr"
                    autoComplete="url"
                  />
                </div>
                <FieldError message={fieldErrors.website_url} />
              </div>

              {storeSlug ? (
                <div className="md:col-span-2 rounded-xl border border-diyar-brown/20 bg-amber-50/50 p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-diyar-dark mb-1">
                      {t('vendor.settings.store.diyarStoreLink')}
                    </p>
                    <Link
                      to={`/store/${storeSlug}`}
                      className="text-sm text-diyar-brown hover:underline font-mono truncate block"
                      dir="ltr"
                    >
                      /store/{storeSlug}
                    </Link>
                  </div>
                  <ExternalLink size={16} className="text-diyar-brown shrink-0" />
                </div>
              ) : null}
            </div>

            <hr className="border-gray-100" />

            <div>
              <h3 className="font-bold text-diyar-dark mb-4">
                {t('vendor.settings.store.contactTitle')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <RequiredLabel required className="text-sm font-bold text-gray-700">
                    {t('vendor.settings.store.supportPhone')}
                  </RequiredLabel>
                  <SaudiPhoneInput
                    id="vendor-support-phone"
                    value={supportPhone}
                    onChange={setSupportPhone}
                  />
                  <FieldError message={fieldErrors.support_phone} />
                </div>
                <div className="space-y-2">
                  <RequiredLabel className="text-sm font-bold text-gray-700">
                    {t('vendor.settings.store.supportEmail')}
                  </RequiredLabel>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(event) => setSupportEmail(event.target.value)}
                    placeholder={t('vendor.settings.store.placeholders.supportEmail')}
                    className={INPUT_CLASS}
                    dir="ltr"
                  />
                  <FieldError message={fieldErrors.support_email} />
                </div>
              </div>
            </div>

            <div>
              <div className="mb-4">
                <h3 className="font-bold text-diyar-dark">
                  {t('vendor.settings.store.workingHoursTitle')}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {t('vendor.settings.store.workingHoursHint')}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {workingHours.map((entry) => (
                  <div
                    key={entry.day}
                    className={`rounded-2xl border p-4 transition-colors ${
                      entry.is_closed
                        ? 'border-gray-100 bg-gray-50/80'
                        : 'border-diyar-brown/15 bg-amber-50/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <span className="font-bold text-diyar-dark">
                        {t(`vendor.settings.weekdays.${entry.day}`)}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={!entry.is_closed}
                        onClick={() =>
                          updateHour(entry.day, {
                            is_closed: !entry.is_closed,
                            opens_at: entry.is_closed ? (entry.opens_at ?? '09:00') : null,
                            closes_at: entry.is_closed ? (entry.closes_at ?? '22:00') : null,
                          })
                        }
                        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                          entry.is_closed ? 'bg-gray-300' : 'bg-diyar-brown'
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                            entry.is_closed
                              ? dir === 'rtl'
                                ? '-translate-x-1'
                                : 'translate-x-1'
                              : dir === 'rtl'
                                ? '-translate-x-6'
                                : 'translate-x-6'
                          }`}
                        />
                      </button>
                    </div>

                    <p
                      className={`text-xs font-bold mb-2 ${
                        entry.is_closed ? 'text-gray-400' : 'text-emerald-700'
                      }`}
                    >
                      {entry.is_closed
                        ? t('vendor.settings.store.closed')
                        : t('vendor.settings.store.open')}
                    </p>

                    {!entry.is_closed && (
                      <div className="flex items-center gap-2 dir-ltr">
                        <div className="flex-1 min-w-0">
                          <label className="sr-only">{t('vendor.settings.store.opensAt')}</label>
                          <input
                            type="time"
                            value={entry.opens_at ?? ''}
                            onChange={(event) =>
                              updateHour(entry.day, { opens_at: event.target.value })
                            }
                            className={`${INPUT_CLASS} py-2 text-sm text-left`}
                            dir="ltr"
                          />
                        </div>
                        <span className="text-gray-300 shrink-0" aria-hidden>
                          →
                        </span>
                        <div className="flex-1 min-w-0">
                          <label className="sr-only">{t('vendor.settings.store.closesAt')}</label>
                          <input
                            type="time"
                            value={entry.closes_at ?? ''}
                            onChange={(event) =>
                              updateHour(entry.day, { closes_at: event.target.value })
                            }
                            className={`${INPUT_CLASS} py-2 text-sm text-left`}
                            dir="ltr"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <FieldError message={fieldErrors.hours ?? fieldErrors['hours.0.day']} />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => void handleSaveStore()}
                disabled={isSavingStore}
                className="bg-diyar-brown text-white px-6 py-3 rounded-xl font-bold flex items-center gap-3 hover:bg-[#A67B5B]/90 transition cursor-pointer disabled:opacity-60"
              >
                <Save size={18} />
                {isSavingStore ? t('vendor.settings.saving') : t('vendor.settings.store.save')}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h3 className="font-bold text-diyar-dark mb-4">
                {t('vendor.settings.appearance.coverTitle')}
              </h3>
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="w-full aspect-3/1 min-h-35 sm:min-h-45 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 relative overflow-hidden group cursor-pointer hover:border-diyar-brown/50 hover:bg-amber-50/20 transition-colors"
                aria-label={t('vendor.settings.appearance.changeCover')}
              >
                <img src={coverPreview} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex flex-col items-center text-white gap-2">
                    <Camera size={32} />
                    <span className="font-bold">{t('vendor.settings.appearance.changeCover')}</span>
                  </div>
                </div>
              </button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void handleCoverUpload(file);
                  }
                  event.target.value = '';
                }}
              />
              <p className="text-sm text-gray-500 mt-2">
                {t('vendor.settings.appearance.coverHint')}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {t('vendor.settings.appearance.coverFormats')}
              </p>
              {coverUrl && (
                <button
                  type="button"
                  onClick={() => void handleCoverDelete()}
                  disabled={deleteCover.isPending}
                  className="mt-3 text-sm font-bold text-red-600 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition cursor-pointer disabled:opacity-60 inline-flex items-center gap-3"
                >
                  <Trash2 size={16} />
                  {t('vendor.settings.appearance.removeCover')}
                </button>
              )}
              <FieldError message={fieldErrors.cover} />
            </div>
          </div>
        )}

        {activeTab === 'business' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-4">
              <Info className="text-amber-600 mt-0.5 shrink-0" size={20} />
              <div className="text-sm text-amber-800 leading-relaxed">
                {t('vendor.settings.business.infoBanner')}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-diyar-dark border-b border-gray-100 pb-2">
                {t('vendor.settings.business.legalTitle')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2 md:col-span-2">
                  <RequiredLabel required className="text-sm font-bold text-gray-700">
                    {t('vendor.settings.business.entityType')}
                  </RequiredLabel>
                  <select
                    value={entityType}
                    onChange={(event) => setEntityType(event.target.value as BusinessEntityType)}
                    className={`${INPUT_CLASS} appearance-none`}
                  >
                    {ENTITY_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {t(`vendor.settings.entityTypes.${type}`)}
                      </option>
                    ))}
                  </select>
                  <FieldError message={fieldErrors.entity_type} />
                </div>
                <div className="space-y-2">
                  <RequiredLabel required className="text-sm font-bold text-gray-700">
                    {t('vendor.settings.business.crNumber')}
                  </RequiredLabel>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={crNumber}
                    onChange={(event) => setCrNumber(digitsOnly(event.target.value).slice(0, 10))}
                    placeholder={t('vendor.settings.business.placeholders.crNumber')}
                    className={`${INPUT_CLASS} dir-ltr text-left`}
                    dir="ltr"
                  />
                  <FieldError message={fieldErrors.commercial_registration_number} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-1 text-start">
                    {t('vendor.settings.business.taxNumber')}{' '}
                    <span className="text-gray-400 font-normal">
                      {t('vendor.settings.business.taxOptional')}
                    </span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={taxNumber}
                    onChange={(event) => setTaxNumber(digitsOnly(event.target.value).slice(0, 15))}
                    placeholder={t('vendor.settings.business.placeholders.taxNumber')}
                    className={`${INPUT_CLASS} dir-ltr text-left`}
                    dir="ltr"
                  />
                  <FieldError message={fieldErrors.tax_number} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-diyar-dark border-b border-gray-100 pb-2">
                {t('vendor.settings.business.bankTitle')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <RequiredLabel required className="text-sm font-bold text-gray-700">
                    {t('vendor.settings.business.bankName')}
                  </RequiredLabel>
                  <select
                    value={bankCode}
                    onChange={(event) => setBankCode(event.target.value as SaudiBankCode)}
                    className={`${INPUT_CLASS} appearance-none`}
                  >
                    {BANK_CODES.map((code) => (
                      <option key={code} value={code}>
                        {t(`vendor.settings.banks.${code}`)}
                      </option>
                    ))}
                  </select>
                  <FieldError message={fieldErrors.bank_code} />
                </div>
                <div className="space-y-2">
                  <RequiredLabel required className="text-sm font-bold text-gray-700">
                    {t('vendor.settings.business.beneficiaryName')}
                  </RequiredLabel>
                  <input
                    type="text"
                    value={beneficiaryName}
                    onChange={(event) => setBeneficiaryName(event.target.value)}
                    placeholder={t('vendor.settings.business.placeholders.beneficiaryName')}
                    className={INPUT_CLASS}
                  />
                  <FieldError message={fieldErrors.beneficiary_name} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <RequiredLabel required className="text-sm font-bold text-gray-700">
                    {t('vendor.settings.business.iban')}
                  </RequiredLabel>
                  {!ibanEditing && ibanMasked && !iban ? (
                    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/80 p-3.5">
                      <Wallet size={18} className="text-gray-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-1">
                          {t('vendor.settings.business.ibanCurrent')}
                        </p>
                        <p className="font-mono text-sm text-diyar-dark tracking-wide" dir="ltr">
                          {ibanMasked}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIbanEditing(true)}
                        className="shrink-0 rounded-lg border border-gray-200 bg-white p-2 text-diyar-brown hover:bg-amber-50 cursor-pointer transition"
                        aria-label={t('vendor.settings.business.ibanEdit')}
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
                        placeholder={t('vendor.settings.business.ibanPlaceholder')}
                        className={`${INPUT_CLASS} ps-10 pe-10 text-left font-mono tracking-wide`}
                        dir="ltr"
                        maxLength={24}
                        inputMode="text"
                        autoComplete="off"
                      />
                      {ibanMasked && (
                        <button
                          type="button"
                          onClick={() => {
                            setIbanEditing(false);
                            setIban('');
                          }}
                          className="absolute top-1/2 -translate-y-1/2 inset-e-3 text-xs font-bold text-gray-500 hover:text-diyar-brown cursor-pointer"
                        >
                          {t('common.cancel')}
                        </button>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    {t('vendor.settings.business.ibanFormatHint')}
                  </p>
                  <FieldError message={fieldErrors.iban} />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => void handleSaveBusiness()}
                disabled={isSavingBusiness}
                className="bg-diyar-brown text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#A67B5B]/90 transition shadow-sm cursor-pointer disabled:opacity-60"
              >
                <Save size={18} />
                {isSavingBusiness
                  ? t('vendor.settings.saving')
                  : t('vendor.settings.business.save')}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'shipping' && (
          <div className="animate-in fade-in duration-300">
            <VendorShippingSettingsPanel />
          </div>
        )}

        {activeTab === 'returns' && (
          <div className="animate-in fade-in duration-300">
            <VendorReturnPolicyPanel />
          </div>
        )}

        {activeTab === 'account' && (
          <div className="space-y-8 animate-in fade-in duration-300 max-w-2xl">
            {profileLoading ? (
              <LoadingState />
            ) : (
              <>
                <div>
                  <h3 className="font-bold text-diyar-dark mb-4">
                    {t('vendor.settings.account.avatarTitle')}
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
                            toast.success(
                              result.message ?? t('vendor.settings.account.saveSuccess'),
                            );
                          })
                          .catch(handleMutationError);
                      }}
                      onDelete={() => {
                        void deleteAvatar
                          .mutateAsync()
                          .then((result) => {
                            toast.success(
                              result.message ?? t('vendor.settings.account.saveSuccess'),
                            );
                          })
                          .catch(handleMutationError);
                      }}
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 leading-relaxed mb-3">
                        {t('vendor.settings.account.avatarFormats')}
                      </p>
                      {showCustomerProfileLink && (
                        <Link
                          to="/profile/personal-info"
                          className="text-sm font-bold text-diyar-brown hover:text-diyar-dark transition inline-flex items-center gap-2"
                        >
                          {t('vendor.settings.account.manageProfile')}
                        </Link>
                      )}
                    </div>
                  </div>
                  <FieldError message={fieldErrors.avatar} />
                </div>

                <hr className="border-gray-100" />

                <div>
                  <h3 className="font-bold text-diyar-dark mb-2">
                    {t('vendor.settings.account.securityLink')}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {t('vendor.settings.account.securityHint')}
                  </p>
                  <Link
                    to="/profile/security"
                    className="text-sm font-bold text-diyar-brown border border-diyar-brown px-5 py-2.5 rounded-xl hover:bg-amber-50 transition inline-block"
                  >
                    {t('vendor.settings.account.securityLink')}
                  </Link>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h3 className="font-bold text-diyar-dark mb-6">
                {t('vendor.settings.notifications.title')}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                  <div>
                    <h4 className="font-bold text-diyar-dark">
                      {t('vendor.settings.notifications.emailChannel.title')}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {t('vendor.settings.notifications.emailChannel.desc')}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={emailNotifications}
                      onChange={() => setEmailNotifications((current) => !current)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:right-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-diyar-brown" />
                  </label>
                </div>

                {(['newOrders', 'stock', 'messages', 'reports'] as const).map((key, index) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors"
                  >
                    <div>
                      <h4 className="font-bold text-diyar-dark">
                        {t(`vendor.settings.notifications.items.${key}.title`)}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {t(`vendor.settings.notifications.items.${key}.desc`)}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        defaultChecked={index !== 3}
                        readOnly
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:right-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-diyar-brown" />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-gray-100" />

            <div>
              <h3 className="font-bold text-diyar-dark mb-4">
                {t('vendor.settings.notifications.languageTitle')}
              </h3>
              <div className="w-full md:w-1/2 space-y-2">
                <RequiredLabel className="text-sm font-bold text-gray-700">
                  {t('vendor.settings.notifications.dashboardLanguage')}
                </RequiredLabel>
                <select
                  value={selectedLanguage}
                  onChange={(event) => setSelectedLanguage(event.target.value as Locale)}
                  className={`${INPUT_CLASS} appearance-none`}
                >
                  <option value="ar">{t('language.options.ar')}</option>
                  <option value="en">{t('language.options.en')}</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => void handleSaveNotifications()}
                disabled={isSavingNotifications}
                className="bg-diyar-brown text-white px-6 py-3 rounded-xl font-bold flex items-center gap-3 hover:bg-[#A67B5B]/90 transition cursor-pointer disabled:opacity-60"
              >
                <Save size={18} />
                {isSavingNotifications ? t('vendor.settings.saving') : t('common.save')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
