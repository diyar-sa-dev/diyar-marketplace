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
    backdrop: false,
    heightAuto: false,
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
