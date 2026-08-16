import { describe, expect, it } from 'vitest';
import {
  sanitizeDecimalInput,
  sanitizeIntegerInput,
  validateImageFiles,
  validateVendorProductForm,
} from './vendorProductValidation.ts';

describe('validateVendorProductForm', () => {
  const base = {
    name: 'أريكة استرخاء',
    categoryId: 'cat-1',
    salePrice: '1250',
    comparePrice: '1600',
    stock: '10',
    stockAdjust: '',
    description: 'وصف تفصيلي للمنتج يشرح المواصفات',
    width: '220',
    height: '85',
    depth: '90',
    material: 'خشب',
    isEditing: false,
    imageCount: 0,
    pendingFileCount: 1,
  };

  it('passes valid create payload', () => {
    expect(validateVendorProductForm(base)).toEqual({});
  });

  it('requires name and price', () => {
    const errors = validateVendorProductForm({ ...base, name: '', salePrice: '' });
    expect(errors.name).toBeTruthy();
    expect(errors.salePrice).toBeTruthy();
  });

  it('rejects compare price lower than sale price', () => {
    const errors = validateVendorProductForm({ ...base, comparePrice: '1000' });
    expect(errors.comparePrice).toBe('comparePriceTooLow');
  });

  it('allows compare price equal to sale price', () => {
    const errors = validateVendorProductForm({ ...base, comparePrice: '1250', salePrice: '1250' });
    expect(errors.comparePrice).toBeUndefined();
  });

  it('requires at least one image on create', () => {
    const errors = validateVendorProductForm({ ...base, pendingFileCount: 0 });
    expect(errors.images).toBeTruthy();
  });

  it('requires stock quantity on edit', () => {
    const errors = validateVendorProductForm({
      ...base,
      isEditing: true,
      stockAdjust: '',
      pendingFileCount: 0,
      imageCount: 2,
    });
    expect(errors.stockAdjust).toBeTruthy();
  });
});

describe('sanitizeDecimalInput', () => {
  it('strips non-numeric characters', () => {
    expect(sanitizeDecimalInput('aa220.00')).toBe('220.00');
    expect(sanitizeDecimalInput('85aa.00')).toBe('85.00');
  });
});

describe('sanitizeIntegerInput', () => {
  it('keeps digits only', () => {
    expect(sanitizeIntegerInput('25abc')).toBe('25');
  });
});

describe('validateImageFiles', () => {
  it('rejects unsupported file types', () => {
    const file = new File(['x'], 'test.gif', { type: 'image/gif' });
    expect(validateImageFiles([file])).toBeTruthy();
  });
});
