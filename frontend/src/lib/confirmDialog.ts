import Swal from 'sweetalert2';
import type { TranslateFn } from './i18n/types.ts';
import type { Locale } from './i18n/types.ts';
import { parseApiError, isValidationError } from '../utils/errors.ts';
import { translate } from './i18n/translate.ts';

const swalCustomClass = {
  popup: 'diyar-swal',
  title: 'text-diyar-dark font-bold',
  htmlContainer: 'text-gray-600 text-sm leading-relaxed',
  confirmButton: 'rounded-xl font-bold px-5 py-2.5 mx-1 cursor-pointer',
  cancelButton: 'rounded-xl font-bold px-5 py-2.5 mx-1 cursor-pointer',
  input: 'rounded-xl',
};

const modalOptions = {
  reverseButtons: true,
  focusCancel: true,
  buttonsStyling: true,
  customClass: swalCustomClass,
};

const toastOptions = {
  buttonsStyling: true,
  customClass: swalCustomClass,
};

export async function confirmArchiveProduct(
  t: TranslateFn,
  productName?: string,
): Promise<boolean> {
  const result = await Swal.fire({
    ...modalOptions,
    title: t('vendor.dialog.archiveTitle'),
    html: productName
      ? t('vendor.dialog.archiveBody', { name: productName })
      : t('vendor.dialog.archiveBodyGeneric'),
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: t('vendor.dialog.archiveConfirm'),
    cancelButtonText: t('vendor.dialog.archiveCancel'),
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
  });

  return result.isConfirmed;
}

export async function confirmDeleteImage(t: TranslateFn): Promise<boolean> {
  const result = await Swal.fire({
    ...modalOptions,
    title: t('vendor.dialog.deleteImageTitle'),
    text: t('vendor.dialog.deleteImageBody'),
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: t('vendor.dialog.deleteImageConfirm'),
    cancelButtonText: t('vendor.dialog.archiveCancel'),
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
  });

  return result.isConfirmed;
}

export async function showSuccessToast(t: TranslateFn, titleKey: string): Promise<void> {
  await Swal.fire({
    ...toastOptions,
    toast: true,
    position: 'top',
    title: t(titleKey),
    icon: 'success',
    timer: 2400,
    timerProgressBar: true,
    showConfirmButton: false,
    showCloseButton: true,
  });
}

export async function showErrorAlert(
  t: TranslateFn,
  titleKey: string,
  textKey?: string,
): Promise<void> {
  await Swal.fire({
    ...modalOptions,
    title: t(titleKey),
    text: textKey ? t(textKey) : undefined,
    icon: 'error',
    confirmButtonText: t('vendor.dialog.ok'),
    confirmButtonColor: '#947961',
  });
}

export async function showApiErrorAlert(
  t: TranslateFn,
  error: unknown,
  locale: Locale,
  fallbackTitleKey = 'vendor.dialog.saveError',
): Promise<void> {
  const parsed = parseApiError(error, locale);
  const unexpectedMessage = translate(locale, 'errors.unexpected');

  await Swal.fire({
    ...modalOptions,
    title: isValidationError(parsed) ? parsed.message : t(fallbackTitleKey),
    text: isValidationError(parsed)
      ? undefined
      : parsed.message !== unexpectedMessage
        ? parsed.message
        : t('vendor.dialog.saveErrorHint'),
    icon: 'error',
    confirmButtonText: t('vendor.dialog.ok'),
    confirmButtonColor: '#947961',
  });
}

export async function confirmClearWishlist(t: TranslateFn): Promise<boolean> {
  const result = await Swal.fire({
    ...modalOptions,
    title: t('profile.wishlistPage.clearTitle'),
    text: t('profile.wishlistPage.clearBody'),
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: t('profile.wishlistPage.clearConfirm'),
    cancelButtonText: t('profile.wishlistPage.clearCancel'),
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
  });

  return result.isConfirmed;
}

export async function confirmDeleteReview(t: TranslateFn): Promise<boolean> {
  const result = await Swal.fire({
    ...modalOptions,
    title: t('catalog.productDetail.deleteReviewTitle'),
    text: t('catalog.productDetail.deleteReviewBody'),
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: t('catalog.productDetail.deleteReviewConfirm'),
    cancelButtonText: t('catalog.productDetail.reviewCancel'),
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
  });

  return result.isConfirmed;
}

export async function confirmDeleteAllNotifications(t: TranslateFn): Promise<boolean> {
  const result = await Swal.fire({
    ...modalOptions,
    title: t('notifications.deleteAllTitle'),
    text: t('notifications.deleteAllConfirm'),
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: t('notifications.deleteAllConfirmButton'),
    cancelButtonText: t('common.cancel'),
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
  });

  return result.isConfirmed;
}

export async function confirmRemoveConversation(t: TranslateFn): Promise<boolean> {
  const result = await Swal.fire({
    ...modalOptions,
    title: t('chat.removeConversationTitle'),
    text: t('chat.removeConversationConfirm'),
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: t('chat.removeConversationAction'),
    cancelButtonText: t('common.cancel'),
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
  });

  return result.isConfirmed;
}

export async function confirmSuspendUser(t: TranslateFn, userName?: string): Promise<boolean> {
  const result = await Swal.fire({
    ...modalOptions,
    title: t('admin.users.suspend'),
    text: userName
      ? t('admin.users.suspendConfirmNamed', { name: userName })
      : t('admin.users.suspendConfirm'),
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: t('admin.users.suspend'),
    cancelButtonText: t('common.cancel'),
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
  });

  return result.isConfirmed;
}

export async function confirmSuspendVendor(t: TranslateFn, storeName?: string): Promise<boolean> {
  const result = await Swal.fire({
    ...modalOptions,
    title: t('admin.detail.vendor.suspend'),
    text: storeName
      ? t('admin.detail.vendor.suspendConfirmNamed', { name: storeName })
      : t('admin.detail.vendor.suspendConfirm'),
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: t('admin.detail.vendor.suspend'),
    cancelButtonText: t('common.cancel'),
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
  });

  return result.isConfirmed;
}

export async function confirmSuspendProvider(
  t: TranslateFn,
  providerName?: string,
): Promise<boolean> {
  const result = await Swal.fire({
    ...modalOptions,
    title: t('admin.detail.provider.suspend'),
    text: providerName
      ? t('admin.detail.provider.suspendConfirmNamed', { name: providerName })
      : t('admin.detail.provider.suspendConfirm'),
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: t('admin.detail.provider.suspend'),
    cancelButtonText: t('common.cancel'),
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
  });

  return result.isConfirmed;
}

export async function confirmActivateUser(t: TranslateFn, userName?: string): Promise<boolean> {
  const result = await Swal.fire({
    ...modalOptions,
    title: t('admin.users.activate'),
    text: userName
      ? t('admin.users.activateConfirmNamed', { name: userName })
      : t('admin.users.activateConfirm'),
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: t('admin.users.activate'),
    cancelButtonText: t('common.cancel'),
    confirmButtonColor: '#16a34a',
    cancelButtonColor: '#6b7280',
  });

  return result.isConfirmed;
}

export async function confirmRejectPayout(t: TranslateFn): Promise<string | null> {
  const result = await Swal.fire({
    ...modalOptions,
    title: t('admin.payouts.rejectTitle'),
    text: t('admin.payouts.rejectBody'),
    input: 'textarea',
    inputPlaceholder: t('admin.payouts.rejectReasonPlaceholder'),
    inputAttributes: { 'aria-label': t('admin.payouts.rejectReasonPlaceholder') },
    inputValidator: (value) => {
      if (!value?.trim()) {
        return t('admin.payouts.rejectReasonRequired');
      }
      return null;
    },
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: t('admin.payouts.reject'),
    cancelButtonText: t('common.cancel'),
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
  });

  return result.isConfirmed ? (result.value?.trim() ?? null) : null;
}

export async function confirmDeleteCategory(
  t: TranslateFn,
  categoryName?: string,
): Promise<boolean> {
  const result = await Swal.fire({
    ...modalOptions,
    title: t('admin.categories.deleteTitle'),
    text: categoryName
      ? t('admin.categories.deleteConfirmNamed', { name: categoryName })
      : t('admin.categories.deleteConfirm'),
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: t('admin.categories.deleteAction'),
    cancelButtonText: t('common.cancel'),
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
  });

  return result.isConfirmed;
}

export async function confirmDeleteBlogArticle(
  t: TranslateFn,
  articleTitle?: string,
): Promise<boolean> {
  const result = await Swal.fire({
    ...modalOptions,
    title: t('admin.blogArticles.deleteTitle'),
    text: articleTitle
      ? t('admin.blogArticles.deleteConfirmNamed', { name: articleTitle })
      : t('admin.blogArticles.deleteConfirm'),
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: t('admin.blogArticles.deleteAction'),
    cancelButtonText: t('common.cancel'),
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
  });

  return result.isConfirmed;
}

export async function confirmDeleteProject(
  t: TranslateFn,
  projectTitle?: string,
): Promise<boolean> {
  const result = await Swal.fire({
    ...modalOptions,
    title: t('admin.projects.deleteTitle'),
    text: projectTitle
      ? t('admin.projects.deleteConfirmNamed', { name: projectTitle })
      : t('admin.projects.deleteConfirm'),
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: t('admin.projects.deleteAction'),
    cancelButtonText: t('common.cancel'),
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
  });

  return result.isConfirmed;
}

export async function showShareLinkDialog(t: TranslateFn, url: string): Promise<boolean> {
  const result = await Swal.fire({
    ...modalOptions,
    title: t('catalog.productDetail.share'),
    input: 'text',
    inputValue: url,
    inputAttributes: { readonly: 'readonly', dir: 'ltr' },
    confirmButtonText: t('catalog.productDetail.shareCopy'),
    confirmButtonColor: '#947961',
    showCancelButton: true,
    cancelButtonText: t('catalog.productDetail.reviewCancel'),
    cancelButtonColor: '#6b7280',
    preConfirm: async () => {
      try {
        await navigator.clipboard.writeText(url);
        return true;
      } catch {
        Swal.showValidationMessage(t('catalog.productDetail.shareCopyFailed'));
        return false;
      }
    },
  });

  return result.isConfirmed;
}

export async function confirmLoyaltyAdjustment(
  t: TranslateFn,
  options: {
    direction: 'credit' | 'debit';
    points: number;
    currentBalance: number;
  },
): Promise<boolean> {
  const body =
    options.direction === 'credit'
      ? t('admin.loyalty.confirmAdjustBodyCredit', { points: options.points })
      : t('admin.loyalty.confirmAdjustBodyDebit', {
          points: options.points,
          balance: Math.max(0, options.currentBalance - options.points),
        });

  const result = await Swal.fire({
    ...modalOptions,
    title: t('admin.loyalty.confirmAdjustTitle'),
    text: body,
    icon: options.direction === 'debit' ? 'warning' : 'question',
    showCancelButton: true,
    confirmButtonText: t('admin.loyalty.confirmAdjustConfirm'),
    cancelButtonText: t('admin.loyalty.confirmAdjustCancel'),
    confirmButtonColor: options.direction === 'debit' ? '#ef4444' : '#111827',
    cancelButtonColor: '#6b7280',
  });

  return result.isConfirmed;
}
