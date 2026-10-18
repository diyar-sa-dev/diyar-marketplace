import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Box,
  Boxes,
  Camera,
  Copy,
  LayoutGrid,
  Lock,
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
  Unlock,
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
  'inline-flex h-9 min-w-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-diyar-brown/20 bg-white text-diyar-dark shadow-2xs hover:border-diyar-brown hover:bg-diyar-cream/30 px-2.5 text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer';

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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
  const [emptyHintDismissed, setEmptyHintDismissed] = useState(false);
  const [canvasCrashKey, setCanvasCrashKey] = useState(0);
  const [roomBackdropPhoto, setRoomBackdropPhoto] = useState<string | null>(null);
  const [placedItemsOpen, setPlacedItemsOpen] = useState(true);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      const selItem = engine.document.items.find((i) => selectedIds.includes(i.id));
      if (!selItem) {
        return;
      }
      if (
        selItem.locked &&
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'r', 'R'].includes(e.key)
      ) {
        return;
      }

      const step = e.shiftKey ? 0.25 : 0.08;
      const roomW = engine.document.room.width_m;
      const roomD = engine.document.room.depth_m;
      const halfW = (selItem.snapshot.width_m || 0.8) / 2;
      const halfD = (selItem.snapshot.depth_m || 0.8) / 2;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const newZ = Math.max(halfD, selItem.position_m.z - step);
        runSessionAction((s) =>
          s.applyCommands([
            {
              type: 'MOVE',
              itemId: selItem.id,
              position_m: { x: selItem.position_m.x, z: newZ },
            },
          ]),
        );
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const newZ = Math.min(roomD - halfD, selItem.position_m.z + step);
        runSessionAction((s) =>
          s.applyCommands([
            {
              type: 'MOVE',
              itemId: selItem.id,
              position_m: { x: selItem.position_m.x, z: newZ },
            },
          ]),
        );
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const newX = Math.max(halfW, selItem.position_m.x - step);
        runSessionAction((s) =>
          s.applyCommands([
            {
              type: 'MOVE',
              itemId: selItem.id,
              position_m: { x: newX, z: selItem.position_m.z },
            },
          ]),
        );
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const newX = Math.min(roomW - halfW, selItem.position_m.x + step);
        runSessionAction((s) =>
          s.applyCommands([
            {
              type: 'MOVE',
              itemId: selItem.id,
              position_m: { x: newX, z: selItem.position_m.z },
            },
          ]),
        );
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        const delta = e.shiftKey ? -90 : 90;
        const newRot = (((selItem.rotation_deg + delta) % 360) + 360) % 360;
        runSessionAction((s) =>
          s.applyCommands([
            {
              type: 'ROTATE',
              itemId: selItem.id,
              rotation_deg: newRot,
            },
          ]),
        );
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        runSessionAction((s) => s.removeSelected());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [engine, selectedIds, runSessionAction]);

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

  useEffect(() => {
    if (typeof sessionStorage === 'undefined') return;
    try {
      const storedPhoto = sessionStorage.getItem('diyar:try-in-room:photo');
      const storedProductId = sessionStorage.getItem('diyar:try-in-room:product-id');
      if (storedPhoto) {
        setRoomBackdropPhoto(storedPhoto);
        sessionStorage.removeItem('diyar:try-in-room:photo');
      }
      if (storedProductId) {
        sessionStorage.removeItem('diyar:try-in-room:product-id');
        void handleSelectProduct(storedProductId);
      }
    } catch {
      // Safe fallback
    }
  }, [handleSelectProduct]);

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
  const selectedItem = engine.document.items.find((i) => selectedIds.includes(i.id));
  const hasPresetSelected = Boolean(engine.document.room.preset_id);
  const showEmptyHint =
    !hasPresetSelected && engine.document.items.length === 0 && !emptyHintDismissed;

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
      <header className="flex shrink-0 items-center justify-between gap-2 overflow-x-auto overscroll-x-contain rounded-2xl border border-diyar-brown/20 bg-white p-2 shadow-2xs [-ms-overflow-style:none] [scrollbar-width:none] lg:col-span-2 [&::-webkit-scrollbar]:hidden">
        {/* Right Section: Presentation Mode Switcher & AI Tools */}
        <div className="flex items-center gap-1.5 shrink-0">
          {presentationToggleEnabled ? (
            <div className="inline-flex h-9 items-center rounded-xl border border-diyar-brown/20 bg-diyar-cream/40 p-0.5 shadow-xs shrink-0">
              <button
                type="button"
                className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition-all cursor-pointer ${
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
                  className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition-all cursor-pointer ${
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
                  className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition-all cursor-pointer ${
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
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-linear-to-r from-diyar-brown to-[#735942] px-3 text-xs font-bold text-white shadow-xs hover:opacity-95 active:scale-95 transition-all cursor-pointer shrink-0"
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
                  className="inline-flex h-9 items-center gap-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 px-2 text-xs font-bold hover:bg-amber-200 transition cursor-pointer shrink-0"
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
              <Sparkles size={15} className="text-diyar-brown" />
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
              <ScanLine size={15} />
            </button>
          ) : null}
        </div>

        {/* Center Section: History & Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              className={touchBtn}
              aria-label="تراجع"
              title="تراجع (Ctrl+Z)"
              disabled={!canUndo}
              onClick={() => runSessionAction((s) => s.undo())}
            >
              <Undo2 size={15} />
            </button>
            <button
              type="button"
              className={touchBtn}
              aria-label="إعادة"
              title="إعادة (Ctrl+Y)"
              disabled={!canRedo}
              onClick={() => runSessionAction((s) => s.redo())}
            >
              <Redo2 size={15} />
            </button>
          </div>

          <div className="h-5 w-px bg-diyar-brown/15 shrink-0 mx-0.5" />

          <button
            type="button"
            className={touchBtn}
            aria-label="حذف العنصر المحدد"
            title="حذف القطعة المحددة (Delete)"
            onClick={() => runSessionAction((s) => s.removeSelected())}
          >
            <Trash2 size={15} />
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
            <RefreshCw size={15} />
            <span className="hidden sm:inline">إفراغ الغرفة</span>
          </button>
          <button
            type="button"
            className={touchBtn}
            aria-label={isFullscreen ? 'الخروج من ملء الشاشة' : 'ملء الشاشة'}
            title={isFullscreen ? 'الخروج من ملء الشاشة (Esc)' : 'عرض بملء الشاشة'}
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize size={15} />}
            <span className="hidden sm:inline">{isFullscreen ? 'تصغير' : 'ملء الشاشة'}</span>
          </button>
        </div>

        {/* Left Section: Status, Cart & Mobile Trigger */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!isLargeScreen ? (
            <button
              type="button"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-diyar-brown px-3 text-xs font-bold text-white shadow-xs hover:bg-diyar-brown/90 active:scale-95 transition-all cursor-pointer shrink-0"
              onClick={() => setCatalogOpen(true)}
            >
              <Sparkles size={14} />
              <span>المنتجات</span>
            </button>
          ) : null}

          {designId ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-diyar-cream/60 px-2.5 py-1 text-[11px] font-semibold text-diyar-dark border border-diyar-brown/15"
                aria-live="polite"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${syncStateLabel === 'محفوظ' ? 'bg-emerald-600' : 'bg-amber-500 animate-pulse'}`} />
                {syncStateLabel}
              </span>
              <button
                type="button"
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-diyar-brown/20 bg-white text-diyar-dark hover:bg-diyar-brown hover:text-white shadow-xs transition-all cursor-pointer shrink-0"
                onClick={() => setCartModalOpen(true)}
                aria-label="إضافة إلى السلة"
                title="مراجعة وإضافة قطع الغرفة للسلة"
              >
                <ShoppingCart size={16} />
                {cartLines.length > 0 ? (
                  <span className="absolute -top-1.5 -end-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-diyar-brown px-1 text-[10px] font-black text-white shadow-xs">
                    {cartLines.length}
                  </span>
                ) : null}
              </button>
            </div>
          ) : null}
        </div>
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
        {(roomBackdropPhoto || tryInRoomPreview) ? (
          <div className="absolute inset-0 z-0 overflow-hidden">
            <img
              src={roomBackdropPhoto || tryInRoomPreview!}
              alt="صورة الغرفة"
              className="h-full w-full object-cover opacity-60 pointer-events-none"
            />
            <div className="pointer-events-auto absolute top-3 start-3 z-20 flex items-center gap-1.5 rounded-full bg-diyar-dark/85 px-3 py-1 text-[11px] font-bold text-white shadow-md backdrop-blur-xs border border-white/10">
              <Camera size={13} className="text-amber-300" />
              <span>خلفية غرفتك الحقيقية</span>
              <button
                type="button"
                onClick={() => {
                  setRoomBackdropPhoto(null);
                  resetTryInRoom();
                }}
                className="ms-1 p-0.5 rounded-full hover:bg-white/20 transition cursor-pointer"
                title="إزالة صورة الغرفة"
                aria-label="إزالة صورة الغرفة"
              >
                <X size={12} />
              </button>
            </div>
          </div>
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
            onSelectionChange={setSelectedIds}
            className="relative z-10 h-full w-full"
          />
        </ErrorBoundary>

        {/* Floating Quick Item Controls HUD */}
        {selectedItem ? (
          <div
            className="absolute top-3 left-1/2 -translate-x-1/2 z-25 flex flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-diyar-brown/25 bg-white/95 px-3 py-1.5 shadow-lg backdrop-blur-md max-w-[95%]"
            role="toolbar"
            aria-label="التحكم بالقطعة المحددة"
          >
            <span className="text-[11px] font-bold text-diyar-dark truncate max-w-[120px] pe-1 border-e border-diyar-brown/20">
              {selectedItem.snapshot.name}
            </span>

            {/* Facing direction presets */}
            <div className="flex items-center gap-0.5 bg-diyar-cream/40 p-0.5 rounded-lg border border-diyar-brown/15">
              <button
                type="button"
                className="h-7 px-1.5 rounded text-[10px] font-bold text-diyar-dark hover:bg-white transition cursor-pointer"
                title="توجيه للأعلى (0°)"
                onClick={() =>
                  runSessionAction((s) =>
                    s.applyCommands([{ type: 'ROTATE', itemId: selectedItem.id, rotation_deg: 0 }]),
                  )
                }
              >
                ⬆️ أعلى
              </button>
              <button
                type="button"
                className="h-7 px-1.5 rounded text-[10px] font-bold text-diyar-dark hover:bg-white transition cursor-pointer"
                title="توجيه لليمين (90°)"
                onClick={() =>
                  runSessionAction((s) =>
                    s.applyCommands([{ type: 'ROTATE', itemId: selectedItem.id, rotation_deg: 90 }]),
                  )
                }
              >
                ➡️ يمين
              </button>
              <button
                type="button"
                className="h-7 px-1.5 rounded text-[10px] font-bold text-diyar-dark hover:bg-white transition cursor-pointer"
                title="توجيه للأسفل (180°)"
                onClick={() =>
                  runSessionAction((s) =>
                    s.applyCommands([{ type: 'ROTATE', itemId: selectedItem.id, rotation_deg: 180 }]),
                  )
                }
              >
                ⬇️ أسفل
              </button>
              <button
                type="button"
                className="h-7 px-1.5 rounded text-[10px] font-bold text-diyar-dark hover:bg-white transition cursor-pointer"
                title="توجيه لليسار (270°)"
                onClick={() =>
                  runSessionAction((s) =>
                    s.applyCommands([{ type: 'ROTATE', itemId: selectedItem.id, rotation_deg: 270 }]),
                  )
                }
              >
                ⬅️ يسار
              </button>
            </div>

            {/* D-Pad position nudging */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                className="h-7 w-7 flex items-center justify-center rounded-lg border border-diyar-brown/20 bg-white text-diyar-dark hover:bg-diyar-cream transition cursor-pointer"
                title="تحريك لأعلى (ArrowUp)"
                onClick={() => {
                  const halfD = (selectedItem.snapshot.depth_m || 0.8) / 2;
                  const newZ = Math.max(halfD, selectedItem.position_m.z - 0.15);
                  runSessionAction((s) =>
                    s.applyCommands([
                      {
                        type: 'MOVE',
                        itemId: selectedItem.id,
                        position_m: { x: selectedItem.position_m.x, z: newZ },
                      },
                    ]),
                  );
                }}
              >
                <ArrowUp size={13} />
              </button>
              <button
                type="button"
                className="h-7 w-7 flex items-center justify-center rounded-lg border border-diyar-brown/20 bg-white text-diyar-dark hover:bg-diyar-cream transition cursor-pointer"
                title="تحريك لأسفل (ArrowDown)"
                onClick={() => {
                  const roomD = engine.document.room.depth_m;
                  const halfD = (selectedItem.snapshot.depth_m || 0.8) / 2;
                  const newZ = Math.min(roomD - halfD, selectedItem.position_m.z + 0.15);
                  runSessionAction((s) =>
                    s.applyCommands([
                      {
                        type: 'MOVE',
                        itemId: selectedItem.id,
                        position_m: { x: selectedItem.position_m.x, z: newZ },
                      },
                    ]),
                  );
                }}
              >
                <ArrowDown size={13} />
              </button>
              <button
                type="button"
                className="h-7 w-7 flex items-center justify-center rounded-lg border border-diyar-brown/20 bg-white text-diyar-dark hover:bg-diyar-cream transition cursor-pointer"
                title="تحريك لليسار (ArrowLeft)"
                onClick={() => {
                  const halfW = (selectedItem.snapshot.width_m || 0.8) / 2;
                  const newX = Math.max(halfW, selectedItem.position_m.x - 0.15);
                  runSessionAction((s) =>
                    s.applyCommands([
                      {
                        type: 'MOVE',
                        itemId: selectedItem.id,
                        position_m: { x: newX, z: selectedItem.position_m.z },
                      },
                    ]),
                  );
                }}
              >
                <ArrowLeft size={13} />
              </button>
              <button
                type="button"
                className="h-7 w-7 flex items-center justify-center rounded-lg border border-diyar-brown/20 bg-white text-diyar-dark hover:bg-diyar-cream transition cursor-pointer"
                title="تحريك لليمين (ArrowRight)"
                onClick={() => {
                  const roomW = engine.document.room.width_m;
                  const halfW = (selectedItem.snapshot.width_m || 0.8) / 2;
                  const newX = Math.min(roomW - halfW, selectedItem.position_m.x + 0.15);
                  runSessionAction((s) =>
                    s.applyCommands([
                      {
                        type: 'MOVE',
                        itemId: selectedItem.id,
                        position_m: { x: newX, z: selectedItem.position_m.z },
                      },
                    ]),
                  );
                }}
              >
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="h-4 w-px bg-diyar-brown/20 shrink-0" />

            {/* Fine & Continuous Rotation Controls */}
            <div className="flex items-center gap-0.5 bg-diyar-cream/30 p-0.5 rounded-lg border border-diyar-brown/15">
              <button
                type="button"
                className="h-7 w-7 flex items-center justify-center rounded text-diyar-dark hover:bg-white transition cursor-pointer"
                title="تدوير عكس عقارب الساعة -15°"
                onClick={() =>
                  runSessionAction((s) =>
                    s.applyCommands([
                      {
                        type: 'ROTATE',
                        itemId: selectedItem.id,
                        rotation_deg: (Math.round(selectedItem.rotation_deg - 15) + 360) % 360,
                      },
                    ]),
                  )
                }
              >
                <RotateCcw size={12} />
              </button>
              <span className="px-1 text-[10px] font-black text-diyar-dark min-w-[28px] text-center font-mono">
                {Math.round(selectedItem.rotation_deg)}°
              </span>
              <button
                type="button"
                className="h-7 w-7 flex items-center justify-center rounded text-diyar-dark hover:bg-white transition cursor-pointer"
                title="تدوير مع عقارب الساعة +15°"
                onClick={() =>
                  runSessionAction((s) =>
                    s.applyCommands([
                      {
                        type: 'ROTATE',
                        itemId: selectedItem.id,
                        rotation_deg: (Math.round(selectedItem.rotation_deg + 15)) % 360,
                      },
                    ]),
                  )
                }
              >
                <RotateCw size={12} />
              </button>
            </div>

            <button
              type="button"
              className="h-7 px-2 flex items-center gap-1 rounded-lg border border-diyar-brown/20 bg-white text-[11px] font-bold text-diyar-dark hover:bg-diyar-cream transition cursor-pointer"
              title="تدوير +45° (R)"
              onClick={() =>
                runSessionAction((s) =>
                  s.applyCommands([
                    {
                      type: 'ROTATE',
                      itemId: selectedItem.id,
                      rotation_deg: (selectedItem.rotation_deg + 45) % 360,
                    },
                  ]),
                )
              }
            >
              <RotateCw size={11} />
              <span>45°</span>
            </button>

            {Boolean(selectedItem.snapshot.asset_ref) ? (
              <button
                type="button"
                className={`h-7 px-2 flex items-center gap-1 rounded-lg border text-[10px] font-bold transition cursor-pointer ${
                  projection === 'room_3d'
                    ? 'border-diyar-brown bg-diyar-brown text-white'
                    : 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                }`}
                title="معاينة النموذج ثلاثي الأبعاد"
                onClick={() => setProjection('room_3d')}
              >
                <Boxes size={12} />
                <span>3D</span>
              </button>
            ) : null}

            <button
              type="button"
              className="h-7 w-7 flex items-center justify-center rounded-lg border border-diyar-brown/20 bg-white text-diyar-dark hover:bg-diyar-cream transition cursor-pointer"
              title="تكرار القطعة"
              onClick={() =>
                runSessionAction((s) =>
                  s.applyCommands([{ type: 'DUPLICATE', itemId: selectedItem.id }]),
                )
              }
            >
              <Copy size={12} />
            </button>
            <button
              type="button"
              className="h-7 w-7 flex items-center justify-center rounded-lg border border-diyar-brown/20 bg-white text-diyar-dark hover:bg-diyar-cream transition cursor-pointer"
              title={selectedItem.locked ? 'إلغاء القفل' : 'قفل مكان القطعة'}
              onClick={() =>
                runSessionAction((s) =>
                  s.applyCommands([
                    {
                      type: selectedItem.locked ? 'UNLOCK' : 'LOCK',
                      itemId: selectedItem.id,
                    },
                  ]),
                )
              }
            >
              {selectedItem.locked ? <Lock size={12} className="text-amber-600" /> : <Unlock size={12} />}
            </button>
            <button
              type="button"
              className="h-7 w-7 flex items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition cursor-pointer"
              title="حذف القطعة (Delete)"
              onClick={() => runSessionAction((s) => s.removeSelected())}
            >
              <Trash2 size={12} />
            </button>
          </div>
        ) : null}

        {/* Placed Items Drawer / Tray ("قطع الغرفة") */}
        {engine.document.items.length > 0 ? (
          <div
            className="absolute bottom-3 end-3 z-20 max-w-[calc(100%-140px)] flex flex-col items-end gap-1.5"
            dir="rtl"
          >
            <button
              type="button"
              onClick={() => setPlacedItemsOpen((prev) => !prev)}
              className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-diyar-brown/25 bg-white/95 px-2.5 py-1 text-xs font-bold text-diyar-dark shadow-md backdrop-blur-md hover:bg-diyar-cream/60 transition cursor-pointer"
            >
              <LayoutGrid size={13} className="text-diyar-brown" />
              <span>قطع الغرفة ({engine.document.items.length})</span>
            </button>

            {placedItemsOpen ? (
              <div className="flex max-w-full items-center gap-2 overflow-x-auto rounded-2xl border border-diyar-brown/25 bg-white/95 p-1.5 shadow-xl backdrop-blur-md [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {engine.document.items.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  const has3d = Boolean(item.snapshot.asset_ref);
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedIds([item.id])}
                      className={`group relative flex shrink-0 items-center gap-2 rounded-xl border p-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-diyar-brown bg-diyar-cream/40 ring-2 ring-diyar-brown/30 shadow-xs'
                          : 'border-diyar-brown/15 bg-white hover:border-diyar-brown/35 hover:bg-diyar-cream/20 shadow-2xs'
                      }`}
                    >
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-diyar-cream/30 border border-diyar-brown/10">
                        {item.snapshot.thumbnail_url ? (
                          <img
                            src={item.snapshot.thumbnail_url}
                            alt={item.snapshot.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-diyar-brown/60">
                            <Box size={16} />
                          </div>
                        )}
                        {has3d ? (
                          <span className="absolute bottom-0.5 start-0.5 rounded bg-diyar-dark/85 px-1 text-[7px] font-black text-amber-300">
                            3D
                          </span>
                        ) : null}
                      </div>

                      <div className="min-w-0 max-w-[90px] text-start pe-1">
                        <p className="truncate text-[11px] font-bold text-diyar-dark">
                          {item.snapshot.name}
                        </p>
                        <p className="text-[9px] text-muted-foreground">
                          {item.snapshot.width_m} × {item.snapshot.depth_m} م
                        </p>
                      </div>

                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          className="h-6 w-6 flex items-center justify-center rounded text-gray-500 hover:text-diyar-dark hover:bg-diyar-cream transition"
                          title={item.locked ? 'إلغاء القفل' : 'قفل'}
                          onClick={(e) => {
                            e.stopPropagation();
                            runSessionAction((s) =>
                              s.applyCommands([
                                {
                                  type: item.locked ? 'UNLOCK' : 'LOCK',
                                  itemId: item.id,
                                },
                              ]),
                            );
                          }}
                        >
                          {item.locked ? <Lock size={11} className="text-amber-600" /> : <Unlock size={11} />}
                        </button>
                        <button
                          type="button"
                          className="h-6 w-6 flex items-center justify-center rounded text-red-500 hover:bg-red-50 transition"
                          title="حذف القطعة"
                          onClick={(e) => {
                            e.stopPropagation();
                            runSessionAction((s) => s.applyCommands([{ type: 'REMOVE_ITEM', itemId: item.id }]));
                          }}
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Empty State Overlay (auto-hides visually when a room preset is chosen or item added, plus dismiss button) */}
        {engine.document.items.length === 0 ? (
          showEmptyHint ? (
            <div className="absolute inset-x-0 top-[18%] z-20 flex flex-col items-center px-4 text-center sm:px-6 pointer-events-auto">
              <div className="relative rounded-3xl border border-diyar-brown/20 bg-white/95 p-6 shadow-lg backdrop-blur-md max-w-sm mx-auto">
                <button
                  type="button"
                  className="absolute top-3 end-3 p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                  onClick={() => setEmptyHintDismissed(true)}
                  aria-label="إغلاق التلميح"
                >
                  <X size={15} />
                </button>
                <div className="mb-3 mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-diyar-brown/10 text-diyar-brown shadow-xs">
                  <Sparkles size={22} />
                </div>
                <p className="text-sm font-extrabold text-diyar-dark">ابدأ بتأثيث غرفتك</p>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-600">
                  اختر طابع الغرفة، ثم اضغط على أي قطعة أثاث من القائمة لإضافتها هنا.
                </p>
              </div>
            </div>
          ) : (
            <span className="sr-only">ابدأ بتأثيث غرفتك</span>
          )
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
