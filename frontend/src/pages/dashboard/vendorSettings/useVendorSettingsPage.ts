import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
} from '../../../hooks/vendor/useVendorSettings.ts';
import {
  useDeleteAvatar,
  useProfile,
  useUpdateProfile,
  useUploadAvatar,
} from '../../../hooks/profile/useProfile.ts';
import { useLocale } from '../../../hooks/useLocale.ts';
import { useToast } from '../../../hooks/useToast.ts';
import { useAuth } from '../../../hooks/auth/useAuth.ts';
import { resolveMediaUrl } from '../../../lib/media.ts';
import { toSaudiPhoneNationalInput } from '../../../lib/auth/validation.ts';
import { readNotificationPreferences } from '../../../lib/notificationPreferences.ts';
import {
  PLACEHOLDER_STORE_COVER,
  PLACEHOLDER_STORE_LOGO,
} from '../../../lib/storeMediaDefaults.ts';
import type { Weekday } from '../../../api/vendorSettings.ts';
import {
  TAB_IDS,
  type BusinessFormState,
  type NotificationsFormState,
  type SettingsTab,
  type StoreFormState,
} from './vendorSettings.types.ts';
import {
  defaultWorkingHours,
  normalizeWorkingHours,
  readPreferenceLocale,
  updateWorkingHour,
} from './vendorSettings.utils.ts';
import { createVendorSettingsHandlers } from './useVendorSettingsPageHandlers.ts';

export function useVendorSettingsPage() {
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

  const [storeForm, setStoreForm] = useState<StoreFormState>({
    businessName: '',
    storeSlug: '',
    websiteUrl: '',
    description: '',
    location: '',
    supportPhone: '',
    supportEmail: '',
    workingHours: defaultWorkingHours(),
  });

  const [businessForm, setBusinessForm] = useState<BusinessFormState>({
    entityType: 'sole_proprietorship',
    crNumber: '',
    taxNumber: '',
    bankCode: 'snb',
    beneficiaryName: '',
    iban: '',
    ibanEditing: false,
  });

  const [notificationsForm, setNotificationsForm] = useState<NotificationsFormState>({
    selectedLanguage: locale,
    emailNotifications: true,
  });

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && TAB_IDS.includes(tab as SettingsTab)) {
      setActiveTab(tab as SettingsTab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!settings) {
      return;
    }

    setStoreForm({
      businessName: settings.business_name ?? '',
      storeSlug: settings.slug ?? '',
      websiteUrl: settings.website_url ?? '',
      description: settings.description ?? '',
      location: settings.location ?? '',
      supportPhone: toSaudiPhoneNationalInput(settings.support_phone),
      supportEmail: settings.support_email ?? '',
      workingHours: normalizeWorkingHours(settings.working_hours),
    });

    setBusinessForm({
      entityType: settings.legal_profile?.entity_type ?? 'sole_proprietorship',
      crNumber: settings.legal_profile?.commercial_registration_number ?? '',
      taxNumber: settings.legal_profile?.tax_number ?? '',
      bankCode: settings.bank_account?.bank_code ?? 'snb',
      beneficiaryName: settings.bank_account?.beneficiary_name ?? '',
      iban: '',
      ibanEditing: false,
    });
  }, [settings]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    const storedLocale = readPreferenceLocale(profile.preferences);
    setNotificationsForm((current) => ({
      ...current,
      selectedLanguage: storedLocale ?? current.selectedLanguage,
      emailNotifications: readNotificationPreferences(profile.preferences).email,
    }));
  }, [profile]);

  const selectTab = (tab: SettingsTab) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };

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

  const isSavingStore = updateSettings.isPending || updateWorkingHours.isPending;
  const isSavingBusiness = updateLegal.isPending || updateBank.isPending;
  const isSavingNotifications = updateProfile.isPending;
  const showMediaOverlay =
    uploadLogo.isPending ||
    deleteLogo.isPending ||
    uploadCover.isPending ||
    deleteCover.isPending ||
    uploadAvatar.isPending ||
    deleteAvatar.isPending;

  const handlers = createVendorSettingsHandlers({
    locale,
    settings,
    profile,
    t,
    toast,
    setLocale,
    setFieldErrors,
    storeForm,
    businessForm,
    notificationsForm,
    setBusinessForm,
    setNotificationsForm,
    mutations: {
      updateSettings,
      updateWorkingHours,
      uploadLogo,
      deleteLogo,
      uploadCover,
      deleteCover,
      updateLegal,
      updateBank,
      updateProfile,
    },
  });

  const patchStoreForm = (patch: Partial<StoreFormState>) => {
    setStoreForm((current) => ({ ...current, ...patch }));
  };

  const patchBusinessForm = (patch: Partial<BusinessFormState>) => {
    setBusinessForm((current) => ({ ...current, ...patch }));
  };

  const patchNotificationsForm = (patch: Partial<NotificationsFormState>) => {
    setNotificationsForm((current) => ({ ...current, ...patch }));
  };

  const updateHour = (day: Weekday, patch: Parameters<typeof updateWorkingHour>[2]) => {
    setStoreForm((current) => ({
      ...current,
      workingHours: updateWorkingHour(current.workingHours, day, patch),
    }));
  };

  return {
    t,
    dir,
    locale,
    toast,
    settings,
    isLoading,
    isError,
    error,
    refetch,
    profileLoading,
    activeTab,
    selectTab,
    tabs,
    fieldErrors,
    storeForm,
    patchStoreForm,
    businessForm,
    patchBusinessForm,
    notificationsForm,
    patchNotificationsForm,
    logoInputRef,
    coverInputRef,
    logoUrl,
    coverUrl,
    logoPreview,
    coverPreview,
    ibanMasked,
    displayName,
    displayAvatarUrl,
    isSavingStore,
    isSavingBusiness,
    isSavingNotifications,
    showMediaOverlay,
    uploadAvatar,
    deleteAvatar,
    deleteLogo,
    deleteCover,
    updateHour,
    ...handlers,
  };
}

export type VendorSettingsPageState = ReturnType<typeof useVendorSettingsPage>;
