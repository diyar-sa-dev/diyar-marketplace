import React, { useRef } from 'react';
import { FileText, Loader2, Upload, X } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale.ts';
import { formatAttachmentSize } from '../../lib/providerDashboardUi.ts';

type ProviderQuotationUploadProps = {
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  disabled?: boolean;
};

export function ProviderQuotationUpload({
  file,
  onChange,
  error,
  disabled = false,
}: ProviderQuotationUploadProps) {
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = file?.type.startsWith('image/') ? URL.createObjectURL(file) : null;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-gray-700">
        {t('providerDashboard.clientRequestDetails.attachQuotation')}
      </label>
      {file ? (
        <div className="relative rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
          {preview ? (
            <img src={preview} alt="" className="w-full h-36 object-cover" />
          ) : (
            <div className="flex items-center gap-3 p-4">
              <div className="w-12 h-12 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-diyar-brown">
                <FileText size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-800 truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{formatAttachmentSize(file.size)}</p>
              </div>
            </div>
          )}
          <div className="absolute top-2 end-2 flex gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              className="px-2.5 py-1.5 rounded-lg bg-white/95 text-xs font-bold text-diyar-brown border border-gray-200 hover:bg-white cursor-pointer disabled:opacity-60"
            >
              {t('providerDashboard.clientRequestDetails.quotationReplace')}
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(null)}
              className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center hover:bg-red-600 cursor-pointer disabled:opacity-60"
              aria-label={t('providerDashboard.clientRequestDetails.quotationDelete')}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="flex items-center justify-center gap-2 w-full bg-gray-50 border border-dashed border-gray-300 rounded-xl px-4 py-6 text-sm text-gray-600 hover:bg-gray-100 hover:border-diyar-brown transition-colors cursor-pointer disabled:opacity-60"
        >
          {disabled ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Upload size={16} className="text-gray-400" />
          )}
          <span>{t('providerDashboard.clientRequestDetails.attachFile')}</span>
        </button>
      )}
      <p className="text-xs text-gray-400">
        {t('providerDashboard.clientRequestDetails.quotationHint')}
      </p>
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const next = e.target.files?.[0] ?? null;
          onChange(next);
          e.target.value = '';
        }}
      />
    </div>
  );
}
