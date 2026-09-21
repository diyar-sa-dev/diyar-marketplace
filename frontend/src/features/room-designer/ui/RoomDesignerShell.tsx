import { Box, Boxes, LayoutGrid, Redo2, RefreshCw, ScanLine, ShoppingCart, Sparkles, Trash2, Undo2, Upload, X } from 'lucide-react';
import { useCallback, useMemo, useReducer, useRef, useState } from 'react';
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
import { RoomDesignerCanvasHost } from './RoomDesignerCanvasHost.tsx';
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
  'inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-2.5 text-sm sm:px-3 disabled:opacity-40';

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
  const [canvasCrashKey, setCanvasCrashKey] = useState(0);
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
        if (result.ok) {
          setEngine(result.state);
          autosave.markDirty();
          bumpToolbar();
          if (!isLargeScreen) {
            setCatalogOpen(false);
          }
        } else {
          setAddProductError(result.error.message);
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
      if (!applied.ok) {
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
      className={`flex min-h-0 flex-col gap-2 lg:grid lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)] lg:gap-4 ${className ?? ''}`}
      data-testid="room-designer-shell"
      dir="rtl"
    >
      <header className="flex items-center gap-2 overflow-x-auto overscroll-x-contain border-b border-border pb-2 [-ms-overflow-style:none] [scrollbar-width:none] lg:col-span-2 [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          className={touchBtn}
          aria-label="تراجع"
          disabled={!canUndo}
          onClick={() => runSessionAction((s) => s.undo())}
        >
          <Undo2 size={18} />
        </button>
        <button
          type="button"
          className={touchBtn}
          aria-label="إعادة"
          disabled={!canRedo}
          onClick={() => runSessionAction((s) => s.redo())}
        >
          <Redo2 size={18} />
        </button>
        <button
          type="button"
          className={touchBtn}
          aria-label="حذف العنصر المحدد"
          onClick={() => runSessionAction((s) => s.removeSelected())}
        >
          <Trash2 size={18} />
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
          <RefreshCw size={18} />
          <span className="hidden sm:inline">إفراغ الغرفة</span>
        </button>
        {designId ? (
          <button
            type="button"
            className={touchBtn}
            aria-label={t('tryInRoom.choosePhoto')}
            data-testid="try-in-room-open-designer"
            onClick={() => tryInRoomInputRef.current?.click()}
          >
            <Upload size={18} />
            <span className="hidden sm:inline">{t('tryInRoom.choosePhoto')}</span>
          </button>
        ) : null}

        {presentationToggleEnabled ? (
          <button
            type="button"
            className={touchBtn}
            aria-pressed={projection !== 'top_down'}
            aria-label={
              projection === 'room_3d'
                ? 'عرض ثلاثي الأبعاد'
                : projection === 'isometric_25d'
                  ? 'عرض منظور 2.5D'
                  : 'عرض علوي'
            }
            title={projection}
            onClick={() =>
              setProjection((mode) =>
                nextPresentationMode(mode, {
                  allow25d: isRoomDesigner25dEnabled(),
                  allow3d: isRoomDesigner3dEnabled(),
                }),
              )
            }
          >
            {projection === 'room_3d' ? (
              <Boxes size={18} />
            ) : projection === 'isometric_25d' ? (
              <LayoutGrid size={18} />
            ) : (
              <Box size={18} />
            )}
          </button>
        ) : null}

        {!isLargeScreen ? (
          <button
            type="button"
            className={`${touchBtn} ms-auto`}
            onClick={() => setCatalogOpen(true)}
          >
            المنتجات
          </button>
        ) : null}

        {arEnabled ? (
          <button
            type="button"
            className={touchBtn}
            aria-label="عرض بالواقع المعزّز"
            onClick={() => void handleOpenAr()}
          >
            <ScanLine size={18} />
          </button>
        ) : null}

        {designId && aiSpatialEnabled ? (
          <button
            type="button"
            className={touchBtn}
            aria-label="اقتراح ترتيب ذكي"
            disabled={layoutSuggesting}
            onClick={() => void handleSuggestLayout()}
          >
            <Sparkles size={18} />
          </button>
        ) : null}

        {designId ? (
          <>
            <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground" aria-live="polite">
              {syncStateLabel}
            </span>
            <button
              type="button"
              className={`${touchBtn} ${isLargeScreen ? 'ms-auto' : ''}`}
              onClick={() => setCartModalOpen(true)}
              aria-label="إضافة إلى السلة"
            >
              <ShoppingCart size={18} />
            </button>
          </>
        ) : null}
      </header>

      {layoutError ? (
        <p className="text-sm text-destructive lg:col-span-2" role="alert">
          {layoutError}
        </p>
      ) : null}
      {arError ? (
        <p className="text-sm text-destructive lg:col-span-2" role="alert">
          {arError}
        </p>
      ) : null}
      {tryInRoomErrorKey ? (
        <p className="text-sm text-destructive lg:col-span-2" role="alert">
          {t(`tryInRoom.errors.${tryInRoomErrorKey}`)}
        </p>
      ) : null}

      <div className="flex gap-2 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] lg:col-span-2 [&::-webkit-scrollbar]:hidden" data-testid="room-designer-presets">
        {listRoomPresets().map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`${touchBtn} ${engine.document.room.preset_id === preset.id ? 'border-diyar-brown bg-diyar-brown/10' : ''}`}
            onClick={() =>
              runSessionAction((s) => s.applyCommands([{ type: 'APPLY_ROOM_PRESET', preset_id: preset.id }]))
            }
          >
            {preset.name_ar}
          </button>
        ))}
      </div>

      {isLargeScreen ? (
        <aside
          className="flex max-h-[min(70dvh,640px)] min-h-0 flex-col overflow-hidden rounded-2xl border border-border p-3"
          aria-label="معرض المنتجات"
        >
          <div className="min-h-0 flex-1 overflow-y-auto">
            <CatalogPanel onSelectProduct={handleSelectProduct} isAdding={addingProduct} />
          </div>
          {addProductError ? (
            <p className="text-sm text-destructive" role="alert">
              {addProductError}
            </p>
          ) : null}
        </aside>
      ) : null}

      <div className="relative flex min-h-[min(42dvh,380px)] min-w-0 flex-1 flex-col md:min-h-[min(52dvh,560px)]">
        {tryInRoomPreview ? (
          <img
            src={tryInRoomPreview}
            alt={t('tryInRoom.yourRoom')}
            className="pointer-events-none absolute inset-0 z-0 h-full w-full rounded-xl object-cover opacity-40"
          />
        ) : null}
        {tryInRoomConfirming ? (
          <>
            <TryInRoomShimmer />
            <p className="pointer-events-none absolute top-3 start-3 z-20 rounded-full bg-diyar-dark/85 px-3 py-1 text-[11px] font-medium text-white">
              {t('tryInRoom.processing')}
            </p>
          </>
        ) : null}
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
            onEngineChange={handleEngineChange}
            className="relative z-10 h-full min-h-[220px] w-full rounded-xl border border-border bg-muted/10"
          />
        </ErrorBoundary>
        {engine.document.items.length === 0 ? (
          <div className="pointer-events-none absolute inset-x-0 top-[16%] z-20 flex flex-col items-center px-4 text-center sm:px-6">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background/90 text-diyar-brown shadow-sm">
              <Sparkles size={22} />
            </div>
            <p className="text-sm font-bold text-diyar-dark">ابدأ بتأثيث غرفتك</p>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
              اختر طابع الغرفة، ثم اضغط على أي قطعة أثاث من القائمة لإضافتها هنا.
            </p>
          </div>
        ) : null}
        <p className="pointer-events-none absolute bottom-3 left-3 right-3 z-20 text-center text-[11px] text-muted-foreground">
          <span className="inline-block rounded-full bg-background/80 px-3 py-1 backdrop-blur-sm">
            اسحب القطع، كبّرها أو دوّرها لترتيب غرفتك بسهولة
          </span>
        </p>
        <input
          ref={tryInRoomInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
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

      {!isLargeScreen && catalogOpen ? (
        <div
          className="fixed inset-0 z-100 flex flex-col justify-end bg-black/50 p-0"
          role="presentation"
          onClick={() => setCatalogOpen(false)}
        >
          <div
            ref={catalogSheetRef}
            className="flex max-h-[min(70dvh,640px)] flex-col rounded-t-3xl bg-background p-4 pb-safe shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="room-designer-catalog-sheet-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 id="room-designer-catalog-sheet-title" className="text-base font-semibold">
                المنتجات
              </h2>
              <button
                type="button"
                className={touchBtn}
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
              <p className="mt-2 text-sm text-destructive" role="alert">
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
