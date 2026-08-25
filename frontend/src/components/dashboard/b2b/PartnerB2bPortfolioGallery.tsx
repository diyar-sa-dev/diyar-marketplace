import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, Upload, X, ZoomIn } from 'lucide-react';
import {
  deletePartnerB2bPortfolioImage,
  uploadPartnerB2bPortfolioImage,
} from '../../../api/partnerB2b.ts';
import { ImageGalleryLightbox } from '../../common/ImageGalleryLightbox.tsx';
import { b2bKeys } from '../../../hooks/b2b/queryKeys.ts';
import { useLocale } from '../../../hooks/useLocale.ts';
import { useToast } from '../../../hooks/useToast.ts';
import type { B2bCompanyPortfolioImage, PartnerB2bPortal } from '../../../types/b2b.ts';
import { parseApiError } from '../../../utils/errors.ts';

export const B2B_PORTFOLIO_MAX_IMAGES = 6;

type PartnerB2bPortfolioGalleryProps = {
  portal: PartnerB2bPortal;
  images: B2bCompanyPortfolioImage[];
  companyExists: boolean;
  isPublished: boolean;
  onChange: (images: B2bCompanyPortfolioImage[]) => void;
  disabled?: boolean;
};

export function PartnerB2bPortfolioGallery({
  portal,
  images,
  companyExists,
  isPublished,
  onChange,
  disabled = false,
}: PartnerB2bPortfolioGalleryProps) {
  const { t, locale } = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadLabel, setUploadLabel] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [brokenIds, setBrokenIds] = useState<Set<string>>(new Set());
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const visibleImages = images.filter(
    (image) => image.url?.trim() && !brokenIds.has(image.id),
  );
  const remainingSlots = B2B_PORTFOLIO_MAX_IMAGES - images.length;
  const canAddMore = remainingSlots > 0;
  const isUploading = uploadProgress !== null;

  const refreshGallery = async (gallery: B2bCompanyPortfolioImage[]) => {
    onChange(gallery);
    await queryClient.invalidateQueries({ queryKey: b2bKeys.partnerCompany(portal) });
  };

  const handleUploadFiles = async (files: File[]) => {
    if (!companyExists) {
      toast.error(t('b2b.partner.portfolio.saveProfileFirst'));
      return;
    }

    const queue = files.slice(0, remainingSlots);
    if (queue.length === 0) {
      toast.error(t('b2b.partner.portfolio.maxReached', { max: B2B_PORTFOLIO_MAX_IMAGES }));
      return;
    }

    if (files.length > queue.length) {
      toast.error(
        t('b2b.partner.portfolio.tooManySelected', {
          selected: files.length,
          allowed: queue.length,
          max: B2B_PORTFOLIO_MAX_IMAGES,
        }),
      );
    }

    setUploadProgress(0);
    let latestGallery = images;

    try {
      for (let index = 0; index < queue.length; index += 1) {
        const file = queue[index];
        setUploadLabel(
          t('b2b.partner.portfolio.uploadingFile', {
            current: index + 1,
            total: queue.length,
            name: file.name,
          }),
        );

        const result = await uploadPartnerB2bPortfolioImage(portal, file, (percent) => {
          const overall = Math.round(((index + percent / 100) / queue.length) * 100);
          setUploadProgress(overall);
        });

        latestGallery = result.company?.portfolio_gallery ?? latestGallery;
      }

      await refreshGallery(latestGallery);
      toast.success(
        queue.length === 1
          ? t('b2b.partner.portfolio.uploaded')
          : t('b2b.partner.portfolio.uploadedMany', { count: queue.length }),
      );
    } catch (error) {
      toast.error(parseApiError(error, locale).message || t('b2b.partner.uploadError'));
    } finally {
      setUploadProgress(null);
      setUploadLabel('');
    }
  };

  const handleDelete = async (imageId: string) => {
    setDeletingId(imageId);
    try {
      const result = await deletePartnerB2bPortfolioImage(portal, imageId);
      await refreshGallery(result.company?.portfolio_gallery ?? []);
      toast.success(t('b2b.partner.portfolio.deleted'));
    } catch (error) {
      toast.error(parseApiError(error, locale).message || t('b2b.partner.saveError'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {!isPublished ? (
        <p className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {t('b2b.partner.portfolio.publishedOnlyHint')}
        </p>
      ) : null}

      {visibleImages.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {visibleImages.map((image, index) => (
            <div
              key={image.id}
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-gray-100 bg-white"
            >
              <button
                type="button"
                disabled={disabled || isUploading}
                onClick={() => {
                  setPreviewIndex(index);
                  setPreviewOpen(true);
                }}
                className="h-full w-full cursor-pointer"
              >
                <img
                  src={image.url}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                  onError={() => setBrokenIds((prev) => new Set(prev).add(image.id))}
                />
                <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="rounded-full bg-white/90 p-2 text-diyar-dark shadow-md">
                    <ZoomIn size={16} />
                  </span>
                </div>
              </button>
              <button
                type="button"
                disabled={disabled || deletingId === image.id || isUploading}
                onClick={() => void handleDelete(image.id)}
                className="absolute top-2 inset-s-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/70 disabled:opacity-60 cursor-pointer"
                aria-label={t('common.delete')}
              >
                {deletingId === image.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <X size={14} />
                )}
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {canAddMore ? (
        <button
          type="button"
          disabled={disabled || isUploading}
          onClick={() => inputRef.current?.click()}
          className="flex h-32 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white p-4 text-gray-400 transition-colors hover:border-diyar-brown/50 hover:bg-diyar-cream/10 disabled:opacity-60 cursor-pointer"
        >
          {isUploading ? (
            <Loader2 size={22} className="animate-spin text-diyar-brown" />
          ) : (
            <>
              <div className="rounded-xl bg-gray-50 p-2 text-diyar-brown shadow-sm">
                <Upload size={20} />
              </div>
              <span className="mt-2 text-sm font-bold text-diyar-dark">{t('b2b.partner.portfolio.upload')}</span>
              <span className="mt-1 text-xs text-gray-500">
                {t('b2b.partner.portfolio.formats', {
                  count: images.length,
                  max: B2B_PORTFOLIO_MAX_IMAGES,
                })}
              </span>
            </>
          )}
        </button>
      ) : (
        <div className="rounded-xl border border-green-200 bg-green-50/60 px-4 py-3 text-xs font-bold text-green-800">
          <Check size={14} className="inline me-1" />
          {t('b2b.partner.portfolio.maxReached', { max: B2B_PORTFOLIO_MAX_IMAGES })}
        </div>
      )}

      {isUploading && uploadProgress !== null ? (
        <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3 space-y-2">
          <div className="flex items-center justify-between gap-3 text-xs font-bold text-diyar-dark">
            <span className="truncate">{uploadLabel || t('b2b.partner.portfolio.uploading')}</span>
            <span className="shrink-0">{uploadProgress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full border border-amber-100 bg-white">
            <div className="h-full bg-diyar-brown transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length > 0) {
            void handleUploadFiles(files);
          }
          event.target.value = '';
        }}
      />

      <ImageGalleryLightbox
        images={visibleImages.map((image) => image.url)}
        open={previewOpen}
        activeIndex={previewIndex}
        onActiveIndexChange={setPreviewIndex}
        onClose={() => setPreviewOpen(false)}
        altPrefix={t('b2b.company.portfolio')}
      />
    </div>
  );
}
