import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, X, Upload, Check, Loader2 } from 'lucide-react';
import type { Category, ProductImage } from '../../../types/catalog.ts';
import type { ProductDetail } from '../../../types/catalog.ts';
import type { VendorProductPayload } from '../../../api/vendorDashboard.ts';
import type { ReturnReason } from '../../../types/return.ts';
import { resolveMediaUrl } from '../../../lib/media.ts';
import { LoadingState } from '../../common/LoadingState.tsx';
import { FieldError } from './FieldError.tsx';
import { RequiredLabel } from './RequiredLabel.tsx';
import { useLocale } from '../../../hooks/useLocale.ts';
import {
  hasFormErrors,
  sanitizeDecimalInput,
  sanitizeIntegerInput,
  translateVendorFormError,
  validateImageFiles,
  validateVendorProductForm,
  vendorButtonClass,
  vendorFieldClass,
  type VendorProductFormErrors,
} from '../../../lib/vendorProductValidation.ts';

const WARRANTY_OPTIONS = [
  { value: 'بدون ضمان', labelKey: 'vendor.form.warrantyOptions.none' },
  { value: 'سنة واحدة', labelKey: 'vendor.form.warrantyOptions.oneYear' },
  { value: 'سنتين', labelKey: 'vendor.form.warrantyOptions.twoYears' },
  { value: '3 سنوات', labelKey: 'vendor.form.warrantyOptions.threeYears' },
  { value: '5 سنوات', labelKey: 'vendor.form.warrantyOptions.fiveYears' },
] as const;

const RETURN_REASONS: ReturnReason[] = [
  'manufacturing_defect',
  'damaged',
  'wrong_item',
  'not_as_described',
  'other',
];

const COLOR_HEX: Record<string, string> = {
  أبيض: '#FFFFFF',
  كريمي: '#FFFDD0',
  بيج: '#F5F5DC',
  رمادي: '#9CA3AF',
  أسود: '#111827',
  بني: '#8B4513',
  ذهبي: '#FFD700',
  أزرق: '#2563EB',
  أخضر: '#16A34A',
};

const PRESET_COLOR_NAMES = Object.keys(COLOR_HEX);

function hexForColorName(name: string): string {
  return COLOR_HEX[name] ?? '#9CA3AF';
}

function materialsToString(materials: ProductDetail['materials']): string {
  if (!materials) {
    return '';
  }
  if (Array.isArray(materials)) {
    return materials.join('، ');
  }
  return Object.values(materials).join('، ');
}

export interface VendorProductFormSubmit {
  payload: VendorProductPayload;
  stockAdjust?: number;
  images: File[];
}

interface VendorProductFormModalProps {
  open: boolean;
  editingId: string | null;
  categories: Category[];
  productDetail?: ProductDetail;
  detailLoading: boolean;
  isSaving: boolean;
  uploadProgress: number | null;
  uploadComplete: boolean;
  deletingImageId: string | null;
  onClose: () => void;
  onSubmit: (data: VendorProductFormSubmit) => Promise<void>;
  onDeleteExistingImage?: (imageId: string) => Promise<void>;
}

type PendingImage = {
  id: string;
  file: File;
  preview: string;
};

const MAX_IMAGES = 5;

export function VendorProductFormModal({
  open,
  editingId,
  categories,
  productDetail,
  detailLoading,
  isSaving,
  uploadProgress,
  uploadComplete,
  deletingImageId,
  onClose,
  onSubmit,
  onDeleteExistingImage,
}: VendorProductFormModalProps) {
  const { t, dir } = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customColorText, setCustomColorText] = useState('');
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);

  const [categoryId, setCategoryId] = useState('');
  const [name, setName] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [stock, setStock] = useState('10');
  const [stockAdjust, setStockAdjust] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [depth, setDepth] = useState('');
  const [material, setMaterial] = useState('');
  const [warranty, setWarranty] = useState('سنتين');
  const [description, setDescription] = useState('');
  const [colors, setColors] = useState<Array<{ name: string; hex_code: string }>>([]);
  const [errors, setErrors] = useState<VendorProductFormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [returnPolicyCustom, setReturnPolicyCustom] = useState(false);
  const [returnable, setReturnable] = useState(true);
  const [returnWindowDays, setReturnWindowDays] = useState('7');
  const [returnReasons, setReturnReasons] = useState<ReturnReason[]>(['manufacturing_defect']);
  const [returnRequiresEvidence, setReturnRequiresEvidence] = useState(false);
  const [returnShippingRefundable, setReturnShippingRefundable] = useState(false);

  const existingImages: ProductImage[] = useMemo(
    () => productDetail?.images ?? [],
    [productDetail?.images],
  );

  const totalImageCount = existingImages.length + pendingImages.length;
  const canAddMoreImages = totalImageCount < MAX_IMAGES;

  useEffect(() => {
    return () => {
      pendingImages.forEach((item) => URL.revokeObjectURL(item.preview));
    };
  }, []);

  const addPendingFiles = (files: File[]) => {
    const fileError = validateImageFiles(files);
    if (fileError) {
      setErrors((prev) => ({ ...prev, images: fileError }));
      return;
    }
    if (!canAddMoreImages) {
      return;
    }
    const remaining = MAX_IMAGES - totalImageCount;
    const nextFiles = files.slice(0, remaining);
    setPendingImages((current) => [
      ...current,
      ...nextFiles.map((file) => ({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
      })),
    ]);
    setErrors((prev) => ({ ...prev, images: undefined }));
  };

  const removePendingImage = (id: string) => {
    setPendingImages((current) => {
      const target = current.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.preview);
      }
      return current.filter((item) => item.id !== id);
    });
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    if (editingId && productDetail) {
      setCategoryId(productDetail.category?.id ?? categories[0]?.id ?? '');
      setName(productDetail.name);
      setSalePrice(sanitizeDecimalInput(String(productDetail.sale_price)));
      setComparePrice(
        productDetail.compare_price
          ? sanitizeDecimalInput(String(productDetail.compare_price))
          : '',
      );
      setStock(sanitizeIntegerInput(String(productDetail.inventory?.stock_quantity ?? 0)));
      setStockAdjust(
        sanitizeIntegerInput(String(productDetail.inventory?.stock_quantity ?? 0)),
      );
      setWidth(
        productDetail.dimensions?.width != null
          ? sanitizeDecimalInput(String(productDetail.dimensions.width))
          : '',
      );
      setHeight(
        productDetail.dimensions?.height != null
          ? sanitizeDecimalInput(String(productDetail.dimensions.height))
          : '',
      );
      setDepth(
        productDetail.dimensions?.depth != null
          ? sanitizeDecimalInput(String(productDetail.dimensions.depth))
          : '',
      );
      setMaterial(materialsToString(productDetail.materials));
      setWarranty(productDetail.warranty || 'سنتين');
      setDescription(productDetail.description || '');
      setColors(productDetail.colors?.map((c) => ({ name: c.name, hex_code: c.hex_code })) ?? []);
      const rp = productDetail.return_policy;
      setReturnPolicyCustom(Boolean(rp?.override_enabled));
      setReturnable(rp?.returnable ?? true);
      setReturnWindowDays(String(rp?.return_window_days ?? 7));
      setReturnReasons((rp?.return_accepted_reasons as ReturnReason[] | null) ?? ['manufacturing_defect']);
      setReturnRequiresEvidence(Boolean(rp?.return_requires_evidence));
      setReturnShippingRefundable(Boolean(rp?.return_shipping_refundable));
      setErrors({});
      setTouched({});
      setPendingImages((current) => {
        current.forEach((item) => URL.revokeObjectURL(item.preview));
        return [];
      });
      setCustomColorText('');
      return;
    }

    if (!editingId) {
      setCategoryId(categories[0]?.id ?? '');
      setName('');
      setSalePrice('');
      setComparePrice('');
      setStock('10');
      setStockAdjust('');
      setWidth('');
      setHeight('');
      setDepth('');
      setMaterial('');
      setWarranty('سنتين');
      setDescription('');
      setColors([]);
      setErrors({});
      setTouched({});
      setPendingImages((current) => {
        current.forEach((item) => URL.revokeObjectURL(item.preview));
        return [];
      });
      setCustomColorText('');
    }
  }, [open, editingId, productDetail, categories]);

  if (!open) {
    return null;
  }

  const addColor = (colorName: string) => {
    const trimmed = colorName.trim();
    if (!trimmed || colors.some((c) => c.name === trimmed)) {
      return;
    }
    setColors([...colors, { name: trimmed, hex_code: hexForColorName(trimmed) }]);
  };

  const runValidation = (): VendorProductFormErrors =>
    validateVendorProductForm({
      name,
      categoryId,
      salePrice,
      comparePrice,
      stock,
      stockAdjust,
      description,
      width,
      height,
      depth,
      material,
      isEditing: Boolean(editingId),
      imageCount: existingImages.length,
      pendingFileCount: pendingImages.length,
    });

  const showError = (field: keyof VendorProductFormErrors) => {
    const code = touched[field] || touched.form ? errors[field] : undefined;
    return translateVendorFormError(code, t);
  };

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const clearFieldError = (field: keyof VendorProductFormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ form: true });
    const nextErrors = runValidation();
    setErrors(nextErrors);
    if (hasFormErrors(nextErrors)) {
      return;
    }

    const payload: VendorProductPayload = {
      category_id: categoryId,
      name: name.trim(),
      description: description.trim() || null,
      sale_price: Number(salePrice),
      compare_price: comparePrice ? Number(comparePrice) : null,
      stock_quantity: editingId ? 0 : Number(stock || 0),
      width: width ? Number(width) : null,
      height: height ? Number(height) : null,
      depth: depth ? Number(depth) : null,
      materials: material.trim() ? [material.trim()] : null,
      warranty: warranty || null,
      colors,
      ...(editingId
        ? {
            return_policy_override_enabled: returnPolicyCustom,
            ...(returnPolicyCustom
              ? {
                  returnable,
                  return_window_days: Number(returnWindowDays || 0),
                  return_accepted_reasons: returnReasons,
                  return_requires_evidence: returnRequiresEvidence,
                  return_shipping_refundable: returnShippingRefundable,
                }
              : {}),
          }
        : {}),
    };

    await onSubmit({
      payload,
      stockAdjust: editingId ? Number(stockAdjust) : stockAdjust.trim() ? Number(stockAdjust) : undefined,
      images: pendingImages.map((item) => item.file),
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-300 flex items-center justify-center p-4 animate-in fade-in duration-300"
      dir={dir}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="text-right flex-1 select-none pr-1">
            <h3 className="font-bold text-xl text-diyar-dark flex items-center gap-2">
              <span className="p-2 bg-diyar-brown/10 text-diyar-brown rounded-xl">
                <Plus size={18} />
              </span>
              {editingId ? t('vendor.form.editTitle') : t('vendor.form.createTitle')}
            </h3>
            <p className="text-gray-400 text-xs mt-0.5 font-sans">{t('vendor.form.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`${vendorButtonClass} text-gray-400 hover:bg-gray-100 hover:text-diyar-dark p-2.5`}
          >
            <X size={20} />
          </button>
        </div>

        {editingId && detailLoading ? (
          <LoadingState className="min-h-80" />
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8">
            {touched.form && hasFormErrors(errors) && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700 font-medium text-right">
                {t('vendor.form.fixErrors')}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 space-y-6 text-right">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 block">
                    {t('vendor.form.images.label')}
                  </label>

                  {(existingImages.length > 0 || pendingImages.length > 0) && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {existingImages.map((image) => {
                        const url = resolveMediaUrl(image.url);
                        return (
                          <div
                            key={image.id}
                            className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50 group"
                          >
                            {url ? (
                              <img src={url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <Upload size={20} />
                              </div>
                            )}
                            {onDeleteExistingImage && (
                              <button
                                type="button"
                                disabled={deletingImageId === image.id || isSaving}
                                onClick={() => onDeleteExistingImage(image.id)}
                                className="absolute top-1 left-1 cursor-pointer w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-90 hover:opacity-100 disabled:opacity-50"
                                aria-label="حذف الصورة"
                              >
                                {deletingImageId === image.id ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <X size={12} />
                                )}
                              </button>
                            )}
                            <span className="absolute bottom-1 right-1 text-[9px] bg-black/50 text-white px-1.5 py-0.5 rounded">
                            {t('vendor.form.images.saved')}
                            </span>
                          </div>
                        );
                      })}

                      {pendingImages.map((item) => (
                        <div
                          key={item.id}
                          className="relative aspect-square rounded-xl overflow-hidden border border-diyar-brown/30 bg-gray-50 group"
                        >
                          <img src={item.preview} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => removePendingImage(item.id)}
                            className="absolute top-1 left-1 cursor-pointer w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-90 hover:opacity-100 disabled:opacity-50"
                            aria-label="إزالة الصورة"
                          >
                            <X size={12} />
                          </button>
                          <span className="absolute bottom-1 right-1 text-[9px] bg-diyar-brown text-white px-1.5 py-0.5 rounded">
                            {t('vendor.form.images.pending')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {canAddMoreImages ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSaving}
                      className={`w-full h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-gray-400 bg-gray-50 hover:bg-diyar-brown/5 transition-colors p-4 group disabled:opacity-60 ${vendorButtonClass} ${
                        showError('images')
                          ? 'border-red-300 bg-red-50/30'
                          : 'border-gray-200 hover:border-diyar-brown/50'
                      }`}
                    >
                      <div className="p-2 bg-white rounded-xl shadow-sm text-diyar-brown group-hover:scale-110 transition">
                        <Upload size={20} className="mx-auto" />
                      </div>
                      <span className="text-sm font-bold text-diyar-dark mt-2">
                        {t('vendor.form.images.upload')}
                      </span>
                      <span className="text-xs text-gray-450 mt-1 font-sans">
                        {t('vendor.form.images.formats', { count: totalImageCount, max: MAX_IMAGES })}
                      </span>
                    </button>
                  ) : (
                    <div className="rounded-xl border border-green-200 bg-green-50/60 px-4 py-3 text-xs font-bold text-green-800 text-right">
                      {t('vendor.form.images.maxReached', { max: MAX_IMAGES })}
                    </div>
                  )}

                  {isSaving && uploadProgress !== null && (
                    <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-diyar-dark">
                        <span>{t('vendor.form.images.uploading')}</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white overflow-hidden border border-amber-100">
                        <div
                          className="h-full bg-diyar-brown transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {uploadComplete && !isSaving && (
                    <div className="flex items-center gap-2 text-xs font-bold text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                      <Check size={14} />
                      {t('vendor.form.images.uploadSuccess')}
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      addPendingFiles(Array.from(e.target.files ?? []));
                      e.target.value = '';
                    }}
                  />
                  <FieldError message={showError('images')} />
                </div>

                <div className="bg-gray-50/60 p-4 rounded-2xl border border-gray-100 space-y-4 text-right">
                  <h4 className="text-xs font-bold text-gray-500 pb-2 border-b border-gray-100 text-right">
                    {t('vendor.form.categorySection')} <span className="text-red-500">*</span>
                  </h4>
                  <div className="space-y-1.5">
                    <RequiredLabel required className="text-xs font-bold text-gray-600 pb-1">
                      {t('vendor.form.mainCategory')}
                    </RequiredLabel>
                    <select
                      value={categoryId}
                      onChange={(e) => {
                        setCategoryId(e.target.value);
                        clearFieldError('categoryId');
                      }}
                      onBlur={() => markTouched('categoryId')}
                      className={`${vendorFieldClass(Boolean(showError('categoryId')))} p-2.5 cursor-pointer`}
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <FieldError message={showError('categoryId')} />
                  </div>
                </div>

                <div className="space-y-3 text-right">
                  <label className="text-xs font-bold text-gray-400 block text-right">
                    {t('vendor.form.colors.label')}
                  </label>
                  <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-150 justify-start">
                    {colors.length === 0 ? (
                      <span className="text-xs text-gray-400 italic font-sans">
                        {t('vendor.form.colors.empty')}
                      </span>
                    ) : (
                      colors.map((color) => (
                        <span
                          key={color.name}
                          className="bg-diyar-brown text-white pl-2 pr-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                        >
                          {color.name}
                          <button
                            type="button"
                            onClick={() => setColors(colors.filter((c) => c.name !== color.name))}
                            className="hover:bg-white/20 p-0.5 rounded-full transition cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-650 block text-right mb-1">
                      {t('vendor.form.colors.customLabel')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customColorText}
                        onChange={(e) => setCustomColorText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addColor(customColorText);
                            setCustomColorText('');
                          }
                        }}
                        placeholder={t('vendor.form.colors.customPlaceholder')}
                        className="flex-1 p-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-diyar-brown text-xs text-right font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          addColor(customColorText);
                          setCustomColorText('');
                        }}
                        className="bg-diyar-brown hover:bg-[#A67B5B]/90 text-white font-bold h-9.5 px-4 rounded-xl leading-snug transition text-xs font-sans shrink-0 border border-transparent shadow-sm flex items-center justify-center cursor-pointer"
                      >
                        {t('vendor.form.colors.add')}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-gray-400 block text-right mt-1">
                      {t('vendor.form.colors.suggestions')}
                    </span>
                    <div className="flex flex-wrap gap-1.5 justify-start">
                      {PRESET_COLOR_NAMES.filter((col) => !colors.some((c) => c.name === col)).map(
                        (color) => (
                          <button
                            type="button"
                            key={color}
                            onClick={() => addColor(color)}
                            className="bg-white text-gray-600 border border-gray-200 hover:border-diyar-brown text-xs py-1 px-2.5 rounded-lg transition-colors flex items-center gap-1 font-medium font-sans cursor-pointer"
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                color === 'أبيض'
                                  ? 'bg-white border border-gray-300'
                                  : color === 'رمادي'
                                    ? 'bg-gray-400'
                                    : color === 'أسود'
                                      ? 'bg-black'
                                      : color === 'بيج'
                                        ? 'bg-[#F5F5DC] border'
                                        : color === 'بني'
                                          ? 'bg-[#8B4513]'
                                          : color === 'ذهبي'
                                            ? 'bg-[#FFD700]'
                                            : color === 'أزرق'
                                              ? 'bg-blue-600'
                                              : color === 'أخضر'
                                                ? 'bg-green-600'
                                                : 'bg-stone-400'
                              }`}
                            />
                            {color}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-6 text-right">
                <div className="space-y-4 text-right">
                  <div className="space-y-1.5 text-right">
                    <RequiredLabel required className="text-sm font-bold text-gray-700">
                      {t('vendor.form.name')}
                    </RequiredLabel>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        clearFieldError('name');
                      }}
                      onBlur={() => markTouched('name')}
                      placeholder={t('vendor.form.namePlaceholder')}
                      className={`${vendorFieldClass(Boolean(showError('name')))} p-3 font-medium text-right`}
                    />
                    <FieldError message={showError('name')} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-right">
                    <div className="space-y-1.5 text-right">
                      <RequiredLabel required className="text-xs font-bold text-gray-700">
                        {t('vendor.form.salePrice')}
                      </RequiredLabel>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={salePrice}
                        onChange={(e) => {
                          setSalePrice(sanitizeDecimalInput(e.target.value));
                          clearFieldError('salePrice');
                        }}
                        onBlur={() => markTouched('salePrice')}
                        placeholder="مثال: 1250"
                        className={`${vendorFieldClass(Boolean(showError('salePrice')))} p-2.5 font-bold text-diyar-brown text-right`}
                      />
                      <FieldError message={showError('salePrice')} />
                    </div>
                    <div className="space-y-1.5 text-right">
                      <label className="text-xs font-bold text-gray-550 block text-right">
                        {t('vendor.form.comparePrice')}
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={comparePrice}
                        onChange={(e) => {
                          setComparePrice(sanitizeDecimalInput(e.target.value));
                          clearFieldError('comparePrice');
                        }}
                        onBlur={() => markTouched('comparePrice')}
                        placeholder="مثال: 1600"
                        className={`${vendorFieldClass(Boolean(showError('comparePrice')))} p-2.5 font-medium text-gray-600 text-right`}
                      />
                      <FieldError message={showError('comparePrice')} />
                    </div>
                    <div className="space-y-1.5 text-right">
                      {editingId ? (
                        <>
                          <RequiredLabel required className="text-xs font-bold text-gray-700">
                            {t('vendor.form.adjustStock')}
                          </RequiredLabel>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={stockAdjust}
                            onChange={(e) => {
                              setStockAdjust(sanitizeIntegerInput(e.target.value));
                              clearFieldError('stockAdjust');
                            }}
                            onBlur={() => markTouched('stockAdjust')}
                            placeholder={stock}
                            className={`${vendorFieldClass(Boolean(showError('stockAdjust')))} p-2.5 font-bold text-right`}
                          />
                          <FieldError message={showError('stockAdjust')} />
                        </>
                      ) : (
                        <>
                          <RequiredLabel required className="text-xs font-bold text-gray-700">
                            {t('vendor.form.initialStock')}
                          </RequiredLabel>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={stock}
                            onChange={(e) => {
                              setStock(sanitizeIntegerInput(e.target.value));
                              clearFieldError('stock');
                            }}
                            onBlur={() => markTouched('stock')}
                            placeholder="10"
                            className={`${vendorFieldClass(Boolean(showError('stock')))} p-2.5 font-bold text-right`}
                          />
                          <FieldError message={showError('stock')} />
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-stone-50/50 rounded-2xl border border-stone-150 space-y-4 text-right">
                  <h4 className="text-xs font-bold text-stone-600 block border-b border-stone-100 pb-2 text-right">
                    {t('vendor.form.specsTitle')}
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1 text-center font-sans">
                      <label className="text-xs text-stone-500 block mb-1">{t('vendor.form.width')}</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={width}
                        onChange={(e) => {
                          setWidth(sanitizeDecimalInput(e.target.value));
                          clearFieldError('width');
                        }}
                        onBlur={() => markTouched('width')}
                        placeholder="مثال: 220"
                        className={`${vendorFieldClass(Boolean(showError('width')))} p-2 text-xs text-center font-bold`}
                      />
                      <FieldError message={showError('width')} />
                    </div>
                    <div className="space-y-1 text-center font-sans">
                      <label className="text-xs text-stone-500 block mb-1">{t('vendor.form.depth')}</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={depth}
                        onChange={(e) => {
                          setDepth(sanitizeDecimalInput(e.target.value));
                          clearFieldError('depth');
                        }}
                        onBlur={() => markTouched('depth')}
                        placeholder="مثال: 90"
                        className={`${vendorFieldClass(Boolean(showError('depth')))} p-2 text-xs text-center font-bold`}
                      />
                      <FieldError message={showError('depth')} />
                    </div>
                    <div className="space-y-1 text-center font-sans">
                      <label className="text-xs text-stone-500 block mb-1">{t('vendor.form.height')}</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={height}
                        onChange={(e) => {
                          setHeight(sanitizeDecimalInput(e.target.value));
                          clearFieldError('height');
                        }}
                        onBlur={() => markTouched('height')}
                        placeholder="مثال: 85"
                        className={`${vendorFieldClass(Boolean(showError('height')))} p-2 text-xs text-center font-bold`}
                      />
                      <FieldError message={showError('height')} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 text-right">
                    <div className="space-y-1.5 text-right">
                      <label className="text-xs font-bold text-gray-600 block text-right pb-1">
                        {t('vendor.form.material')}
                      </label>
                      <input
                        type="text"
                        value={material}
                        onChange={(e) => setMaterial(e.target.value)}
                        placeholder={t('vendor.form.materialPlaceholder')}
                        className={`${vendorFieldClass(false)} p-2.5 text-xs text-right font-medium`}
                      />
                    </div>
                    <div className="space-y-1.5 text-right">
                      <label className="text-xs font-bold text-gray-600 block text-right pb-1">
                        {t('vendor.form.warranty')}
                      </label>
                      <select
                        value={warranty}
                        onChange={(e) => setWarranty(e.target.value)}
                        className={`${vendorFieldClass(false)} p-2.5 text-xs font-bold text-stone-700 cursor-pointer`}
                      >
                        {WARRANTY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {t(option.labelKey)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {editingId && (
                  <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-4 text-right">
                    <h4 className="text-xs font-bold text-amber-900 block border-b border-amber-100 pb-2">
                      {t('returns.productPolicyTitle')}
                    </h4>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={!returnPolicyCustom}
                          onChange={() => setReturnPolicyCustom(false)}
                        />
                        {t('returns.productPolicyUseStore')}
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={returnPolicyCustom}
                          onChange={() => setReturnPolicyCustom(true)}
                        />
                        {t('returns.productPolicyCustom')}
                      </label>
                    </div>
                    {returnPolicyCustom && (
                      <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-bold">
                          <input
                            type="checkbox"
                            checked={returnable}
                            onChange={(e) => setReturnable(e.target.checked)}
                          />
                          {t('returns.policyReturnable')}
                        </label>
                        <div>
                          <label className="text-xs font-bold text-gray-600">{t('returns.policyWindowDays')}</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={returnWindowDays}
                            onChange={(e) => setReturnWindowDays(sanitizeIntegerInput(e.target.value))}
                            className={`${vendorFieldClass(false)} mt-1 p-2 text-sm`}
                          />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-600 mb-2">{t('returns.policyAcceptedReasons')}</p>
                          <div className="flex flex-wrap gap-2">
                            {RETURN_REASONS.map((reason) => (
                              <label key={reason} className="flex items-center gap-1 text-xs">
                                <input
                                  type="checkbox"
                                  checked={returnReasons.includes(reason)}
                                  onChange={(e) => {
                                    setReturnReasons((prev) =>
                                      e.target.checked
                                        ? [...prev, reason]
                                        : prev.filter((r) => r !== reason),
                                    );
                                  }}
                                />
                                {t(`returns.reason.${reason}` as 'returns.reason.damaged')}
                              </label>
                            ))}
                          </div>
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={returnRequiresEvidence}
                            onChange={(e) => setReturnRequiresEvidence(e.target.checked)}
                          />
                          {t('returns.policyRequiresEvidence')}
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={returnShippingRefundable}
                            onChange={(e) => setReturnShippingRefundable(e.target.checked)}
                          />
                          {t('returns.policyShippingRefundable')}
                        </label>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1.5 text-right font-sans">
                  <label className="text-sm font-bold text-gray-700 block text-right">
                    {t('vendor.form.description')}
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      clearFieldError('description');
                    }}
                    onBlur={() => markTouched('description')}
                    placeholder={t('vendor.form.descriptionPlaceholder')}
                    className={`${vendorFieldClass(Boolean(showError('description')))} p-3 text-sm text-right resize-y min-h-25`}
                  />
                  <FieldError message={showError('description')} />
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-150 flex items-center justify-end gap-3 text-right">
              <button
                type="button"
                onClick={onClose}
                className={`${vendorButtonClass} px-6 py-3 text-sm text-gray-500 hover:text-diyar-dark hover:bg-gray-50 border border-transparent hover:border-gray-200`}
              >
                {t('vendor.form.cancel')}
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className={`${vendorButtonClass} px-8 py-3 text-sm bg-diyar-brown hover:bg-[#A67B5B]/90 text-white shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] font-sans`}
              >
                {isSaving ? t('vendor.form.saving') : t('vendor.form.submit')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
