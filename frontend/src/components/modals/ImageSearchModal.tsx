import React, { useRef } from 'react';
import { Camera, X, UploadCloud, Search } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale.ts';

interface ImageSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  disabled?: boolean;
}

export function ImageSearchModal({ isOpen, onClose, disabled = false }: ImageSearchModalProps) {
  const { t } = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
        aria-label={t('catalog.search.filters.close')}
        onClick={onClose}
      />

      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-search-modal-title"
      >
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 id="image-search-modal-title" className="text-xl font-bold text-diyar-dark flex items-center gap-2">
            <Camera className="text-diyar-brown" size={24} />
            {t('catalog.search.imageSearch')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('catalog.search.filters.close')}
            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-diyar-dark transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {disabled ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
                <UploadCloud size={28} className="text-gray-300" />
              </div>
              <h3 className="font-bold text-lg text-diyar-dark mb-2">
                {t('catalog.search.visualSearchSoon')}
              </h3>
              <p className="text-sm text-gray-500">{t('catalog.search.visualSearchSoonDescription')}</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl bg-diyar-dark px-6 py-3 text-sm font-bold text-white cursor-pointer"
              >
                <Search size={18} />
                {t('catalog.search.imageSearch')}
              </button>
              <input ref={fileInputRef} type="file" className="hidden" accept="image/*" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
