import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus,
  X,
  Upload,
  Check,
  Loader2,
  Box,
  Trash2,
  FileText,
  Image as ImageIcon,
  Ruler,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { Category, ProductImage } from '../../../types/catalog.ts';
import type { ProductDetail } from '../../../types/catalog.ts';
import type { VendorProductPayload } from '../../../api/vendorDashboard.ts';
import type { ReturnReason } from '../../../types/return.ts';
import { resolveMediaUrl } from '../../../lib/media.ts';
import { LoadingState } from '../../common/LoadingState.tsx';
import { VendorProductAffiliateSection } from './VendorProductAffiliateSection.tsx';
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
  model3d?: File | null;
  removeModel3d?: boolean;
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
  const [promotionEndsAt, setPromotionEndsAt] = useState('');
  const [stock, setStock] = useState('10');
  const [stockAdjust, setStockAdjust] = useState('');
  const [preorderEnabled, setPreorderEnabled] = useState(false);
  const [expectedAvailableAt, setExpectedAvailableAt] = useState('');
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

  const [pendingModel3d, setPendingModel3d] = useState<File | null>(null);
  const [removeExistingModel3d, setRemoveExistingModel3d] = useState(false);
  const [model3dError, setModel3dError] = useState<string | null>(null);
  const [isDragging3d, setIsDragging3d] = useState(false);
  const [mobileTab, setMobileTab] = useState<'info' | 'media' | 'specs' | 'all'>('info');
  const model3dInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetModel3d = (file: File) => {
    setModel3dError(null);
    const maxBytes = 25 * 1024 * 1024; // 25 MB
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['glb', 'gltf'].includes(ext)) {
      setModel3dError('صيغة الملف غير مدعومة. يرجى اختيار ملف ثلاثي الأبعاد بصيغة GLB أو GLTF');
      return;
    }
    if (file.size > maxBytes) {
      setModel3dError('حجم الملف يتجاوز الحد المسموح به (25 ميجابايت)');
      return;
    }
    setPendingModel3d(file);
    setRemoveExistingModel3d(false);
  };

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
      setPromotionEndsAt(
        productDetail.promotion_ends_at ? productDetail.promotion_ends_at.slice(0, 16) : '',
      );
      setStock(sanitizeIntegerInput(String(productDetail.inventory?.stock_quantity ?? 0)));
      setStockAdjust(sanitizeIntegerInput(String(productDetail.inventory?.stock_quantity ?? 0)));
      setPreorderEnabled(productDetail.availability_mode === 'preorder');
      setExpectedAvailableAt(productDetail.expected_available_at?.slice(0, 10) ?? '');
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
      setReturnReasons(
        (rp?.return_accepted_reasons as ReturnReason[] | null) ?? ['manufacturing_defect'],
      );
      setReturnRequiresEvidence(Boolean(rp?.return_requires_evidence));
      setReturnShippingRefundable(Boolean(rp?.return_shipping_refundable));
      setErrors({});
      setTouched({});
      setPendingImages((current) => {
        current.forEach((item) => URL.revokeObjectURL(item.preview));
        return [];
      });
      setCustomColorText('');
      setPendingModel3d(null);
      setRemoveExistingModel3d(false);
      setModel3dError(null);
      setIsDragging3d(false);
      setMobileTab('info');
      return;
    }

    if (!editingId) {
      setCategoryId(categories[0]?.id ?? '');
      setName('');
      setSalePrice('');
      setComparePrice('');
      setPromotionEndsAt('');
      setStock('10');
      setStockAdjust('');
      setPreorderEnabled(false);
      setExpectedAvailableAt('');
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
      setPendingModel3d(null);
      setRemoveExistingModel3d(false);
      setModel3dError(null);
      setIsDragging3d(false);
      setMobileTab('info');
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
      preorderEnabled,
      expectedAvailableAt,
    });

  const minExpectedDate = (() => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  })();

  const minPromotionDateTime = (() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  })();

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

  const hasInfoErrors = Boolean(
    showError('name') ||
      showError('categoryId') ||
      showError('salePrice') ||
      showError('stock') ||
      showError('stockAdjust') ||
      showError('expectedAvailableAt'),
  );
  const hasMediaErrors = Boolean(showError('images') || model3dError);
  const hasSpecsErrors = Boolean(
    showError('description') ||
      showError('width') ||
      showError('height') ||
      showError('depth'),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ form: true });
    const nextErrors = runValidation();
    setErrors(nextErrors);
    if (hasFormErrors(nextErrors)) {
      if (
        nextErrors.name ||
        nextErrors.categoryId ||
        nextErrors.salePrice ||
        nextErrors.stock ||
        nextErrors.expectedAvailableAt
      ) {
        setMobileTab('info');
      } else if (nextErrors.images) {
        setMobileTab('media');
      } else if (
        nextErrors.description ||
        nextErrors.width ||
        nextErrors.height ||
        nextErrors.depth
      ) {
        setMobileTab('specs');
      }
      return;
    }

    const resolvedStock = editingId ? Number(stockAdjust) : Number(stock || 0);

    const payload: VendorProductPayload = {
      category_id: categoryId,
      name: name.trim(),
      description: description.trim() || null,
      sale_price: Number(salePrice),
      compare_price: comparePrice ? Number(comparePrice) : null,
      promotion_ends_at:
        comparePrice && promotionEndsAt.trim()
          ? new Date(promotionEndsAt).toISOString()
          : null,
      stock_quantity: editingId ? 0 : Number(stock || 0),
      width: width ? Number(width) : null,
      height: height ? Number(height) : null,
      depth: depth ? Number(depth) : null,
      materials: material.trim() ? [material.trim()] : null,
      warranty: warranty || null,
      colors,
      ...(preorderEnabled
        ? {
            availability_mode: 'preorder' as const,
            expected_available_at: expectedAvailableAt.trim() || null,
          }
        : {
            availability_mode: (resolvedStock > 0 ? 'in_stock' : 'out_of_stock') as
              'in_stock' | 'out_of_stock',
            expected_available_at: null,
          }),
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
      stockAdjust: editingId
        ? Number(stockAdjust)
        : stockAdjust.trim()
          ? Number(stockAdjust)
          : undefined,
      images: pendingImages.map((item) => item.file),
      model3d: pendingModel3d,
      removeModel3d: removeExistingModel3d,
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-300 flex items-center justify-center p-4 animate-in fade-in duration-300"
      dir={dir}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100">
        <div className="shrink-0 p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="text-right flex-1 select-none pr-1">
            <h3 className="font-bold text-lg sm:text-xl text-diyar-dark flex items-center gap-2">
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
          <form onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
            {touched.form && hasFormErrors(errors) && (
              <div className="mb-4 sm:mb-6 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700 font-medium text-right">
                {t('vendor.form.fixErrors')}
              </div>
            )}

            {/* Mobile Tab Switcher (< md) */}
            <div className="md:hidden sticky -top-4 z-20 bg-white/95 backdrop-blur-md pb-3 pt-1 border-b border-gray-150 mb-4">
              <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setMobileTab('info')}
                  className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    mobileTab === 'info'
                      ? 'bg-white text-diyar-dark shadow-xs'
                      : 'text-gray-500 hover:text-diyar-dark'
                  }`}
                >
                  <FileText size={13} className={mobileTab === 'info' ? 'text-diyar-brown' : ''} />
                  <span>البيانات والأسعار</span>
                  {hasInfoErrors && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                </button>

                <button
                  type="button"
                  onClick={() => setMobileTab('media')}
                  className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    mobileTab === 'media'
                      ? 'bg-white text-diyar-dark shadow-xs'
                      : 'text-gray-500 hover:text-diyar-dark'
                  }`}
                >
                  <ImageIcon size={13} className={mobileTab === 'media' ? 'text-diyar-brown' : ''} />
                  <span>الصور و 3D</span>
                  {hasMediaErrors ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  ) : totalImageCount > 0 ? (
                    <span className="text-[10px] px-1 rounded-full bg-diyar-brown/10 text-diyar-brown font-mono">
                      {totalImageCount}
                    </span>
                  ) : null}
                </button>

                <button
                  type="button"
                  onClick={() => setMobileTab('specs')}
                  className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    mobileTab === 'specs'
                      ? 'bg-white text-diyar-dark shadow-xs'
                      : 'text-gray-500 hover:text-diyar-dark'
                  }`}
                >
                  <Ruler size={13} className={mobileTab === 'specs' ? 'text-diyar-brown' : ''} />
                  <span>المقاسات والوصف</span>
                  {hasSpecsErrors && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                </button>

                <button
                  type="button"
                  onClick={() => setMobileTab('all')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    mobileTab === 'all'
                      ? 'bg-white text-diyar-dark shadow-xs'
                      : 'text-gray-400 hover:text-diyar-dark'
                  }`}
                  title="عرض كل الأقسام"
                >
                  الكل
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">
              {/* Media & 3D Column (Col 5) */}
              <div
                className={`order-2 md:order-2 md:col-span-5 space-y-6 text-right ${
                  mobileTab === 'media' || mobileTab === 'all' || mobileTab === 'info'
                    ? 'block'
                    : 'hidden md:block'
                }`}
              >
                <div className={`space-y-2 ${mobileTab === 'media' || mobileTab === 'all' ? 'block' : 'hidden md:block'}`}>
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
                        {t('vendor.form.images.formats', {
                          count: totalImageCount,
                          max: MAX_IMAGES,
                        })}
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

                {/* 3D Model Upload & Configuration for Room Designer */}
                <div className={`bg-amber-50/30 p-4 rounded-2xl border border-amber-200/60 space-y-3 text-right ${mobileTab === 'media' || mobileTab === 'all' ? 'block' : 'hidden md:block'}`}>
                  <div className="flex items-center justify-between pb-2 border-b border-amber-100">
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <Box size={13} />
                      <span>مصمم الغرف ثلاثي الأبعاد</span>
                    </span>
                    <h4 className="text-xs font-bold text-diyar-dark flex items-center gap-1.5">
                      <span>نموذج 3D للمنتج (اختياري)</span>
                    </h4>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    ارفع نموذج 3D بصيغة <b>GLB</b> أو <b>GLTF</b> لتمكين العملاء من تجربة القطعة تفاعلياً داخل مصمم الغرف واستعراض أبعادها الواقعية (الحد الأقصى: 25 ميجابايت).
                  </p>

                  {/* Existing Model State */}
                  {productDetail?.has_3d && !removeExistingModel3d && !pendingModel3d ? (
                    <div className="flex items-center justify-between p-3 rounded-xl border border-amber-300/60 bg-white shadow-2xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 bg-amber-500/10 text-amber-800 rounded-lg shrink-0">
                          <Box size={18} />
                        </div>
                        <div className="min-w-0 text-right">
                          <p className="text-xs font-bold text-diyar-dark truncate">نموذج 3D حالي مرتبط بالمنتج</p>
                          <p className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                            <Check size={11} /> جاهز للعرض في مصمم الغرف
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => model3dInputRef.current?.click()}
                          disabled={isSaving}
                          className="px-2.5 py-1 text-xs font-bold text-diyar-brown hover:bg-diyar-cream/60 rounded-lg border border-diyar-brown/30 transition cursor-pointer"
                        >
                          استبدال
                        </button>
                        <button
                          type="button"
                          onClick={() => setRemoveExistingModel3d(true)}
                          disabled={isSaving}
                          className="p-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="حذف النموذج ثلاثي الأبعاد"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ) : pendingModel3d ? (
                    /* Pending New File Selected */
                    <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-300 bg-emerald-50/40 shadow-2xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 bg-emerald-600/10 text-emerald-700 rounded-lg shrink-0">
                          <Check size={18} />
                        </div>
                        <div className="min-w-0 text-right">
                          <p className="text-xs font-bold text-diyar-dark truncate" title={pendingModel3d.name}>
                            {pendingModel3d.name}
                          </p>
                          <p className="text-[10px] text-emerald-700 font-bold mt-0.5">
                            {(pendingModel3d.size / (1024 * 1024)).toFixed(2)} ميجابايت — جاهز للحفظ
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPendingModel3d(null);
                          if (productDetail?.has_3d) {
                            setRemoveExistingModel3d(false);
                          }
                        }}
                        disabled={isSaving}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                        title="إلغاء الملف"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    /* Dropzone when no model is attached */
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging3d(true);
                      }}
                      onDragLeave={() => setIsDragging3d(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging3d(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) validateAndSetModel3d(file);
                      }}
                      onClick={() => model3dInputRef.current?.click()}
                      className={`relative flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                        isDragging3d
                          ? 'border-amber-600 bg-amber-100/50 scale-[0.99]'
                          : 'border-amber-300/70 bg-white hover:bg-amber-50/50 hover:border-amber-500'
                      }`}
                    >
                      <div className="p-2.5 bg-amber-50 text-amber-800 rounded-xl mb-2">
                        <Box size={20} />
                      </div>
                      <p className="text-xs font-bold text-diyar-dark text-center">
                        اضغط لاختيار ملف النموذج ثلاثي الأبعاد أو اسحبه إلى هنا
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1 text-center font-sans">
                        الصيغ المدعومة: .GLB أو .GLTF حتى 25 ميجابايت
                      </p>
                    </div>
                  )}

                  {removeExistingModel3d && !pendingModel3d ? (
                    <div className="flex items-center justify-between text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                      <span>سيتم حذف النموذج ثلاثي الأبعاد عند الحفظ</span>
                      <button
                        type="button"
                        onClick={() => setRemoveExistingModel3d(false)}
                        className="text-diyar-brown font-bold hover:underline cursor-pointer"
                      >
                        تراجع
                      </button>
                    </div>
                  ) : null}

                  {model3dError ? (
                    <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200" role="alert">
                      {model3dError}
                    </p>
                  ) : null}

                  <input
                    ref={model3dInputRef}
                    type="file"
                    accept=".glb,.gltf,model/gltf-binary"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) validateAndSetModel3d(file);
                      e.target.value = '';
                    }}
                  />
                </div>

                <div className={`bg-gray-50/60 p-4 rounded-2xl border border-gray-100 space-y-4 text-right ${mobileTab === 'info' || mobileTab === 'all' ? 'block' : 'hidden md:block'}`}>
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

                <div className={`space-y-3 text-right ${mobileTab === 'media' || mobileTab === 'all' ? 'block' : 'hidden md:block'}`}>
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

                  {/* Mobile Navigation Buttons for Media tab */}
                  <div className={`md:hidden pt-2 flex items-center justify-between gap-2 ${mobileTab === 'media' ? 'flex' : 'hidden'}`}>
                    <button
                      type="button"
                      onClick={() => setMobileTab('info')}
                      className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer"
                    >
                      <ChevronRight size={14} />
                      <span>السابق: البيانات والأسعار</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileTab('specs')}
                      className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-diyar-brown hover:bg-diyar-brown/90 rounded-xl cursor-pointer shadow-sm"
                    >
                      <span>التالي: المقاسات والوصف</span>
                      <ChevronLeft size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Product Details Column (Col 7 - Primary) */}
              <div className="order-1 md:order-1 md:col-span-7 space-y-6 text-right">
                <div className={`space-y-4 text-right ${mobileTab === 'info' || mobileTab === 'all' ? 'block' : 'hidden md:block'}`}>
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
                    {comparePrice.trim() ? (
                      <div className="space-y-1.5 text-right sm:col-span-3">
                        <label className="text-xs font-bold text-gray-550 block text-right">
                          {t('vendor.form.promotionEndsAt')}
                        </label>
                        <input
                          type="datetime-local"
                          value={promotionEndsAt}
                          min={minPromotionDateTime}
                          onChange={(e) => setPromotionEndsAt(e.target.value)}
                          className={`${vendorFieldClass(false)} p-2.5 font-medium text-gray-600`}
                        />
                        <p className="text-[11px] text-gray-500">{t('vendor.form.promotionEndsAtHint')}</p>
                      </div>
                    ) : null}
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
                          {productDetail?.inventory &&
                            productDetail.inventory.reserved_quantity > 0 && (
                              <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-2.5 py-2 leading-relaxed border border-amber-100">
                                {t('vendor.form.stockReservedHint', {
                                  reserved: productDetail.inventory.reserved_quantity,
                                  available: productDetail.inventory.available_quantity,
                                  minimum: productDetail.inventory.reserved_quantity,
                                })}
                              </p>
                            )}
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
                    <div className="sm:col-span-3 space-y-3 rounded-xl border border-purple-100 bg-purple-50/40 p-4">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preorderEnabled}
                          onChange={(event) => setPreorderEnabled(event.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-diyar-brown focus:ring-diyar-brown/30"
                        />
                        <span className="text-right">
                          <span className="block text-sm font-bold text-diyar-dark">
                            {t('vendor.form.preorderEnabled')}
                          </span>
                          <span className="block text-xs text-gray-500 mt-1 leading-relaxed">
                            {t('vendor.form.preorderHint')}
                          </span>
                        </span>
                      </label>
                      {preorderEnabled && (
                        <div className="space-y-1.5 text-right">
                          <label className="text-xs font-bold text-gray-700 block">
                            {t('vendor.form.expectedAvailableAt')}
                          </label>
                          <input
                            type="date"
                            min={minExpectedDate}
                            value={expectedAvailableAt}
                            onChange={(event) => {
                              setExpectedAvailableAt(event.target.value);
                              clearFieldError('expectedAvailableAt');
                            }}
                            onBlur={() => markTouched('expectedAvailableAt')}
                            className={`${vendorFieldClass(Boolean(showError('expectedAvailableAt')))} p-2.5 text-right`}
                          />
                          {showError('expectedAvailableAt') ? (
                            <p className="text-xs font-medium text-red-600">
                              {showError('expectedAvailableAt')}
                            </p>
                          ) : (
                            <p className="text-[11px] text-gray-400">
                              {t('vendor.form.expectedAvailableAtHint')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mobile Next button from Info to Media */}
                  <div className="md:hidden pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setMobileTab('media')}
                      className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-diyar-brown hover:bg-diyar-brown/90 rounded-xl cursor-pointer shadow-sm"
                    >
                      <span>التالي: صور المنتج ونموذج 3D</span>
                      <ChevronLeft size={14} />
                    </button>
                  </div>
                </div>

                <div className={`p-5 bg-stone-50/50 rounded-2xl border border-stone-150 space-y-4 text-right ${mobileTab === 'specs' || mobileTab === 'all' ? 'block' : 'hidden md:block'}`}>
                  <h4 className="text-xs font-bold text-stone-600 block border-b border-stone-100 pb-2 text-right">
                    {t('vendor.form.specsTitle')}
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1 text-center font-sans">
                      <label className="text-xs text-stone-500 block mb-1">
                        {t('vendor.form.width')}
                      </label>
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
                      <label className="text-xs text-stone-500 block mb-1">
                        {t('vendor.form.depth')}
                      </label>
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
                      <label className="text-xs text-stone-500 block mb-1">
                        {t('vendor.form.height')}
                      </label>
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
                  <div className={mobileTab === 'specs' || mobileTab === 'all' ? 'block' : 'hidden md:block'}>
                    <VendorProductAffiliateSection productId={editingId} />
                  </div>
                )}

                {editingId && (
                  <div className={`p-5 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-4 text-right ${mobileTab === 'specs' || mobileTab === 'all' ? 'block' : 'hidden md:block'}`}>
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
                          <label className="text-xs font-bold text-gray-600">
                            {t('returns.policyWindowDays')}
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={returnWindowDays}
                            onChange={(e) =>
                              setReturnWindowDays(sanitizeIntegerInput(e.target.value))
                            }
                            className={`${vendorFieldClass(false)} mt-1 p-2 text-sm`}
                          />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-600 mb-2">
                            {t('returns.policyAcceptedReasons')}
                          </p>
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

                <div className={`space-y-1.5 text-right font-sans ${mobileTab === 'specs' || mobileTab === 'all' ? 'block' : 'hidden md:block'}`}>
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

                  {/* Mobile Back button from Specs to Media */}
                  <div className="md:hidden pt-3 flex justify-start">
                    <button
                      type="button"
                      onClick={() => setMobileTab('media')}
                      className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer"
                    >
                      <ChevronRight size={14} />
                      <span>السابق: صور المنتج ونموذج 3D</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 mt-8 pt-6 border-t border-gray-150 flex items-center justify-between gap-3 text-right">
              <span className="text-xs text-gray-400 font-sans hidden sm:inline">
                * الحقول المميزة بعلامة النجمة إلزامية
              </span>
              <div className="flex items-center gap-3 ms-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className={`${vendorButtonClass} px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-500 hover:text-diyar-dark hover:bg-gray-50 border border-transparent hover:border-gray-200`}
                >
                  {t('vendor.form.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`${vendorButtonClass} px-6 sm:px-8 py-2.5 sm:py-3 text-xs sm:text-sm bg-diyar-brown hover:bg-[#A67B5B]/90 text-white shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] font-sans`}
                >
                  {isSaving ? t('vendor.form.saving') : t('vendor.form.submit')}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
