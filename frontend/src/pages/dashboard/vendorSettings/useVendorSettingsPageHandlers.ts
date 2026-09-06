import { parseApiError } from '../../../utils/errors.ts';
import { isValidSaudiPhoneNational } from '../../../lib/auth/validation.ts';
import { digitsOnly, isValidOptionalUrl } from '../../../lib/vendorFormValidation.ts';
import { mergeNotificationPreferences } from '../../../lib/notificationPreferences.ts';
import { firstFieldErrorMap, sanitizeStoreSlug } from './vendorSettings.utils.ts';
import { STORE_SLUG_PATTERN, type VendorSettingsHandlerDeps } from './vendorSettings.types.ts';

export function createVendorSettingsHandlers(deps: VendorSettingsHandlerDeps) {
  const {
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
    mutations,
  } = deps;

  const handleMutationError = (mutationError: unknown) => {
    setFieldErrors(firstFieldErrorMap(mutationError));
    toast.error(parseApiError(mutationError, locale).message);
  };

  const handleSaveStore = async () => {
    setFieldErrors({});

    const nationalPhone = storeForm.supportPhone.trim();
    const nextErrors: Record<string, string> = {};

    if (!nationalPhone) {
      nextErrors.support_phone = t('vendor.settings.store.supportPhoneRequired');
    } else if (!isValidSaudiPhoneNational(nationalPhone)) {
      nextErrors.support_phone = t('vendor.settings.store.supportPhoneInvalid');
    }

    const slug = sanitizeStoreSlug(storeForm.storeSlug.trim());
    if (!slug) {
      nextErrors.slug = t('vendor.settings.store.slugRequired');
    } else if (!STORE_SLUG_PATTERN.test(slug)) {
      nextErrors.slug = t('vendor.settings.store.slugInvalid');
    }

    const website = storeForm.websiteUrl.trim();
    if (website && !isValidOptionalUrl(website)) {
      nextErrors.website_url = t('vendor.settings.store.websiteUrlInvalid');
    }

    for (const entry of storeForm.workingHours) {
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
      await mutations.updateSettings.mutateAsync({
        business_name: storeForm.businessName.trim(),
        slug,
        description: storeForm.description.trim() || null,
        location: storeForm.location.trim() || null,
        support_phone: nationalPhone ? `+966${nationalPhone}` : null,
        support_email: storeForm.supportEmail.trim() || null,
        website_url: website || null,
      });
      await mutations.updateWorkingHours.mutateAsync(storeForm.workingHours);
      toast.success(t('vendor.settings.saveSuccess'));
    } catch (mutationError) {
      handleMutationError(mutationError);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setFieldErrors({});
    try {
      await mutations.uploadLogo.mutateAsync(file);
      toast.success(t('vendor.settings.store.logoUploadSuccess'));
    } catch (mutationError) {
      handleMutationError(mutationError);
    }
  };

  const handleLogoDelete = async () => {
    setFieldErrors({});
    try {
      await mutations.deleteLogo.mutateAsync();
      toast.success(t('vendor.settings.store.logoDeleteSuccess'));
    } catch (mutationError) {
      handleMutationError(mutationError);
    }
  };

  const handleCoverUpload = async (file: File) => {
    setFieldErrors({});
    try {
      await mutations.uploadCover.mutateAsync(file);
      toast.success(t('vendor.settings.appearance.coverUploadSuccess'));
    } catch (mutationError) {
      handleMutationError(mutationError);
    }
  };

  const handleCoverDelete = async () => {
    setFieldErrors({});
    try {
      await mutations.deleteCover.mutateAsync();
      toast.success(t('vendor.settings.appearance.coverDeleteSuccess'));
    } catch (mutationError) {
      handleMutationError(mutationError);
    }
  };

  const handleSaveBusiness = async () => {
    setFieldErrors({});

    const crDigits = digitsOnly(businessForm.crNumber);
    const taxDigits = digitsOnly(businessForm.taxNumber);
    const nextErrors: Record<string, string> = {};

    if (crDigits.length !== 10) {
      nextErrors.commercial_registration_number = t('vendor.settings.business.crDigitsOnly');
    }

    if (businessForm.taxNumber.trim() && taxDigits.length !== 15) {
      nextErrors.tax_number = t('vendor.settings.business.taxDigitsOnly');
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      toast.warning(Object.values(nextErrors)[0]);
      return;
    }

    try {
      await mutations.updateLegal.mutateAsync({
        entity_type: businessForm.entityType,
        commercial_registration_number: crDigits,
        tax_number: taxDigits || null,
      });

      const ibanValue = businessForm.iban.replace(/\s+/g, '').trim().toUpperCase();
      const existingBank = settings?.bank_account;
      const beneficiary = businessForm.beneficiaryName.trim();

      if (!beneficiary) {
        setFieldErrors({ beneficiary_name: t('vendor.settings.business.beneficiaryRequired') });
        toast.warning(t('vendor.settings.business.beneficiaryRequired'));
        return;
      }

      const bankChanged =
        !existingBank ||
        businessForm.bankCode !== existingBank.bank_code ||
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

        await mutations.updateBank.mutateAsync({
          bank_code: businessForm.bankCode,
          beneficiary_name: beneficiary,
          iban: ibanValue,
        });
        setBusinessForm((current) => ({ ...current, iban: '', ibanEditing: false }));
      }

      toast.success(t('vendor.settings.saveSuccess'));
    } catch (mutationError) {
      handleMutationError(mutationError);
    }
  };

  const handleSaveNotifications = async () => {
    setFieldErrors({});
    setLocale(notificationsForm.selectedLanguage);

    try {
      await mutations.updateProfile.mutateAsync({
        preferences: {
          ...mergeNotificationPreferences(profile?.preferences, {
            email: notificationsForm.emailNotifications,
          }),
          locale: notificationsForm.selectedLanguage,
        },
      });
      toast.success(t('vendor.settings.notifications.languageSaved'));
    } catch (mutationError) {
      handleMutationError(mutationError);
    }
  };

  return {
    handleMutationError,
    handleSaveStore,
    handleLogoUpload,
    handleLogoDelete,
    handleCoverUpload,
    handleCoverDelete,
    handleSaveBusiness,
    handleSaveNotifications,
  };
}
