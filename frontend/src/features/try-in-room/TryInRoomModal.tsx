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
  RotateCw,
  FlipHorizontal,
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
  const [productRotation, setProductRotation] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 50,
    initY: 65,
  });

  const { phase, sourceUrl, resultUrl, confirming, errorKey, submitFile, reset } =
    useTryInRoomFlow({ productId, productImageUrl });

  /**
   * Strictly clamps coordinates so the furniture item NEVER goes outside the photo boundaries,
   * accounting for container size, scale, and rotation footprint.
   */
  const clampCoords = useCallback(
    (rawX: number, rawY: number, scale: number, rotDeg: number = 0) => {
      const rect = previewContainerRef.current?.getBoundingClientRect();
      const contW = rect?.width || 560;
      const contH = rect?.height || 420;
      const baseSize = 140 * scale;
      const rad = (rotDeg * Math.PI) / 180;
      const rotW = Math.abs(baseSize * Math.cos(rad)) + Math.abs(baseSize * Math.sin(rad));
      const rotH = Math.abs(baseSize * Math.sin(rad)) + Math.abs(baseSize * Math.cos(rad));
      const halfWPercent = (rotW / 2 / contW) * 100;
      const halfHPercent = (rotH / 2 / contH) * 100;
      const minX = Math.min(48, Math.max(3, halfWPercent));
      const maxX = Math.max(minX, 100 - halfWPercent);
      const minY = Math.min(48, Math.max(3, halfHPercent));
      const maxY = Math.max(minY, 100 - halfHPercent);
      return {
        x: Math.round(Math.max(minX, Math.min(maxX, rawX))),
        y: Math.round(Math.max(minY, Math.min(maxY, rawY))),
      };
    },
    [],
  );

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
    const { x: nextX, y: nextY } = clampCoords(
      dragStartRef.current.initX + dx,
      dragStartRef.current.initY + dy,
      productScale,
      productRotation,
    );
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

  const updateScale = (delta: number) => {
    setProductScale((prevScale) => {
      const nextScale = Math.min(2.0, Math.max(0.4, Number((prevScale + delta).toFixed(1))));
      setProductX((currX) => clampCoords(currX, productY, nextScale, productRotation).x);
      setProductY((currY) => clampCoords(productX, currY, nextScale, productRotation).y);
      return nextScale;
    });
  };

  const updateRotation = (delta: number) => {
    setProductRotation((prevRot) => {
      const nextRot = (prevRot + delta + 360) % 360;
      setProductX((currX) => clampCoords(currX, productY, productScale, nextRot).x);
      setProductY((currY) => clampCoords(productX, currY, productScale, nextRot).y);
      return nextRot;
    });
  };

  const toggleFlip = () => {
    setIsFlipped((f) => !f);
  };

  const resetTransform = () => {
    setProductX(50);
    setProductY(65);
    setProductScale(1.0);
    setProductRotation(0);
    setIsFlipped(false);
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
      sessionStorage.setItem('diyar:try-in-room:product-flipped', isFlipped ? '1' : '0');
      sessionStorage.setItem('diyar:try-in-room:product-rotation', String(productRotation));
      sessionStorage.setItem('diyar:try-in-room:product-scale', String(productScale));
      sessionStorage.setItem('diyar:try-in-room:product-x', String(productX));
      sessionStorage.setItem('diyar:try-in-room:product-y', String(productY));
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
                        transform: `translate(-50%, -50%) scale(${isFlipped ? -productScale : productScale}, ${productScale}) rotate(${productRotation}deg)`,
                        cursor: isDragging ? 'grabbing' : 'grab',
                      }}
                      className={`absolute z-10 touch-none flex flex-col items-center group ${
                        isDragging ? '' : 'transition-transform duration-150 ease-out'
                      }`}
                    >
                      <img
                        src={productImageUrl}
                        alt="المنتج"
                        className="max-h-[140px] max-w-[140px] object-contain drop-shadow-[0_16px_20px_rgba(0,0,0,0.5)] pointer-events-none select-none"
                        data-testid="try-in-room-result"
                        draggable={false}
                      />
                      {/* Blender-style corner accents + outline when hovered or active */}
                      <div
                        className={`absolute -inset-1 border border-diyar-brown/60 rounded-lg pointer-events-none transition-opacity ${
                          isDragging ? 'opacity-100 ring-2 ring-diyar-brown/40' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <span className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-diyar-brown rounded-tl-sm" />
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-diyar-brown rounded-tr-sm" />
                        <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-diyar-brown rounded-bl-sm" />
                        <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-diyar-brown rounded-br-sm" />
                      </div>
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

                  {/* D-Pad, Scale, Flip & Rotate Controls */}
                  {productImageUrl ? (
                    <div className="absolute bottom-2 start-2 z-20 flex flex-wrap items-center gap-1 rounded-xl bg-diyar-dark/90 p-1 text-white shadow-lg backdrop-blur-md border border-white/10 pointer-events-auto">
                      {/* Movement Nudges */}
                      <button
                        type="button"
                        onClick={() => setProductY((y) => clampCoords(productX, y - 5, productScale, productRotation).y)}
                        className="p-1 hover:bg-white/20 rounded transition cursor-pointer"
                        title="تحريك لأعلى"
                        aria-label="تحريك لأعلى"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setProductY((y) => clampCoords(productX, y + 5, productScale, productRotation).y)}
                        className="p-1 hover:bg-white/20 rounded transition cursor-pointer"
                        title="تحريك لأسفل"
                        aria-label="تحريك لأسفل"
                      >
                        <ArrowDown size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setProductX((x) => clampCoords(x - 5, productY, productScale, productRotation).x)}
                        className="p-1 hover:bg-white/20 rounded transition cursor-pointer"
                        title="تحريك لليسار"
                        aria-label="تحريك لليسار"
                      >
                        <ArrowLeft size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setProductX((x) => clampCoords(x + 5, productY, productScale, productRotation).x)}
                        className="p-1 hover:bg-white/20 rounded transition cursor-pointer"
                        title="تحريك لليمين"
                        aria-label="تحريك لليمين"
                      >
                        <ArrowRight size={12} />
                      </button>

                      <div className="h-3 w-px bg-white/20 mx-0.5" />

                      {/* Zoom Controls */}
                      <button
                        type="button"
                        onClick={() => updateScale(0.1)}
                        className="p-1 hover:bg-white/20 rounded transition cursor-pointer"
                        title="تكبير"
                        aria-label="تكبير"
                      >
                        <ZoomIn size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateScale(-0.1)}
                        className="p-1 hover:bg-white/20 rounded transition cursor-pointer"
                        title="تصغير"
                        aria-label="تصغير"
                      >
                        <ZoomOut size={12} />
                      </button>

                      <div className="h-3 w-px bg-white/20 mx-0.5" />

                      {/* Flip / Face Opposite Controls */}
                      <button
                        type="button"
                        onClick={toggleFlip}
                        className={`p-1 rounded transition cursor-pointer ${
                          isFlipped ? 'bg-diyar-brown text-white ring-1 ring-white/40' : 'hover:bg-white/20'
                        }`}
                        title="عكس الاتجاه (الوجه المقابل)"
                        aria-label="عكس الاتجاه أفقيًا"
                      >
                        <FlipHorizontal size={12} />
                      </button>

                      {/* Rotation Controls */}
                      <button
                        type="button"
                        onClick={() => updateRotation(-15)}
                        className="p-1 hover:bg-white/20 rounded transition cursor-pointer"
                        title="تدوير عكس عقارب الساعة (-15°)"
                        aria-label="تدوير -15°"
                      >
                        <RotateCcw size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateRotation(15)}
                        className="p-1 hover:bg-white/20 rounded transition cursor-pointer"
                        title="تدوير مع عقارب الساعة (+15°)"
                        aria-label="تدوير +15°"
                      >
                        <RotateCw size={12} />
                      </button>
                      {productRotation !== 0 ? (
                        <span className="px-1 text-[9px] font-mono font-bold text-amber-300">
                          {Math.round(productRotation)}°
                        </span>
                      ) : null}

                      <div className="h-3 w-px bg-white/20 mx-0.5" />

                      {/* Reset Transform */}
                      <button
                        type="button"
                        onClick={resetTransform}
                        className="p-1 hover:bg-white/20 rounded transition cursor-pointer text-gray-300 hover:text-white"
                        title="إعادة ضبط الموضع والحجم"
                        aria-label="إعادة ضبط"
                      >
                        <RotateCcw size={11} className="rotate-180" />
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
