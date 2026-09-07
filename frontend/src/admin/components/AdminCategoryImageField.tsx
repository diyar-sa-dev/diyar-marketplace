import { useEffect, useRef, useState } from 'react';
import { Check, ImageIcon, Loader2, Trash2, Upload, X } from 'lucide-react';
import { deleteAdminCategoryImage, uploadAdminCategoryImage } from '../../api/adminCategories.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { validateImageFiles } from '../../lib/vendorProductValidation.ts';
import { translateVendorFormError } from '../../lib/vendorProductValidation.ts';
import { parseApiError } from '../../utils/errors.ts';
import { resolveMediaUrl } from '../../lib/media.ts';

const ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp';

type AdminCategoryImageFieldProps = {
  categoryId?: string;
  imageUrl?: string | null;
  disabled?: boolean;
  pendingFile: File | null;
  pendingPreview: string | null;
  onPendingFileChange: (file: File | null, preview: string | null) => void;
  onImageUrlChange: (url: string | null) => void;
};

export function AdminCategoryImageField({
  categoryId,
  imageUrl,
  disabled = false,
  pendingFile,
  pendingPreview,
  onPendingFileChange,
  onImageUrlChange,
}: AdminCategoryImageFieldProps) {
  const { t, locale } = useLocale();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewUrl = pendingPreview ?? resolveMediaUrl(imageUrl) ?? null;
  const isBusy = uploadProgress !== null || deleting;

  useEffect(() => {
    return () => {
      if (pendingPreview) {
        URL.revokeObjectURL(pendingPreview);
      }
    };
  }, [pendingPreview]);

  const clearPending = () => {
    if (pendingPreview) {
      URL.revokeObjectURL(pendingPreview);
    }
    onPendingFileChange(null, null);
  };

  const handleFile = async (file: File) => {
    setError(null);
    setUploadComplete(false);

    const validationError = validateImageFiles([file]);
    if (validationError) {
      const message = translateVendorFormError(validationError, t) ?? t('admin.categories.imageUploadError');
      setError(message);
      toast.error(message);
      return;
    }

    if (!categoryId) {
      clearPending();
      onPendingFileChange(file, URL.createObjectURL(file));
      return;
    }

    setUploadProgress(0);
    try {
      const category = await uploadAdminCategoryImage(categoryId, file, setUploadProgress);
      onImageUrlChange(category.image_url ?? null);
      clearPending();
      setUploadComplete(true);
      toast.success(t('admin.categories.imageUploaded'));
      window.setTimeout(() => setUploadComplete(false), 2000);
    } catch (uploadError) {
      const message =
        parseApiError(uploadError, locale).message || t('admin.categories.imageUploadError');
      setError(message);
      toast.error(message);
    } finally {
      setUploadProgress(null);
    }
  };

  const handleDelete = async () => {
    setError(null);
    setUploadComplete(false);

    if (!categoryId || !imageUrl) {
      clearPending();
      return;
    }

    setDeleting(true);
    try {
      const category = await deleteAdminCategoryImage(categoryId);
      onImageUrlChange(category.image_url ?? null);
      clearPending();
      toast.success(t('admin.categories.imageDeleted'));
    } catch (deleteError) {
      const message =
        parseApiError(deleteError, locale).message || t('admin.categories.imageDeleteError');
      setError(message);
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
        {t('admin.categories.imageLabel')}
      </label>

      {previewUrl ? (
        <div className="relative mb-3 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
          <img
            src={previewUrl}
            alt=""
            className="h-40 w-full object-cover"
            referrerPolicy="no-referrer"
          />
          {uploadComplete ? (
            <div className="absolute inset-0 flex items-center justify-center bg-emerald-600/75 text-white">
              <Check size={28} />
            </div>
          ) : null}
          {uploadProgress !== null ? (
            <div className="absolute inset-x-0 bottom-0 bg-black/55 px-3 py-2 text-white text-xs font-semibold">
              <div className="mb-1">{t('admin.categories.imageUploading', { percent: uploadProgress })}</div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/25">
                <div
                  className="h-full rounded-full bg-diyar-brown transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : null}
          <div className="absolute top-2 inset-e-2 flex gap-1.5">
            <button
              type="button"
              disabled={disabled || isBusy}
              onClick={() => inputRef.current?.click()}
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/70 disabled:opacity-60"
              aria-label={t('admin.cmsImage.replace')}
            >
              {isBusy ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
            </button>
            <button
              type="button"
              disabled={disabled || isBusy}
              onClick={() => void handleDelete()}
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white hover:bg-red-600 disabled:opacity-60"
              aria-label={t('common.delete')}
            >
              {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || isBusy}
          onClick={() => inputRef.current?.click()}
          className="mb-3 flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-4 text-gray-400 transition-colors hover:border-diyar-brown/50 hover:bg-diyar-brown/5 disabled:opacity-60"
        >
          {isBusy ? (
            <Loader2 size={22} className="animate-spin text-diyar-brown" />
          ) : (
            <>
              <div className="rounded-xl bg-white p-2 text-diyar-brown shadow-sm">
                <Upload size={20} />
              </div>
              <span className="mt-2 text-sm font-bold text-diyar-dark">
                {t('admin.categories.imageUpload')}
              </span>
              <span className="mt-1 text-xs text-gray-400">{t('admin.categories.imageHint')}</span>
            </>
          )}
        </button>
      )}

      {pendingFile && !categoryId ? (
        <p className="mb-2 text-xs font-medium text-amber-700">
          {t('admin.categories.imagePendingCreate', { name: pendingFile.name })}
        </p>
      ) : null}

      {error ? <p className="mb-2 text-xs font-semibold text-red-600">{error}</p> : null}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        disabled={disabled || isBusy}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
          event.target.value = '';
        }}
      />
    </div>
  );
}
