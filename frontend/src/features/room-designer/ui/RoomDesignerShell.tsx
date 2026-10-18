import {
  Box,
  Boxes,
  Camera,
  LayoutGrid,
  Maximize,
  Maximize2,
  Minimize2,
  Redo2,
  RefreshCw,
  RotateCcw,
  RotateCw,
  ScanLine,
  ShoppingCart,
  Sparkles,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { ErrorBoundary } from '../../../components/common/ErrorBoundary.tsx';
import { useLocale } from '../../../hooks/useLocale.ts';
import { useModalDialog } from '../../../hooks/useModalDialog.ts';
import { TryInRoomShimmer } from '../../try-in-room/TryInRoomShimmer.tsx';
import { useTryInRoomFlow } from '../../try-in-room/useTryInRoomFlow.ts';
import { applySuggestedLayout } from '../application/applySuggestedLayout.ts';
import { addCatalogProductToSession } from '../adapters/addCatalogProductToSession.ts';
import { deriveCartLinesFromDocument } from '../adapters/deriveCartLinesFromDocument.ts';
import { DesignerSession } from '../application/DesignerSession.ts';
import {
  engineCanRedo,
  engineCanUndo,
  type SpatialEngineState,
} from '../application/spatialEngine.ts';
import { fetchRoomLayoutSuggestion } from '../persistence/roomDesignApi.ts';
import { useRoomDesignAutosave } from '../persistence/useRoomDesignAutosave.ts';
import { useRoomDesignAddToCart } from '../persistence/useRoomDesignAddToCart.ts';
import { AddToCartReviewModal } from './AddToCartReviewModal.tsx';
import { CatalogPanel } from './CatalogPanel.tsx';
import { RoomDesignerCanvasHost, type RoomCanvasControls } from './RoomDesignerCanvasHost.tsx';
import {
  hasPresentationModeToggle,
  isRoomDesignerAiSpatialEnabled,
  isRoomDesignerArEnabled,
  isRoomDesigner25dEnabled,
  isRoomDesigner3dEnabled,
} from '../config/roomDesignerFeatures.ts';
import { resolveArAssetUrl } from '../adapters/resolveArAssetUrl.ts';
import { nextPresentationMode, type RoomProjectionMode } from '../renderer/projectionMode.ts';
import { listRoomPresets } from '../domain/room/presets.ts';
import { useLargeScreen } from './useLargeScreen.ts';

export type RoomDesignerShellProps = {
  engine: SpatialEngineState;
  designId?: string;
  designVersion?: number;
  /** Stable across attaching a newly-created design id so local furniture is not wiped. */
  sessionResetKey?: string;
  className?: string;
};

const touchBtn =
  'inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-diyar-brown/20 bg-white text-diyar-dark shadow-xs hover:border-diyar-brown hover:bg-diyar-cream/30 px-2.5 text-xs sm:text-sm font-medium transition-all disabled:opacity-40 cursor-pointer';

export function RoomDesignerShell({
  engine: initialEngine,
  designId,
  designVersion,
  sessionResetKey,
  className,
}: RoomDesignerShellProps) {
  const [engine, setEngine] = useState(initialEngine);
  const sessionRef = useRef<DesignerSession | null>(null);
  const [, bumpToolbar] = useReducer((n: number) => n + 1, 0);
  const isLargeScreen = useLargeScreen();
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [projection, setProjection] = useState<RoomProjectionMode>('top_down');
  const presentationToggleEnabled = hasPresentationModeToggle();
  const [addingProduct, setAddingProduct] = useState(false);
  const [addProductError, setAddProductError] = useState<string | null>(null);
  const [cartError, setCartError] = useState<string | null>(null);
  const [layoutSuggesting, setLayoutSuggesting] = useState(false);
  const [layoutError, setLayoutError] = useState<string | null>(null);
  const aiSpatialEnabled = isRoomDesignerAiSpatialEnabled();
  const arEnabled = isRoomDesignerArEnabled();
  const [arError, setArError] = useState<string | null>(null);
  const catalogSheetRef = useRef<HTMLDivElement>(null);
  const tryInRoomInputRef = useRef<HTMLInputElement>(null);
  const canvasControlsRef = useRef<RoomCanvasControls | null>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canvasCrashKey, setCanvasCrashKey] = useState(0);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = shellRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    } else {
      void el.requestFullscreen().catch(() => {
        setIsFullscreen((prev) => !prev);
      });
    }
  }, []);
  const { t } = useLocale();
  useModalDialog(catalogOpen && !isLargeScreen, () => setCatalogOpen(false), catalogSheetRef);

  const selectedThumb = engine.document.items[0]?.snapshot.thumbnail_url ?? undefined;
  const {
    resultUrl: tryInRoomPreview,
    confirming: tryInRoomConfirming,
    errorKey: tryInRoomErrorKey,
    submitFile: submitTryInRoom,
    reset: resetTryInRoom,
  } = useTryInRoomFlow({
    roomDesignId: designId,
    productImageUrl: selectedThumb ?? undefined,
  });

  const getDocument = useCallback(
    () => sessionRef.current?.getDocument() ?? engine.document,
    [engine.document],
  );
  const autosave = useRoomDesignAutosave(designId, designVersion, getDocument);

  const addToCartMutation = useRoomDesignAddToCart(designId ?? '');
  const cartLines = useMemo(() => deriveCartLinesFromDocument(engine.document), [engine.document]);

  const syncStateLabel = (() => {
    if (!designId) return null;
    const snap = autosave.snapshot();
    if (!snap) return '—';
    switch (snap.syncState) {
      case 'SYNCED':
        return snap.dirty ? 'تغييرات محلية' : 'محفوظ';
      case 'SYNCING':
        return 'جاري الحفظ…';
      case 'LOCAL':
        return 'تغييرات محلية';
      case 'ERROR':
        return 'تعذّر الحفظ';
      case 'CONFLICT':
        return 'تعارض إصدار';
      default:
        return '—';
    }
  })();

  const handleEngineChange = useCallback(
    (state: SpatialEngineState) => {
      setEngine(state);
      autosave.markDirty();
      bumpToolbar();
    },
    [autosave],
  );

  const runSessionAction = useCallback(
    (action: (session: DesignerSession) => { ok: boolean; state: SpatialEngineState }) => {
      const session = sessionRef.current;
      if (!session) return;
      const result = action(session);
      if (result.ok) {
        setEngine(result.state);
        autosave.markDirty();
        bumpToolbar();
      }
    },
    [autosave],
  );

  const handleSelectProduct = useCallback(
    async (productId: string) => {
      const session = sessionRef.current;
      if (!session) return;
      setAddingProduct(true);
      setAddProductError(null);
      try {
        const result = await addCatalogProductToSession(session, productId);
        if ('error' in result) {
          setAddProductError(result.error.message);
        } else {
          setEngine(result.state);
          autosave.markDirty();
          bumpToolbar();
          if (!isLargeScreen) {
            setCatalogOpen(false);
          }
        }
      } catch (error) {
        setAddProductError((error as Error).message ?? 'تعذّر إضافة المنتج');
      } finally {
        setAddingProduct(false);
      }
    },
    [autosave, isLargeScreen],
  );

  const handleOpenAr = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) return;
    const selectedId = session.selectedIds[0];
    if (!selectedId) {
      setArError('حدّد قطعة أثاث أولاً');
      return;
    }
    const item = session.getDocument().items.find((i) => i.id === selectedId);
    const ref = item?.snapshot.asset_ref;
    if (!ref || !resolveArAssetUrl(ref)) {
      setArError('لا يوجد نموذج AR لهذه القطعة');
      return;
    }
    setArError(null);
    try {
      const { openArPreviewForAssetRef } = await import('../ar/openArPreview.ts');
      const result = await openArPreviewForAssetRef(ref);
      if (!result.ok) {
        setArError('العرض بالواقع المعزّز غير متاح على هذا الجهاز');
      }
    } catch {
      setArError('العرض بالواقع المعزّز غير متاح على هذا الجهاز');
    }
  }, []);

  const handleSuggestLayout = useCallback(async () => {
    const session = sessionRef.current;
    if (!session || !designId) return;
    setLayoutSuggesting(true);
    setLayoutError(null);
    try {
      const suggestion = await fetchRoomLayoutSuggestion(designId, { intent: 'arrange' });
      const doc = session.getDocument();
      const applied = applySuggestedLayout(session, doc, suggestion.commands);
      if ('reason' in applied) {
        setLayoutError(applied.reason);
        return;
      }
      setEngine(applied.state);
      autosave.markDirty();
      bumpToolbar();
    } catch (error) {
      setLayoutError((error as Error).message ?? 'تعذّر اقتراح الترتيب');
    } finally {
      setLayoutSuggesting(false);
    }
  }, [autosave, designId]);

  const handleConfirmCart = useCallback(async () => {
    if (!designId) return;
    setCartError(null);
    try {
      await addToCartMutation.mutateAsync(undefined);
      setCartModalOpen(false);
    } catch (error) {
      setCartError((error as Error).message ?? 'تعذّر الإضافة إلى السلة');
    }
  }, [addToCartMutation, designId]);

  const canUndo = engineCanUndo(engine);
  const canRedo = engineCanRedo(engine);

  return (
    <div
      ref={shellRef}
      className={`flex h-full min-h-0 flex-1 flex-col gap-2.5 overflow-hidden lg:grid lg:grid-cols-[minmax(280px,330px)_minmax(0,1fr)] lg:grid-rows-[auto_auto_minmax(0,1fr)] lg:gap-3 ${
        isFullscreen ? 'fixed inset-0 z-100 bg-[#fbf9f5] p-3' : ''
      } ${className ?? ''}`}
      data-testid="room-designer-shell"
      dir="rtl"
    >
      {/* Top Toolbar Ribbon */}
      <header className="flex shrink-0 items-center gap-2 overflow-x-auto overscroll-x-contain rounded-2xl border border-diyar-brown/20 bg-white p-2 shadow-2xs [-ms-overflow-style:none] [scrollbar-width:none] lg:col-span-2 [&::-webkit-scrollbar]:hidden">
        {/* History Group */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={touchBtn}
            aria-label="تراجع"
            title="تراجع (Ctrl+Z)"
            disabled={!canUndo}
            onClick={() => runSessionAction((s) => s.undo())}
          >
            <Undo2 size={16} />
          </button>
          <button
            type="button"
            className={touchBtn}
            aria-label="إعادة"
            title="إعادة (Ctrl+Y)"
            disabled={!canRedo}
            onClick={() => runSessionAction((s) => s.redo())}
          >
            <Redo2 size={16} />
          </button>
        </div>

        <div className="h-6 w-px bg-diyar-brown/15 shrink-0" />

        {/* Edit Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={touchBtn}
            aria-label="حذف العنصر المحدد"
            title="حذف القطعة المحددة"
            onClick={() => runSessionAction((s) => s.removeSelected())}
          >
            <Trash2 size={16} />
          </button>
          <button
            type="button"
            className={touchBtn}
            aria-label="إفراغ الغرفة"
            onClick={() => {
              runSessionAction((s) => s.applyCommands([{ type: 'CLEAR_ROOM' }]));
              resetTryInRoom();
            }}
          >
            <RefreshCw size={16} />
            <span className="hidden sm:inline">إفراغ الغرفة</span>
          </button>
          <button
            type="button"
            className={touchBtn}
            aria-label={isFullscreen ? 'الخروج من ملء الشاشة' : 'ملء الشاشة'}
            title={isFullscreen ? 'الخروج من ملء الشاشة (Esc)' : 'عرض بملء الشاشة'}
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize size={16} />}
            <span className="hidden sm:inline">{isFullscreen ? 'تصغير' : 'ملء الشاشة'}</span>
          </button>
        </div>

        <div className="h-6 w-px bg-diyar-brown/15 shrink-0" />

        {/* 2D / 2.5D / 3D Segmented Switcher */}
        {presentationToggleEnabled ? (
          <div className="inline-flex items-center rounded-xl border border-diyar-brown/20 bg-diyar-cream/40 p-0.5 shadow-xs shrink-0">
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                projection === 'top_down'
                  ? 'bg-diyar-brown text-white shadow-xs'
                  : 'text-diyar-dark/80 hover:bg-white/80'
              }`}
              aria-label="عرض علوي"
              onClick={() => setProjection('top_down')}
            >
              <Box size={14} />
              <span>2D علوي</span>
            </button>
            {isRoomDesigner25dEnabled() ? (
              <button
                type="button"
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                  projection === 'isometric_25d'
                    ? 'bg-diyar-brown text-white shadow-xs'
                    : 'text-diyar-dark/80 hover:bg-white/80'
                }`}
                aria-label="عرض منظور 2.5D"
                onClick={() => setProjection('isometric_25d')}
              >
                <LayoutGrid size={14} />
                <span>2.5D مجسم</span>
              </button>
            ) : null}
            {isRoomDesigner3dEnabled() ? (
              <button
                type="button"
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                  projection === 'room_3d'
                    ? 'bg-diyar-brown text-white shadow-xs'
                    : 'text-diyar-dark/80 hover:bg-white/80'
                }`}
                aria-label="عرض ثلاثي الأبعاد"
                onClick={() => setProjection('room_3d')}
              >
                <Boxes size={14} />
                <span>3D واقعي</span>
              </button>
            ) : null}
          </div>
        ) : null}

        {/* Try in Room (AI) */}
        {designId ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-linear-to-r from-diyar-brown to-[#735942] px-3 py-1 text-xs font-bold text-white shadow-xs hover:opacity-95 active:scale-95 transition-all cursor-pointer shrink-0"
              aria-label={t('tryInRoom.choosePhoto')}
              data-testid="try-in-room-open-designer"
              onClick={() => tryInRoomInputRef.current?.click()}
            >
              <Camera size={15} />
              <span className="hidden sm:inline">معاينة في غرفتك (AI)</span>
            </button>
            {tryInRoomPreview ? (
              <button
                type="button"
                onClick={resetTryInRoom}
                className="inline-flex min-h-9 items-center gap-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 px-2 py-1 text-xs font-bold hover:bg-amber-200 transition cursor-pointer"
                aria-label="إلغاء صورة الغرفة"
                title="إلغاء صورة الغرفة"
              >
                <X size={12} />
                <span className="hidden md:inline">إلغاء المعاينة</span>
              </button>
            ) : null}
          </div>
        ) : null}

        {/* AI Auto-Arrange */}
        {designId && aiSpatialEnabled ? (
          <button
            type="button"
            className={touchBtn}
            aria-label="اقتراح ترتيب ذكي"
            title="اقتراح ترتيب ذكي للمساحة"
            disabled={layoutSuggesting}
            onClick={() => void handleSuggestLayout()}
          >
            <Sparkles size={16} className="text-diyar-brown" />
            <span className="hidden md:inline">اقتراح ذكي</span>
          </button>
        ) : null}

        {arEnabled ? (
          <button
            type="button"
            className={touchBtn}
            aria-label="عرض بالواقع المعزّز"
            onClick={() => void handleOpenAr()}
          >
            <ScanLine size={16} />
          </button>
        ) : null}

        {/* Mobile Catalog Trigger */}
        {!isLargeScreen ? (
          <button
            type="button"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-diyar-brown px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-diyar-brown/90 active:scale-95 transition-all ms-auto cursor-pointer shrink-0"
            onClick={() => setCatalogOpen(true)}
          >
            <Sparkles size={14} />
            <span>المنتجات</span>
          </button>
        ) : null}

        {/* Autosave & Cart Review */}
        {designId ? (
          <div className="flex items-center gap-2 ms-auto shrink-0">
            <span
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-diyar-cream/60 px-2.5 py-1 text-[11px] font-semibold text-diyar-dark border border-diyar-brown/15"
              aria-live="polite"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${syncStateLabel === 'محفوظ' ? 'bg-emerald-600' : 'bg-amber-500 animate-pulse'}`} />
              {syncStateLabel}
            </span>
            <button
              type="button"
              className="relative inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-diyar-brown/20 bg-white text-diyar-dark hover:bg-diyar-brown hover:text-white shadow-xs transition-all cursor-pointer"
              onClick={() => setCartModalOpen(true)}
              aria-label="إضافة إلى السلة"
              title="مراجعة وإضافة قطع الغرفة للسلة"
            >
              <ShoppingCart size={17} />
              {cartLines.length > 0 ? (
                <span className="absolute -top-1.5 -end-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-diyar-brown px-1 text-[10px] font-black text-white shadow-xs">
                  {cartLines.length}
                </span>
              ) : null}
            </button>
          </div>
        ) : null}
      </header>

      {layoutError ? (
        <p className="text-sm text-destructive lg:col-span-2 bg-red-50 p-2.5 rounded-xl border border-red-200" role="alert">
          {layoutError}
        </p>
      ) : null}
      {arError ? (
        <p className="text-sm text-destructive lg:col-span-2 bg-red-50 p-2.5 rounded-xl border border-red-200" role="alert">
          {arError}
        </p>
      ) : null}
      {tryInRoomErrorKey ? (
        <p className="text-sm text-destructive lg:col-span-2 bg-red-50 p-2.5 rounded-xl border border-red-200" role="alert">
          {t(`tryInRoom.errors.${tryInRoomErrorKey}`)}
        </p>
      ) : null}

      {/* Room Presets Selection */}
      <div className="flex shrink-0 items-center gap-2 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] lg:col-span-2 [&::-webkit-scrollbar]:hidden" data-testid="room-designer-presets">
        <span className="text-xs font-bold text-diyar-dark whitespace-nowrap ps-0.5 flex items-center gap-1 shrink-0">
          <Sparkles size={13} className="text-diyar-brown" />
          طابع الغرفة:
        </span>
        {listRoomPresets().map((preset) => {
          const isActive = engine.document.room.preset_id === preset.id;
          const dimensions = `${preset.width_m} × ${preset.depth_m} م`;
          return (
            <button
              key={preset.id}
              type="button"
              className={`group inline-flex min-h-9 items-center gap-2 rounded-xl px-3 py-1 text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0 ${
                isActive
                  ? 'border-2 border-diyar-brown bg-diyar-brown text-white shadow-sm ring-2 ring-diyar-brown/20 scale-[1.01]'
                  : 'border border-diyar-brown/20 bg-white text-diyar-dark hover:bg-diyar-cream/40 hover:border-diyar-brown'
              }`}
              onClick={() =>
                runSessionAction((s) => s.applyCommands([{ type: 'APPLY_ROOM_PRESET', preset_id: preset.id }]))
              }
            >
              <span>{preset.name_ar}</span>
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-diyar-cream/60 text-diyar-dark/75 group-hover:bg-diyar-cream'
                }`}
              >
                {dimensions}
              </span>
            </button>
          );
        })}
      </div>

      {/* Desktop Catalog Sidebar */}
      {isLargeScreen ? (
        <aside
          className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-diyar-brown/20 bg-white p-3 shadow-2xs"
          aria-label="معرض المنتجات"
        >
          <div className="mb-2 flex items-center justify-between border-b border-diyar-brown/15 pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-diyar-brown text-white shadow-2xs">
                <Sparkles size={14} />
              </div>
              <h3 className="text-xs font-bold text-diyar-dark">معرض قطع الأثاث</h3>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">8 قطع بالصفحة</span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto ps-0.5 pe-1">
            <CatalogPanel onSelectProduct={handleSelectProduct} isAdding={addingProduct} />
          </div>
          {addProductError ? (
            <p className="mt-2 text-xs text-destructive bg-red-50 p-2 rounded-lg" role="alert">
              {addProductError}
            </p>
          ) : null}
        </aside>
      ) : null}

      {/* Canvas Viewport */}
      <div className="relative flex h-full min-h-[300px] lg:min-h-0 min-w-0 flex-1 flex-col rounded-2xl border-2 border-diyar-brown/25 bg-[#faf8f5] shadow-2xs overflow-hidden">
        {tryInRoomPreview ? (
          <img
            src={tryInRoomPreview}
            alt={t('tryInRoom.yourRoom')}
            className="pointer-events-none absolute inset-0 z-0 h-full w-full rounded-2xl object-cover opacity-50"
          />
        ) : null}
        {tryInRoomConfirming ? (
          <>
            <TryInRoomShimmer />
            <p className="pointer-events-none absolute top-3 start-3 z-20 rounded-full bg-diyar-dark/85 px-3 py-1 text-[11px] font-medium text-white shadow-md">
              {t('tryInRoom.processing')}
            </p>
          </>
        ) : null}

        {/* 3D Mode Live Interaction Hint */}
        {projection === 'room_3d' ? (
          <div className="pointer-events-none absolute top-3 end-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-diyar-dark/85 px-3 py-1 text-[11px] font-bold text-white shadow-md backdrop-blur-xs border border-white/10">
            <Boxes size={13} className="text-amber-300" />
            <span>تدوير 360° بالسحب • تكبير بالعجلة</span>
          </div>
        ) : null}

        {/* Floating Canvas Controls HUD */}
        <div
          className="absolute bottom-3 start-3 z-20 flex items-center gap-1 rounded-xl border border-diyar-brown/25 bg-white/95 p-1 shadow-md backdrop-blur-md"
          role="toolbar"
          aria-label="أدوات التحكم بالمنظور"
        >
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-diyar-dark hover:bg-diyar-cream hover:text-diyar-brown transition active:scale-95 cursor-pointer"
            onClick={() => canvasControlsRef.current?.zoomIn()}
            title="تكبير (+)"
            aria-label="تكبير"
          >
            <ZoomIn size={15} />
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-diyar-dark hover:bg-diyar-cream hover:text-diyar-brown transition active:scale-95 cursor-pointer"
            onClick={() => canvasControlsRef.current?.zoomOut()}
            title="تصغير (-)"
            aria-label="تصغير"
          >
            <ZoomOut size={15} />
          </button>
          <div className="h-4 w-px bg-diyar-brown/20 shrink-0" />
          {projection === 'room_3d' ? (
            <>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-diyar-dark hover:bg-diyar-cream hover:text-diyar-brown transition active:scale-95 cursor-pointer"
                onClick={() => canvasControlsRef.current?.rotate?.(-25)}
                title="تدوير لليسار"
                aria-label="تدوير لليسار"
              >
                <RotateCcw size={14} />
              </button>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-diyar-dark hover:bg-diyar-cream hover:text-diyar-brown transition active:scale-95 cursor-pointer"
                onClick={() => canvasControlsRef.current?.rotate?.(25)}
                title="تدوير لليمين"
                aria-label="تدوير لليمين"
              >
                <RotateCw size={14} />
              </button>
              <div className="h-4 w-px bg-diyar-brown/20 shrink-0" />
            </>
          ) : null}
          <button
            type="button"
            className="flex h-8 px-2 items-center justify-center gap-1 rounded-lg text-[11px] font-bold text-diyar-dark hover:bg-diyar-cream hover:text-diyar-brown transition active:scale-95 cursor-pointer"
            onClick={() => canvasControlsRef.current?.resetView()}
            title="إعادة ضبط زاوية الرؤية"
            aria-label="إعادة ضبط الرؤية"
          >
            <Maximize2 size={13} />
            <span className="hidden sm:inline">إعادة ضبط</span>
          </button>
        </div>

        <ErrorBoundary
          key={canvasCrashKey}
          fallback={
            <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 p-6 text-center" role="alert">
              <p className="text-sm text-muted-foreground">تعذّر عرض المصمم.</p>
              <button
                type="button"
                className={touchBtn}
                onClick={() => setCanvasCrashKey((key) => key + 1)}
              >
                إعادة المحاولة
              </button>
            </div>
          }
        >
          <RoomDesignerCanvasHost
            engine={engine}
            sessionResetKey={sessionResetKey ?? designId}
            fillContainer
            touchFriendly={!isLargeScreen}
            projection={projection}
            sessionRef={sessionRef}
            controlsRef={canvasControlsRef}
            onEngineChange={handleEngineChange}
            className="relative z-10 h-full w-full"
          />
        </ErrorBoundary>

        {/* Empty State Overlay */}
        {engine.document.items.length === 0 ? (
          <div className="pointer-events-none absolute inset-x-0 top-[18%] z-20 flex flex-col items-center px-4 text-center sm:px-6">
            <div className="rounded-3xl border border-diyar-brown/20 bg-white/95 p-6 shadow-lg backdrop-blur-md max-w-sm mx-auto">
              <div className="mb-3 mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-diyar-brown/10 text-diyar-brown shadow-xs">
                <Sparkles size={22} />
              </div>
              <p className="text-sm font-extrabold text-diyar-dark">ابدأ بتأثيث غرفتك</p>
              <p className="mt-1.5 text-xs leading-relaxed text-gray-600">
                اختر طابع الغرفة، ثم اضغط على أي قطعة أثاث من القائمة لإضافتها هنا.
              </p>
            </div>
          </div>
        ) : null}

        {/* Bottom Helper Hint Pill */}
        <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 z-20 hidden md:block text-center text-[11px] text-white">
          <span className="inline-block rounded-full bg-diyar-dark/80 px-4 py-1.5 backdrop-blur-md shadow-md border border-white/10 font-medium whitespace-nowrap">
            اسحب القطع، كبّرها أو دوّرها لترتيب غرفتك بسهولة
          </span>
        </p>

        {/* Hidden File Input (Strictly hidden to prevent "No file chosen" leakage) */}
        <input
          ref={tryInRoomInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          tabIndex={-1}
          data-testid="try-in-room-file-designer"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) {
              void submitTryInRoom(file);
            }
          }}
        />
      </div>

      {/* Mobile Catalog Bottom Sheet */}
      {!isLargeScreen && catalogOpen ? (
        <div
          className="fixed inset-0 z-100 flex flex-col justify-end bg-black/60 backdrop-blur-xs p-0"
          role="presentation"
          onClick={() => setCatalogOpen(false)}
        >
          <div
            ref={catalogSheetRef}
            className="flex max-h-[min(82dvh,740px)] flex-col rounded-t-3xl bg-white p-4 pb-safe shadow-2xl border-t border-diyar-brown/20"
            role="dialog"
            aria-modal="true"
            aria-labelledby="room-designer-catalog-sheet-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-2 border-b border-diyar-brown/15 pb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-diyar-brown text-white">
                  <Sparkles size={16} />
                </div>
                <h2 id="room-designer-catalog-sheet-title" className="text-base font-bold text-diyar-dark">
                  معرض قطع الأثاث
                </h2>
              </div>
              <button
                type="button"
                className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-diyar-dark transition"
                aria-label="إغلاق"
                onClick={() => setCatalogOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <CatalogPanel onSelectProduct={handleSelectProduct} isAdding={addingProduct} />
            </div>
            {addProductError ? (
              <p className="mt-2 text-sm text-destructive bg-red-50 p-2 rounded-lg" role="alert">
                {addProductError}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <AddToCartReviewModal
        open={cartModalOpen && Boolean(designId)}
        lines={cartLines}
        onConfirm={handleConfirmCart}
        onClose={() => setCartModalOpen(false)}
        isSubmitting={addToCartMutation.isPending}
        errorMessage={cartError}
      />

    </div>
  );
}
