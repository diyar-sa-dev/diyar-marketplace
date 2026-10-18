import React, { useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  ImagePlus,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import { useModalDialog } from '../../hooks/useModalDialog.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { vendorButtonClass } from '../../lib/vendorProductValidation.ts';
import { TryInRoomShimmer } from './TryInRoomShimmer.tsx';
import { useTryInRoomFlow } from './useTryInRoomFlow.ts';

interface TryInRoomModalProps {
  productId: string;
  productImageUrl?: string;
  open: boolean;
  onClose: () => void;
}

export function TryInRoomModal({
  productId,
  productImageUrl,
  open,
  onClose,
}: TryInRoomModalProps) {
  const { t } = useLocale();
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const roomDataUrlRef = useRef<string | null>(null);

  const [productX, setProductX] = useState(50);
  const [productY, setProductY] = useState(65);
  const [productScale, setProductScale] = useState(1.0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 50,
    initY: 65,
  });

  const { phase, sourceUrl, resultUrl, confirming, errorKey, submitFile, reset } =
    useTryInRoomFlow({ productId, productImageUrl });

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: productX,
      initY: productY,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !previewContainerRef.current) return;
    const rect = previewContainerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragStartRef.current.startX) / rect.width) * 100;
    const dy = ((e.clientY - dragStartRef.current.startY) / rect.height) * 100;
    const nextX = Math.max(10, Math.min(90, Math.round(dragStartRef.current.initX + dx)));
    const nextY = Math.max(10, Math.min(90, Math.round(dragStartRef.current.initY + dy)));
    setProductX(nextX);
    setProductY(nextY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe release
      }
      setIsDragging(false);
    }
  };

  const handleOpenDesigner = () => {
    if (typeof sessionStorage !== 'undefined') {
      const photoToSave = roomDataUrlRef.current || sourceUrl;
      if (photoToSave) {
        sessionStorage.setItem('diyar:try-in-room:photo', photoToSave);
      }
      if (productId) {
        sessionStorage.setItem('diyar:try-in-room:product-id', productId);
      }
    }
    onClose();
  };

  useModalDialog(open, () => {
    reset();
    onClose();
  }, panelRef);

  if (!open) {
    return null;
  }

  const ready = Boolean(resultUrl);
  const showActions = ready || phase === 'completed';
  const pickPhoto = () => inputRef.current?.click();

  return (
    <div className="fixed inset-0 z-100 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:bg-black/80 sm:p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="try-in-room-title"
        data-testid="try-in-room-dialog"
        className="relative flex max-h-[100dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-3xl"
      >
        <button
          type="button"
          onClick={() => {
            reset();
            onClose();
          }}
          className={`${vendorButtonClass} absolute top-3 end-3 z-20 rounded-full bg-white/95 p-2 text-gray-500 shadow-md hover:text-diyar-dark`}
          aria-label={t('common.close')}
        >
          <X size={20} />
        </button>

        <div className="shrink-0 bg-diyar-dark px-5 py-5 pe-14 text-white sm:px-8 sm:py-7">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-diyar-brown">
              <Sparkles className="text-diyar-cream" size={20} aria-hidden />
            </div>
            <div className="min-w-0">
              <h3 id="try-in-room-title" className="text-lg font-bold sm:text-2xl">
                {t('catalog.productDetail.tryInRoomShort')}
              </h3>
              <p className="mt-1 max-w-md text-xs leading-relaxed text-white/75 sm:text-sm">
                {t('tryInRoom.uploadHint')}
              </p>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6 md:p-8">
          {sourceUrl ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <figure className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                <div className="aspect-4/3 bg-gray-100">
                  <img
                    src={sourceUrl}
                    alt={t('tryInRoom.yourRoom')}
                    className="h-full w-full object-cover"
                  />
                </div>
                <figcaption className="px-3 py-2 text-center text-xs text-gray-500">
                  {t('tryInRoom.yourRoom')}
                </figcaption>
              </figure>
              <figure
                className="relative overflow-hidden rounded-2xl border border-diyar-brown/30 bg-gray-50 select-none"
                aria-busy={confirming}
              >
                <div
                  ref={previewContainerRef}
                  className="relative aspect-4/3 w-full bg-gray-100 touch-none overflow-hidden"
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                >
                  <img
                    src={sourceUrl}
                    alt={t('tryInRoom.yourRoom')}
                    className="h-full w-full object-cover pointer-events-none select-none"
                  />

                  {/* Interactive Product Positioning Layer */}
                  {productImageUrl ? (
                    <div
                      onPointerDown={handlePointerDown}
                      style={{
                        left: `${productX}%`,
                        top: `${productY}%`,
                        transform: `translate(-50%, -50%) scale(${productScale})`,
                        cursor: isDragging ? 'grabbing' : 'grab',
                      }}
                      className="absolute z-10 touch-none flex flex-col items-center group transition-transform"
                    >
                      <img
                        src={productImageUrl}
                        alt="المنتج"
                        className="max-h-[140px] max-w-[140px] object-contain drop-shadow-[0_16px_20px_rgba(0,0,0,0.5)] pointer-events-none"
                        data-testid="try-in-room-result"
                      />
                      <div className="absolute inset-0 border border-dashed border-diyar-brown/60 rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ) : resultUrl ? (
                    <img
                      src={resultUrl}
                      alt={t('tryInRoom.preview')}
                      className="h-full w-full object-cover"
                      data-testid="try-in-room-result"
                    />
                  ) : (
                    <div className="absolute inset-0 overflow-hidden" data-testid="try-in-room-skeleton">
                      <img
                        src={sourceUrl}
                        alt=""
                        className="h-full w-full object-cover opacity-40 blur-[1px]"
                      />
                      <TryInRoomShimmer />
                    </div>
                  )}

                  {/* D-Pad & Scale Controls */}
                  {productImageUrl ? (
                    <div className="absolute bottom-2 start-2 z-20 flex items-center gap-1 rounded-xl bg-diyar-dark/85 p-1 text-white shadow-md backdrop-blur-xs border border-white/10 pointer-events-auto">
                      <button
                        type="button"
                        onClick={() => setProductY((y) => Math.max(10, y - 5))}
                        className="p-1 hover:bg-white/20 rounded transition cursor-pointer"
                        title="تحريك لأعلى"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setProductY((y) => Math.min(90, y + 5))}
                        className="p-1 hover:bg-white/20 rounded transition cursor-pointer"
                        title="تحريك لأسفل"
                      >
                        <ArrowDown size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setProductX((x) => Math.max(10, x - 5))}
                        className="p-1 hover:bg-white/20 rounded transition cursor-pointer"
                        title="تحريك لليسار"
                      >
                        <ArrowLeft size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setProductX((x) => Math.min(90, x + 5))}
                        className="p-1 hover:bg-white/20 rounded transition cursor-pointer"
                        title="تحريك لليمين"
                      >
                        <ArrowRight size={12} />
                      </button>
                      <div className="h-3 w-px bg-white/20" />
                      <button
                        type="button"
                        onClick={() => setProductScale((s) => Math.min(2.0, Number((s + 0.1).toFixed(1))))}
                        className="p-1 hover:bg-white/20 rounded transition cursor-pointer"
                        title="تكبير"
                      >
                        <ZoomIn size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setProductScale((s) => Math.max(0.4, Number((s - 0.1).toFixed(1))))}
                        className="p-1 hover:bg-white/20 rounded transition cursor-pointer"
                        title="تصغير"
                      >
                        <ZoomOut size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setProductX(50);
                          setProductY(65);
                          setProductScale(1.0);
                        }}
                        className="p-1 hover:bg-white/20 rounded transition cursor-pointer"
                        title="إعادة ضبط"
                      >
                        <RotateCcw size={12} />
                      </button>
                    </div>
                  ) : null}

                  {confirming ? <TryInRoomShimmer /> : null}
                </div>
                <figcaption className="px-3 py-2 text-center text-xs font-medium text-diyar-dark flex items-center justify-center gap-1.5">
                  <span>{confirming ? t('tryInRoom.processing') : t('tryInRoom.preview')}</span>
                  <span className="text-[10px] text-muted-foreground">• اسحب القطعة لتحديد موضعها</span>
                </figcaption>
              </figure>
            </div>
          ) : (
            <button
              type="button"
              data-testid="try-in-room-choose-photo"
              onClick={pickPhoto}
              className={`${vendorButtonClass} flex min-h-[220px] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-diyar-brown/35 bg-diyar-brown/5 px-4 py-10 text-center sm:min-h-[280px]`}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-diyar-brown text-white">
                <ImagePlus size={26} aria-hidden />
              </span>
              <span className="text-base font-bold text-diyar-dark">{t('tryInRoom.choosePhoto')}</span>
              <span className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                {t('tryInRoom.uploadHint')}
              </span>
            </button>
          )}

          {phase === 'idle' && sourceUrl ? (
            <button
              type="button"
              data-testid="try-in-room-choose-photo"
              onClick={pickPhoto}
              className={`${vendorButtonClass} flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-diyar-brown py-3 font-medium text-white`}
            >
              <Upload size={18} />
              {t('tryInRoom.choosePhoto')}
            </button>
          ) : null}

          {showActions ? (
            <div className="flex flex-col items-center gap-3 py-1 text-center">
              <div className="flex items-center gap-2 text-sm font-medium text-diyar-dark">
                <CheckCircle
                  size={18}
                  className={confirming ? 'text-diyar-brown/70' : 'text-emerald-700'}
                />
                <p aria-live="polite">
                  {confirming ? t('tryInRoom.processing') : t('tryInRoom.completed')}
                </p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    pickPhoto();
                  }}
                  className={`${vendorButtonClass} min-h-11 rounded-xl border border-diyar-brown/30 px-4 text-sm text-diyar-brown`}
                >
                  {t('tryInRoom.tryAnother')}
                </button>
                <Link
                  to="/profile/room-designer"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-diyar-dark px-5 text-sm font-bold text-white shadow-md hover:bg-diyar-dark/90 active:scale-95 transition-all"
                  onClick={handleOpenDesigner}
                >
                  <Sparkles size={16} className="text-amber-300" />
                  <span>{t('tryInRoom.openDesigner')}</span>
                </Link>
              </div>
            </div>
          ) : null}

          {phase === 'failed' ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-center text-red-700">
              <AlertCircle size={22} />
              <p className="text-sm font-medium">{t(`tryInRoom.errors.${errorKey ?? 'request_failed'}`)}</p>
              <button
                type="button"
                onClick={() => {
                  reset();
                  pickPhoto();
                }}
                className={`${vendorButtonClass} min-h-11 text-sm text-diyar-brown underline`}
              >
                {t('tryInRoom.retry')}
              </button>
            </div>
          ) : null}

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            data-testid="try-in-room-file"
            className="sr-only"
            tabIndex={-1}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                  roomDataUrlRef.current = reader.result as string;
                };
                reader.readAsDataURL(file);
                void submitFile(file);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
