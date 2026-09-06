import { useRef } from 'react';
import { ImageIcon, Loader2, Upload, X } from 'lucide-react';
import { uploadPartnerB2bImage } from '../../../api/partnerB2b.ts';
import { useLocale } from '../../../hooks/useLocale.ts';
import { useToast } from '../../../hooks/useToast.ts';
import type { PartnerB2bPortal } from '../../../types/b2b.ts';
import { parseApiError } from '../../../utils/errors.ts';

type PartnerB2bImageFieldProps = {
  portal: PartnerB2bPortal;
  type: 'logo' | 'cover';
  label: string;
  hint: string;
  value: string;
  onChange: (url: string) => void;
  uploading: boolean;
  onUploadingChange: (uploading: boolean) => void;
  variant?: 'logo' | 'cover';
};

export function PartnerB2bImageField({
  portal,
  type,
  label,
  hint,
  value,
  onChange,
  uploading,
  onUploadingChange,
  variant = type,
}: PartnerB2bImageFieldProps) {
  const { t, locale } = useLocale();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const isLogo = variant === 'logo';

  const handleFile = async (file: File) => {
    onUploadingChange(true);
    try {
      const result = await uploadPartnerB2bImage(portal, file, type);
      onChange(result.url);
    } catch (error) {
      toast.error(parseApiError(error, locale).message || t('b2b.partner.uploadError'));
    } finally {
      onUploadingChange(false);
    }
  };

  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-diyar-dark">{label}</label>

      {value ? (
        <div
          className={`relative mb-3 overflow-hidden rounded-2xl border border-gray-100 bg-white ${
            isLogo ? 'h-32 w-32' : 'h-40 w-full'
          }`}
        >
          <img
            src={value}
            alt=""
            className={`h-full w-full ${isLogo ? 'object-contain p-2' : 'object-cover'}`}
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
          className={`mb-3 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white p-4 text-gray-400 transition-colors hover:border-diyar-brown/50 hover:bg-diyar-cream/10 disabled:opacity-60 ${
            isLogo ? 'h-32 w-32' : 'h-40 w-full'
          }`}
        >
          {uploading ? (
            <Loader2 size={22} className="animate-spin text-diyar-brown" />
          ) : (
            <>
              <div className="rounded-xl bg-gray-50 p-2 text-diyar-brown shadow-sm">
                {isLogo ? <ImageIcon size={20} /> : <Upload size={20} />}
              </div>
              <span className="mt-2 text-xs font-bold text-gray-500">{t('b2b.partner.uploadImage')}</span>
            </>
          )}
        </button>
      )}

      <p className="text-xs text-gray-500">{hint}</p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleFile(file);
          }
          event.target.value = '';
        }}
      />

      {value ? (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="mt-2 text-xs font-bold text-diyar-brown hover:underline cursor-pointer disabled:opacity-60"
        >
          {t('b2b.partner.replaceImage')}
        </button>
      ) : null}
    </div>
  );
}
