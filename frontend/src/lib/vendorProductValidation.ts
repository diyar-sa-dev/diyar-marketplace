import type { TranslateFn } from './i18n/types.ts';

export type VendorProductFormErrorCode =
  | 'categoryRequired'
  | 'nameRequired'
  | 'nameTooShort'
  | 'salePriceRequired'
  | 'salePriceInvalid'
  | 'comparePriceInvalid'
  | 'comparePriceTooLow'
  | 'stockRequired'
  | 'stockInvalid'
  | 'stockAdjustRequired'
  | 'stockAdjustInvalid'
  | 'descriptionTooShort'
  | 'dimensionInvalid'
  | 'imagesRequired'
  | 'imagesInvalidType'
  | 'imagesTooLarge';

export type VendorProductFormErrors = Partial<
  Record<
    | 'name'
    | 'categoryId'
    | 'salePrice'
    | 'comparePrice'
    | 'stock'
    | 'stockAdjust'
    | 'description'
    | 'width'
    | 'height'
    | 'depth'
    | 'material'
    | 'images'
    | 'colors'
    | 'form',
    VendorProductFormErrorCode
  >
>;

export function translateVendorFormError(
  code: VendorProductFormErrorCode | undefined,
  t: TranslateFn,
): string | undefined {
  if (!code) {
    return undefined;
  }
  return t(`vendor.form.errors.${code}`);
}

export interface VendorProductFormValues {
  name: string;
  categoryId: string;
  salePrice: string;
  comparePrice: string;
  stock: string;
  stockAdjust: string;
  description: string;
  width: string;
  height: string;
  depth: string;
  material: string;
  isEditing: boolean;
  imageCount: number;
  pendingFileCount: number;
}

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

function parsePositiveNumber(value: string): number | null {
  if (!value.trim()) {
    return null;
  }
  if (!/^\d+(\.\d+)?$/.test(value.trim())) {
    return null;
  }
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    return null;
  }
  return num;
}

/** Keeps digits and at most one decimal point. */
export function sanitizeDecimalInput(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, '');
  const dotIndex = cleaned.indexOf('.');
  if (dotIndex === -1) {
    return cleaned;
  }
  const before = cleaned.slice(0, dotIndex + 1);
  const after = cleaned.slice(dotIndex + 1).replace(/\./g, '');
  return before + after;
}

/** Keeps digits only — for stock and integer fields. */
export function sanitizeIntegerInput(value: string): string {
  return value.replace(/\D/g, '');
}

export function validateVendorProductForm(
  values: VendorProductFormValues,
): VendorProductFormErrors {
  const errors: VendorProductFormErrors = {};

  if (!values.categoryId) {
    errors.categoryId = 'categoryRequired';
  }

  const name = values.name.trim();
  if (!name) {
    errors.name = 'nameRequired';
  } else if (name.length < 3) {
    errors.name = 'nameTooShort';
  }

  const sale = parsePositiveNumber(values.salePrice);
  if (values.salePrice.trim() === '') {
    errors.salePrice = 'salePriceRequired';
  } else if (sale === null || sale <= 0) {
    errors.salePrice = 'salePriceInvalid';
  }

  if (values.comparePrice.trim()) {
    const compare = parsePositiveNumber(values.comparePrice);
    if (compare === null || compare <= 0) {
      errors.comparePrice = 'comparePriceInvalid';
    } else if (sale !== null && compare < sale) {
      errors.comparePrice = 'comparePriceTooLow';
    }
  }

  if (!values.isEditing) {
    const stock = parsePositiveNumber(values.stock);
    if (values.stock.trim() === '') {
      errors.stock = 'stockRequired';
    } else if (stock === null || !Number.isInteger(stock)) {
      errors.stock = 'stockInvalid';
    }
    if (values.imageCount + values.pendingFileCount === 0) {
      errors.images = 'imagesRequired';
    }
  } else {
    if (values.stockAdjust.trim() === '') {
      errors.stockAdjust = 'stockAdjustRequired';
    } else {
      const adjust = parsePositiveNumber(values.stockAdjust);
      if (adjust === null || !Number.isInteger(adjust)) {
        errors.stockAdjust = 'stockAdjustInvalid';
      }
    }
  }

  const description = values.description.trim();
  if (description && description.length < 10) {
    errors.description = 'descriptionTooShort';
  }

  for (const [field, value] of [
    ['width', values.width],
    ['height', values.height],
    ['depth', values.depth],
  ] as const) {
    if (value.trim()) {
      const dim = parsePositiveNumber(value);
      if (dim === null || dim <= 0) {
        errors[field] = 'dimensionInvalid';
      }
    }
  }

  return errors;
}

export function validateImageFiles(files: File[]): VendorProductFormErrorCode | null {
  if (files.length === 0) {
    return null;
  }
  for (const file of files) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return 'imagesInvalidType';
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return 'imagesTooLarge';
    }
  }
  return null;
}

export function hasFormErrors(errors: VendorProductFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

export const vendorFieldClass = (hasError: boolean) =>
  `w-full rounded-xl border bg-white text-sm transition-all duration-200 focus:outline-none focus:ring-2 cursor-text ${
    hasError
      ? 'border-red-300 focus:border-red-400 focus:ring-red-100 bg-red-50/30'
      : 'border-gray-200 focus:border-diyar-brown focus:ring-diyar-brown/15 hover:border-gray-300'
  }`;

export const vendorButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

export const vendorActionButtonClass = (variant: 'view' | 'edit' | 'delete') => {
  const base =
    'inline-flex items-center justify-center rounded-lg p-2 transition-all duration-200 cursor-pointer border';
  if (variant === 'view') {
    return `${base} text-gray-500 border-transparent hover:text-diyar-brown hover:bg-amber-50 hover:border-amber-100`;
  }
  if (variant === 'edit') {
    return `${base} text-diyar-brown border-transparent hover:bg-diyar-brown/10 hover:border-diyar-brown/20`;
  }
  return `${base} text-red-500 border-transparent hover:bg-red-50 hover:border-red-100`;
};
