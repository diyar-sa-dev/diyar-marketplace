import React, { useRef } from 'react';
import { Sparkles, Upload, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useModalDialog } from '../../hooks/useModalDialog.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { vendorButtonClass } from '../../lib/vendorProductValidation.ts';
import { useTryInRoomFlow } from './useTryInRoomFlow.ts';

interface TryInRoomModalProps {
  productId: string;
  open: boolean;
  onClose: () => void;
}

export function TryInRoomModal({ productId, open, onClose }: TryInRoomModalProps) {
  const { t } = useLocale();
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { phase, job, previewUrl, errorKey, submitFile, reset } = useTryInRoomFlow(productId);

  useModalDialog(open, () => {
    reset();
    onClose();
  }, panelRef);

  if (!open) {
    return null;
  }

  const busy = phase === 'uploading' || phase === 'polling';
  const canPickFile = phase === 'idle' || phase === 'failed' || phase === 'completed';

  return (
    <div className="fixed inset-0 bg-black/80 z-100 flex items-center justify-center p-4 backdrop-blur-sm">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="try-in-room-title"
        className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative"
      >
        <button
          type="button"
          onClick={() => {
            reset();
            onClose();
          }}
          className={`${vendorButtonClass} absolute top-4 right-4 bg-white text-gray-500 hover:text-black p-2 rounded-full shadow-md z-10`}
          aria-label={t('common.close')}
        >
          <X size={20} />
        </button>
        <div className="p-6 md:p-8 text-center bg-diyar-dark text-white">
          <Sparkles className="w-12 h-12 text-yellow-400 mx-auto mb-4" aria-hidden />
          <h3 id="try-in-room-title" className="text-xl md:text-2xl font-bold mb-2">
            {t('catalog.productDetail.tryInRoomShort')}
          </h3>
          <p className="text-sm text-white/80 max-w-md mx-auto">
            {t('tryInRoom.uploadHint')}
          </p>
        </div>
        <div className="p-6 md:p-8 space-y-4">
          {previewUrl ? (
            <div className="rounded-2xl overflow-hidden border border-gray-100 max-h-48 flex items-center justify-center bg-gray-50">
              <img src={previewUrl} alt="" className="max-h-48 w-full object-contain" />
            </div>
          ) : null}

          {phase === 'idle' && (
            <button
              type="button"
              disabled={!canPickFile || busy}
              onClick={() => inputRef.current?.click()}
              className={`${vendorButtonClass} w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-diyar-brown text-white font-medium disabled:opacity-50`}
            >
              <Upload size={18} />
              {t('tryInRoom.choosePhoto')}
            </button>
          )}

          {(phase === 'uploading' || phase === 'polling') && (
            <div className="flex items-center justify-center gap-2 text-diyar-dark py-4">
              <Loader2 className="animate-spin" size={22} />
              <span>{phase === 'uploading' ? t('tryInRoom.uploading') : t('tryInRoom.processing')}</span>
            </div>
          )}

          {phase === 'completed' && (
            <div className="flex flex-col items-center gap-2 text-green-700 py-2">
              <CheckCircle size={28} />
              <p className="font-medium">{t('tryInRoom.completedStub')}</p>
              {job?.result?.kind === 'stub' ? (
                <p className="text-xs text-gray-500">{t('tryInRoom.stubNote')}</p>
              ) : null}
            </div>
          )}

          {phase === 'failed' && (
            <div className="flex flex-col items-center gap-2 text-red-600 py-2">
              <AlertCircle size={28} />
              <p className="font-medium">{t(`tryInRoom.errors.${errorKey ?? 'request_failed'}`)}</p>
              <button
                type="button"
                onClick={() => {
                  reset();
                  inputRef.current?.click();
                }}
                className={`${vendorButtonClass} text-sm text-diyar-brown underline`}
              >
                {t('tryInRoom.retry')}
              </button>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) {
                void submitFile(file);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
