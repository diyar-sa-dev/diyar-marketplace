import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  Upload,
  Link as LinkIcon,
  DollarSign,
  FileText,
  Tags,
  Send,
  CheckCircle2,
  ConciergeBell,
  Check,
  Loader2,
  File,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/auth/useAuth.ts';
import { useServiceCategories } from '../../hooks/services/useServices.ts';
import { useCreateServiceRequest } from '../../hooks/services/useServiceRequests.ts';
import { uploadServiceRequestAttachment } from '../../api/serviceRequests.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import {
  formatFileSize,
  isImageAttachment,
  MAX_SERVICE_REQUEST_ATTACHMENTS,
  parseBudget,
  parseReferenceLinks,
  sanitizeBudgetInput,
  validateBudget,
  validateReferenceLinksInput,
  validateServiceRequestFile,
} from '../../lib/serviceRequestValidation.ts';
import { parseApiError } from '../../utils/errors.ts';
import { AuthPromptModal } from '../product/AuthPromptModal.tsx';

export type RequestServiceModalContext = {
  serviceId?: string;
  providerAccountId?: string;
  defaultCategoryIds?: string[];
  defaultDescription?: string;
};

interface RequestServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  context?: RequestServiceModalContext;
}

type PendingAttachment = {
  id: string;
  file: File;
  preview: string | null;
  progress: number | null;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
};

type FormErrors = {
  description?: string;
  categories?: string;
  customCategory?: string;
  budget?: string;
  links?: string;
  attachments?: string;
};

function RequiredMark() {
  return <span className="text-red-500">*</span>;
}

export function RequestServiceModal({ isOpen, onClose, context }: RequestServiceModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { locale, dir, t } = useLocale();
  const { data: categories = [], isLoading: categoriesLoading } = useServiceCategories();
  const createRequest = useCreateServiceRequest();

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [description, setDescription] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [customCategoryText, setCustomCategoryText] = useState('');
  const [budget, setBudget] = useState('');
  const [links, setLinks] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replacingAttachmentId = useRef<string | null>(null);

  const otherCategory = useMemo(
    () => categories.find((category) => category.slug === 'other'),
    [categories],
  );
  const isOtherSelected = Boolean(otherCategory && selectedCategoryIds.includes(otherCategory.id));

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDescription(context?.defaultDescription ?? '');
    setSelectedCategoryIds(context?.defaultCategoryIds ?? []);
    setCustomCategoryText('');
    setBudget('');
    setLinks('');
    setPendingAttachments((current) => {
      current.forEach((item) => {
        if (item.preview) {
          URL.revokeObjectURL(item.preview);
        }
      });
      return [];
    });
    setErrors({});
    setIsSubmitted(false);
  }, [isOpen, context?.defaultCategoryIds, context?.defaultDescription]);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    );
    setErrors((prev) => ({ ...prev, categories: undefined, customCategory: undefined }));
  };

  const categoryLabel = (category: (typeof categories)[number]) =>
    locale === 'ar' ? category.name_ar : category.name_en;

  const addFiles = (files: File[]) => {
    if (files.length === 0) {
      return;
    }

    const remaining = MAX_SERVICE_REQUEST_ATTACHMENTS - pendingAttachments.length;
    if (remaining <= 0) {
      setErrors((prev) => ({
        ...prev,
        attachments: t('serviceMarketplace.requestModal.errors.maxAttachments', {
          max: MAX_SERVICE_REQUEST_ATTACHMENTS,
        }),
      }));
      return;
    }

    const nextItems: PendingAttachment[] = [];
    let attachmentError: string | undefined;

    for (const file of files.slice(0, remaining)) {
      const validationError = validateServiceRequestFile(file);
      if (validationError) {
        attachmentError = validationError;
        continue;
      }

      nextItems.push({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
        preview: isImageAttachment(file) ? URL.createObjectURL(file) : null,
        progress: null,
        status: 'pending',
      });
    }

    if (nextItems.length > 0) {
      setPendingAttachments((prev) => [...prev, ...nextItems]);
    }

    setErrors((prev) => ({ ...prev, attachments: attachmentError }));
  };

  const removeAttachment = (id: string) => {
    setPendingAttachments((current) => {
      const target = current.find((item) => item.id === id);
      if (target?.preview) {
        URL.revokeObjectURL(target.preview);
      }
      return current.filter((item) => item.id !== id);
    });
    setErrors((prev) => ({ ...prev, attachments: undefined }));
  };

  const replaceAttachment = (id: string, file: File) => {
    const validationError = validateServiceRequestFile(file);
    if (validationError) {
      setErrors((prev) => ({ ...prev, attachments: validationError }));
      return;
    }

    setPendingAttachments((current) =>
      current.map((item) => {
        if (item.id !== id) {
          return item;
        }
        if (item.preview) {
          URL.revokeObjectURL(item.preview);
        }
        return {
          ...item,
          file,
          preview: isImageAttachment(file) ? URL.createObjectURL(file) : null,
          progress: null,
          status: 'pending',
          error: undefined,
        };
      }),
    );
    setErrors((prev) => ({ ...prev, attachments: undefined }));
  };

  const validateForm = (): FormErrors => {
    const nextErrors: FormErrors = {};

    if (description.trim().length < 20) {
      nextErrors.description = t('serviceMarketplace.requestModal.errors.description');
    }

    if (selectedCategoryIds.length === 0) {
      nextErrors.categories = t('serviceMarketplace.requestModal.errors.categories');
    }

    if (isOtherSelected && customCategoryText.trim().length < 2) {
      nextErrors.customCategory = t('serviceMarketplace.requestModal.errors.customCategory');
    }

    const budgetError = validateBudget(budget);
    if (budgetError) {
      nextErrors.budget = budgetError;
    }

    const linksError = validateReferenceLinksInput(links);
    if (linksError) {
      nextErrors.links = linksError;
    }

    return nextErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setAuthOpen(true);
      return;
    }

    const nextErrors = validateForm();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      const budgetValues = parseBudget(budget);
      const trimmedDescription = description.trim();
      const finalDescription =
        isOtherSelected && customCategoryText.trim()
          ? `${t('serviceMarketplace.requestModal.categoryPrefix', { name: customCategoryText.trim() })}\n\n${trimmedDescription}`
          : trimmedDescription;

      const created = await createRequest.mutateAsync({
        description: finalDescription,
        category_ids: selectedCategoryIds,
        service_id: context?.serviceId,
        provider_account_id: context?.providerAccountId,
        reference_links: parseReferenceLinks(links),
        ...budgetValues,
      });

      for (const attachment of pendingAttachments) {
        setPendingAttachments((current) =>
          current.map((item) =>
            item.id === attachment.id
              ? { ...item, status: 'uploading', progress: 0, error: undefined }
              : item,
          ),
        );

        try {
          await uploadServiceRequestAttachment(created.id, attachment.file, (percent) => {
            setPendingAttachments((current) =>
              current.map((item) =>
                item.id === attachment.id ? { ...item, progress: percent } : item,
              ),
            );
          });

          setPendingAttachments((current) =>
            current.map((item) =>
              item.id === attachment.id ? { ...item, status: 'done', progress: 100 } : item,
            ),
          );
        } catch {
          setPendingAttachments((current) =>
            current.map((item) =>
              item.id === attachment.id
                ? {
                    ...item,
                    status: 'error',
                    error: t('serviceMarketplace.requestModal.uploadFailed'),
                  }
                : item,
            ),
          );
          throw new Error('attachment_upload_failed');
        }
      }

      setIsSubmitted(true);
      setTimeout(() => {
        onClose();
        setIsSubmitted(false);
        navigate('/profile/service-requests');
      }, 2000);
    } catch (error) {
      if (error instanceof Error && error.message === 'attachment_upload_failed') {
        toast.error(t('serviceMarketplace.requestModal.partialUploadError'));
      } else {
        toast.error(
          parseApiError(error, locale).message || t('serviceMarketplace.requestModal.submitError'),
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const canAddMoreAttachments = pendingAttachments.length < MAX_SERVICE_REQUEST_ATTACHMENTS;

  return (
    <>
      {isOpen ? (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-0 md:p-4 backdrop-blur-sm cursor-pointer"
      dir={dir}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white rounded-none md:rounded-3xl w-full h-dvh md:h-auto max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col md:max-h-[90vh] cursor-default"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-service-title"
      >
        <div className="bg-gray-50 border-b border-gray-100 px-6 pb-6 md:px-8 md:pb-7 pt-[calc(env(safe-area-inset-top,0px)+2rem)] flex justify-between items-start gap-4 relative overflow-hidden shrink-0 rounded-none md:rounded-t-3xl">
          <div className="absolute inset-0 bg-diyar-cream/20"></div>
          <div className="relative z-10 flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-diyar-brown/10 text-diyar-brown flex items-center justify-center shrink-0 border border-diyar-brown/15">
              <ConciergeBell size={22} />
            </div>
            <div className="pt-0.5">
              <h2
                id="request-service-title"
                className="text-xl md:text-2xl font-bold text-diyar-dark leading-snug"
              >
                {t('serviceMarketplace.requestModal.title')}
              </h2>
              <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                {t('serviceMarketplace.requestModal.subtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shadow-sm relative z-10 shrink-0 mr-4 cursor-pointer disabled:opacity-60"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 md:p-8 flex-1 overflow-y-auto custom-scrollbar rounded-none md:rounded-b-3xl">
          {isSubmitted ? (
            <div className="text-center py-10">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} className="text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-diyar-dark mb-2">
                {t('serviceMarketplace.requestModal.successTitle')}
              </h3>
              <p className="text-gray-500">
                {t('serviceMarketplace.requestModal.successDescription')}
              </p>
            </div>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <FileText size={16} className="text-diyar-brown" />
                  {t('serviceMarketplace.requestModal.descriptionLabel')} <RequiredMark />
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setErrors((prev) => ({ ...prev, description: undefined }));
                  }}
                  placeholder={t('serviceMarketplace.requestModal.descriptionPlaceholder')}
                  className={`w-full bg-gray-50 border rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-diyar-brown focus:border-transparent outline-none transition-all resize-none ${
                    errors.description ? 'border-red-300 bg-red-50/40' : 'border-gray-200'
                  }`}
                />
                {errors.description && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.description}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2 flex-wrap">
                  <Tags size={16} className="text-diyar-brown" />
                  {t('serviceMarketplace.requestModal.categoryLabel')} <RequiredMark />
                  <span className="text-gray-400 font-medium text-xs">
                    {selectedCategoryIds.length > 0
                      ? t('serviceMarketplace.requestModal.categorySelected', {
                          count: selectedCategoryIds.length,
                        })
                      : t('serviceMarketplace.requestModal.categoryMultiHint')}
                  </span>
                </label>
                {categoriesLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-diyar-brown" />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category) => {
                        const active = selectedCategoryIds.includes(category.id);
                        return (
                          <button
                            type="button"
                            key={category.id}
                            onClick={() => toggleCategory(category.id)}
                            aria-pressed={active}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium border transition-all cursor-pointer ${active ? 'bg-diyar-brown text-white border-diyar-brown shadow-sm shadow-diyar-brown/20' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-diyar-brown/40 hover:text-diyar-dark'}`}
                          >
                            {active && <Check size={15} />}
                            {categoryLabel(category)}
                          </button>
                        );
                      })}
                    </div>
                    {isOtherSelected && (
                      <div className="mt-3">
                        <label className="text-xs font-bold text-gray-600 mb-1.5 block">
                          {t('serviceMarketplace.requestModal.customCategoryLabel')}{' '}
                          <RequiredMark />
                        </label>
                        <input
                          type="text"
                          value={customCategoryText}
                          onChange={(e) => {
                            setCustomCategoryText(e.target.value);
                            setErrors((prev) => ({ ...prev, customCategory: undefined }));
                          }}
                          placeholder={t(
                            'serviceMarketplace.requestModal.customCategoryPlaceholder',
                          )}
                          className={`w-full bg-white border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-diyar-brown focus:border-transparent outline-none transition-all ${
                            errors.customCategory
                              ? 'border-red-300 bg-red-50/40'
                              : 'border-gray-200'
                          }`}
                        />
                        {errors.customCategory && (
                          <p className="mt-1.5 text-xs text-red-600 font-medium">
                            {errors.customCategory}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
                {errors.categories && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.categories}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <DollarSign size={16} className="text-diyar-brown" />
                  {t('serviceMarketplace.requestModal.budgetLabel')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={budget}
                    onChange={(e) => {
                      setBudget(sanitizeBudgetInput(e.target.value));
                      setErrors((prev) => ({ ...prev, budget: undefined }));
                    }}
                    placeholder={t('serviceMarketplace.requestModal.budgetPlaceholder')}
                    className={`w-full bg-gray-50 border rounded-xl ps-12 pe-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-diyar-brown focus:border-transparent outline-none transition-all ${
                      errors.budget ? 'border-red-300 bg-red-50/40' : 'border-gray-200'
                    }`}
                  />
                  <span className="absolute inset-s-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                    {t('providerDashboard.common.currency')}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-gray-400">
                  {t('serviceMarketplace.requestModal.budgetHint')}
                </p>
                {errors.budget && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.budget}</p>
                )}
              </div>

              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <h4 className="text-sm font-bold text-gray-700 mb-4">
                  {t('serviceMarketplace.requestModal.attachmentsTitle')}
                </h4>
                <div className="space-y-4">
                  {pendingAttachments.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {pendingAttachments.map((item) => (
                        <div
                          key={item.id}
                          className="relative rounded-xl overflow-hidden border border-gray-200 bg-white aspect-square group"
                        >
                          {item.preview ? (
                            <img
                              src={item.preview}
                              alt={item.file.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3 text-center bg-gray-50">
                              <FileText size={28} className="text-diyar-brown" />
                              <span className="text-[10px] font-bold text-gray-600 line-clamp-2">
                                {item.file.name}
                              </span>
                            </div>
                          )}

                          {(item.status === 'uploading' || item.status === 'done') && (
                            <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1.5">
                              <div className="h-1.5 rounded-full bg-white/30 overflow-hidden">
                                <div
                                  className="h-full bg-diyar-brown transition-all duration-300"
                                  style={{ width: `${item.progress ?? 0}%` }}
                                />
                              </div>
                              <p className="text-[10px] text-white mt-1 text-center">
                                {item.status === 'done'
                                  ? t('serviceMarketplace.requestModal.uploadDone')
                                  : `${item.progress ?? 0}%`}
                              </p>
                            </div>
                          )}

                          {item.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                disabled={submitting}
                                onClick={() => removeAttachment(item.id)}
                                className="absolute top-1.5 inset-s-1.5 cursor-pointer w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center opacity-90 hover:opacity-100 disabled:opacity-50"
                                aria-label={t('serviceMarketplace.requestModal.deleteFile')}
                              >
                                <X size={14} />
                              </button>
                              <button
                                type="button"
                                disabled={submitting}
                                onClick={() => {
                                  replacingAttachmentId.current = item.id;
                                  replaceInputRef.current?.click();
                                }}
                                className="absolute bottom-1.5 inset-x-1.5 cursor-pointer rounded-lg bg-black/55 text-white text-[10px] font-bold py-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-40"
                              >
                                {t('serviceMarketplace.requestModal.replace')}
                              </button>
                            </>
                          )}

                          <span className="absolute top-1.5 inset-e-1.5 text-[9px] bg-black/55 text-white px-1.5 py-0.5 rounded flex items-center gap-1">
                            <File size={10} />
                            {formatFileSize(item.file.size)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      multiple
                      accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                      onChange={(e) => {
                        addFiles(Array.from(e.target.files ?? []));
                        e.target.value = '';
                      }}
                    />
                    <input
                      type="file"
                      ref={replaceInputRef}
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        const targetId = replacingAttachmentId.current;
                        if (file && targetId) {
                          replaceAttachment(targetId, file);
                        }
                        replacingAttachmentId.current = null;
                        e.target.value = '';
                      }}
                    />
                    {canAddMoreAttachments ? (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={submitting}
                        className="w-full border-2 border-dashed border-gray-300 rounded-xl py-6 flex flex-col items-center justify-center text-gray-500 hover:border-diyar-brown hover:bg-diyar-cream/10 transition-colors group cursor-pointer disabled:opacity-60"
                      >
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:text-diyar-brown">
                          <Upload size={20} />
                        </div>
                        <span className="font-medium text-sm">
                          {t('serviceMarketplace.requestModal.uploadPrompt')}
                        </span>
                        <span className="text-xs text-gray-400 mt-1">
                          {t('serviceMarketplace.requestModal.uploadFormats', {
                            current: pendingAttachments.length,
                            max: MAX_SERVICE_REQUEST_ATTACHMENTS,
                          })}
                        </span>
                      </button>
                    ) : (
                      <p className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                        {t('serviceMarketplace.requestModal.maxAttachments', {
                          max: MAX_SERVICE_REQUEST_ATTACHMENTS,
                        })}
                      </p>
                    )}
                    {errors.attachments && (
                      <p className="mt-1.5 text-xs text-red-600 font-medium">
                        {errors.attachments}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1.5">
                      <LinkIcon size={14} />
                      {t('serviceMarketplace.requestModal.referenceLinks')}
                    </label>
                    <textarea
                      rows={2}
                      value={links}
                      onChange={(e) => {
                        setLinks(e.target.value);
                        setErrors((prev) => ({ ...prev, links: undefined }));
                      }}
                      placeholder={t('serviceMarketplace.requestModal.referenceLinksPlaceholder')}
                      className={`w-full bg-white border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-diyar-brown focus:border-transparent outline-none transition-all resize-none ${
                        errors.links ? 'border-red-300 bg-red-50/40' : 'border-gray-200'
                      }`}
                    />
                    {errors.links && (
                      <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.links}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="submit"
                  disabled={selectedCategoryIds.length === 0 || submitting}
                  className="flex-1 bg-diyar-brown text-white py-3.5 rounded-xl font-bold hover:bg-[#8A6D46] transition-colors shadow-lg shadow-diyar-brown/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
                >
                  {submitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <Send size={18} />
                      {t('serviceMarketplace.requestModal.submit')}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="px-6 bg-gray-100 text-gray-700 py-3.5 rounded-xl font-bold hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-60"
                >
                  {t('providerDashboard.common.cancel')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
      ) : null}

      <AuthPromptModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        title={t('catalog.productDetail.authRequiredTitle')}
        message={t('serviceMarketplace.requestModal.loginRequired')}
      />
    </>
  );
}
