import { Redo2, ShoppingCart, Trash2, Undo2, X } from 'lucide-react';
import { useCallback, useMemo, useReducer, useRef, useState } from 'react';
import { useModalDialog } from '../../../hooks/useModalDialog.ts';
import { addCatalogProductToSession } from '../adapters/addCatalogProductToSession.ts';
import { deriveCartLinesFromDocument } from '../adapters/deriveCartLinesFromDocument.ts';
import { DesignerSession } from '../application/DesignerSession.ts';
import {
  engineCanRedo,
  engineCanUndo,
  type SpatialEngineState,
} from '../application/spatialEngine.ts';
import { useRoomDesignAutosave } from '../persistence/useRoomDesignAutosave.ts';
import { useRoomDesignAddToCart } from '../persistence/useRoomDesignAddToCart.ts';
import { AddToCartReviewModal } from './AddToCartReviewModal.tsx';
import { CatalogPanel } from './CatalogPanel.tsx';
import { RoomDesignerCanvasHost } from './RoomDesignerCanvasHost.tsx';
import { useLargeScreen } from './useLargeScreen.ts';

export type RoomDesignerShellProps = {
  engine: SpatialEngineState;
  designId?: string;
  designVersion?: number;
  className?: string;
};

const touchBtn =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-border bg-background px-3 text-sm disabled:opacity-40';

export function RoomDesignerShell({
  engine: initialEngine,
  designId,
  designVersion,
  className,
}: RoomDesignerShellProps) {
  const [engine, setEngine] = useState(initialEngine);
  const sessionRef = useRef<DesignerSession | null>(null);
  const [, bumpToolbar] = useReducer((n: number) => n + 1, 0);
  const isLargeScreen = useLargeScreen();
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [addingProduct, setAddingProduct] = useState(false);
  const [addProductError, setAddProductError] = useState<string | null>(null);
  const [cartError, setCartError] = useState<string | null>(null);
  const catalogSheetRef = useRef<HTMLDivElement>(null);
  useModalDialog(catalogOpen && !isLargeScreen, () => setCatalogOpen(false), catalogSheetRef);

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
      className={`flex min-h-0 flex-col gap-2 lg:grid lg:grid-cols-[minmax(260px,320px)_1fr] lg:gap-4 ${className ?? ''}`}
      data-testid="room-designer-shell"
      dir="rtl"
    >
      <header className="flex flex-wrap items-center gap-2 border-b border-border pb-2 lg:col-span-2">
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

        {!isLargeScreen ? (
          <button
            type="button"
            className={`${touchBtn} ms-auto`}
            onClick={() => setCatalogOpen(true)}
          >
            المنتجات
          </button>
        ) : null}

        {designId ? (
          <>
            <span className="text-xs text-muted-foreground" aria-live="polite">
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

      {isLargeScreen ? (
        <aside
          className="flex max-h-[min(70dvh,640px)] min-h-0 flex-col overflow-hidden rounded-2xl border border-border p-3"
          aria-label="معرض المنتجات"
        >
          <CatalogPanel onSelectProduct={handleSelectProduct} isAdding={addingProduct} />
          {addProductError ? (
            <p className="text-sm text-destructive" role="alert">
              {addProductError}
            </p>
          ) : null}
        </aside>
      ) : null}

      <div className="relative flex min-h-[min(45dvh,520px)] min-w-0 flex-1 flex-col">
        <RoomDesignerCanvasHost
          engine={engine}
          sessionResetKey={designId}
          fillContainer
          touchFriendly={!isLargeScreen}
          sessionRef={sessionRef}
          onEngineChange={handleEngineChange}
          className="h-full min-h-[220px] w-full rounded-xl border border-border bg-muted/20"
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
            className="flex max-h-[min(58dvh,520px)] flex-col rounded-t-2xl bg-background p-4 pb-safe shadow-xl"
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
