import React, { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, Search, UploadCloud, X } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale.ts';
import { useVisualSearch } from '../../hooks/useVisualSearch.ts';
import { resolveVisualSearchErrorKey, validateVisualSearchFile } from '../../api/visualSearch.ts';
import { saveVisualSearchSession } from '../../lib/visualSearchSession.ts';
import { VISUAL_SEARCH_DEFAULT_PER_PAGE, type VisualSearchResponse } from '../../types/visualSearch.ts';

interface ImageSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResults: (payload: VisualSearchResponse) => void;
}

export function ImageSearchModal({ isOpen, onClose, onResults }: ImageSearchModalProps) {
  const { t } = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const visualSearch = useVisualSearch();

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!isOpen) {
    return null;
  }

  const clearSelection = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorKey(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const validationError = validateVisualSearchFile(file);
    if (validationError) {
      setErrorKey(validationError);
      clearSelection();
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setErrorKey(null);
  };

  const handleSubmit = async () => {
    if (!selectedFile || !previewUrl) {
      return;
    }

    setErrorKey(null);

    try {
      const response = await visualSearch.mutateAsync({
        file: selectedFile,
        page: 1,
        perPage: VISUAL_SEARCH_DEFAULT_PER_PAGE,
      });
      await saveVisualSearchSession({
        searchId: response.meta.search_id,
        file: selectedFile,
      });
      onResults(response);
      onClose();
      clearSelection();
    } catch (error) {
      setErrorKey(resolveVisualSearchErrorKey(error));
    }
  };

  const errorMessage = errorKey
    ? t(`catalog.search.visualSearchErrors.${errorKey}`)
    : null;

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

        <div className="p-6 space-y-4">
          {!selectedFile ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center cursor-pointer hover:border-diyar-brown/40 transition-colors"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
                <UploadCloud size={28} className="text-diyar-brown" />
              </div>
              <p className="font-bold text-lg text-diyar-dark mb-2">{t('catalog.search.imageSearchUploadTitle')}</p>
              <p className="text-sm text-gray-500">{t('catalog.search.imageSearchUploadHint')}</p>
            </button>
          ) : (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                <img
                  src={previewUrl ?? undefined}
                  alt={t('catalog.search.uploadedImage')}
                  className="mx-auto max-h-64 w-full object-contain"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={clearSelection}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-600 cursor-pointer"
                >
                  {t('catalog.search.imageSearchRemove')}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={visualSearch.isPending}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-diyar-dark px-4 py-3 text-sm font-bold text-white cursor-pointer disabled:opacity-60"
                >
                  {visualSearch.isPending ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      {t('catalog.search.imageSearchSearching')}
                    </>
                  ) : (
                    <>
                      <Search size={18} />
                      {t('catalog.search.imageSearch')}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {errorMessage ? (
            <p className="text-sm text-red-600" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  );
}
