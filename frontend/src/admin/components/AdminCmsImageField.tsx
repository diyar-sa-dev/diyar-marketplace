import { useRef } from 'react';
import { ImageIcon, Loader2, Upload, X } from 'lucide-react';
import { uploadCmsImage, type CmsImageContext } from '../../api/adminCms.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { parseApiError } from '../../utils/errors.ts';

type AdminCmsImageFieldProps = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  context: CmsImageContext;
  uploading: boolean;
  onUploadingChange: (uploading: boolean) => void;
  uploadLabel?: string;
  optionalUrl?: boolean;
};

export function AdminCmsImageField({
  label,
  value,
  onChange,
  context,
  uploading,
  onUploadingChange,
  uploadLabel,
  optionalUrl = true,
}: AdminCmsImageFieldProps) {
  const { t, locale } = useLocale();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    onUploadingChange(true);
    try {
      const result = await uploadCmsImage(file, context);
      onChange(result.url);
    } catch (error) {
      toast.error(parseApiError(error, locale).message || t('admin.blogArticles.uploadError'));
    } finally {
      onUploadingChange(false);
    }
  };

  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
        {label}
      </label>

      {value ? (
        <div className="relative mb-3 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
          <img
            src={value}
            alt=""
            className="h-40 w-full object-cover"
            referrerPolicy="no-referrer"
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 inset-s-2 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/70"
            aria-label={t('common.delete')}
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="mb-3 flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-4 text-gray-400 transition-colors hover:border-diyar-brown/50 hover:bg-diyar-brown/5 disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 size={22} className="animate-spin text-diyar-brown" />
          ) : (
            <>
              <div className="rounded-xl bg-white p-2 text-diyar-brown shadow-sm">
                <Upload size={20} />
              </div>
              <span className="mt-2 text-sm font-bold text-diyar-dark">
                {uploadLabel ?? t('admin.blogArticles.upload')}
              </span>
              <span className="mt-1 text-xs text-gray-400">{t('admin.cmsImage.formats')}</span>
            </>
          )}
        </button>
      )}

      {value ? (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="mb-2 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:border-diyar-brown"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
          {t('admin.cmsImage.replace')}
        </button>
      ) : null}

      {optionalUrl ? (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('admin.blogArticles.placeholders.imageUrl')}
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
          dir="ltr"
        />
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
          event.target.value = '';
        }}
      />
    </div>
  );
}
