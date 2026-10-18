import { ChevronLeft, ChevronRight, Loader2, Plus, Search, Store, X } from 'lucide-react';
import { useState } from 'react';
import type { ProductCard } from '../../../types/catalog.ts';
import {
  CATALOG_PICKER_MIN_SEARCH_CHARS,
  CATALOG_PICKER_PER_PAGE,
} from '../catalog/constants.ts';
import { useRoomDesignerProductSearch } from '../catalog/useRoomDesignerProductSearch.ts';
import { CatalogRowSkeleton } from './RoomDesignerWorkspaceSkeleton.tsx';

const PLACEHOLDER_FURNITURE =
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=60&w=400';

export type CatalogPanelProps = {
  onSelectProduct: (productId: string) => void;
  isAdding?: boolean;
  enabled?: boolean;
};

export function CatalogPanel({ onSelectProduct, isAdding = false, enabled = true }: CatalogPanelProps) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedAddingId, setSelectedAddingId] = useState<string | null>(null);

  const { data, isLoading, isFetching, isError, error } = useRoomDesignerProductSearch(
    query,
    page,
    enabled,
  );

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const trimmed = query.replace(/\s+/g, ' ').trim();
  const showSearchHint =
    trimmed.length > 0 && trimmed.length < CATALOG_PICKER_MIN_SEARCH_CHARS;

  const handleSelect = (productId: string) => {
    setSelectedAddingId(productId);
    onSelectProduct(productId);
  };

  return (
    <div className="flex flex-col gap-3" data-testid="room-designer-catalog-panel" dir="rtl">
      {/* Search Header */}
      <div className="relative">
        <Search
          className="absolute start-3 top-1/2 -translate-y-1/2 text-diyar-brown/70 pointer-events-none"
          size={17}
        />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="ابحث عن أثاث، طاولة، كنب..."
          className="min-h-11 w-full rounded-xl border border-diyar-brown/25 bg-white py-2.5 ps-10 pe-9 text-sm text-diyar-dark placeholder:text-gray-400 focus:border-diyar-brown focus:outline-none focus:ring-2 focus:ring-diyar-brown/20 transition-all shadow-xs"
          aria-label="بحث المنتجات"
          disabled={!enabled || isAdding}
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setPage(1);
            }}
            className="absolute end-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-diyar-dark rounded-full hover:bg-gray-100 transition"
            aria-label="مسح البحث"
          >
            <X size={15} />
          </button>
        ) : null}

        {isFetching && !isLoading ? (
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 overflow-hidden rounded-b-xl">
            <span className="absolute inset-0 bg-linear-to-r from-transparent via-diyar-brown/60 to-transparent animate-diyar-loading-shimmer" />
          </span>
        ) : null}
      </div>

      {showSearchHint ? (
        <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5 border border-amber-200">
          اكتب {CATALOG_PICKER_MIN_SEARCH_CHARS} أحرف على الأقل للبحث في الكتالوج
        </p>
      ) : null}

      {isError ? (
        <p className="text-sm text-destructive bg-red-50 p-2.5 rounded-xl border border-red-200" role="alert">
          {(error as Error)?.message ?? 'تعذّر تحميل المنتجات'}
        </p>
      ) : null}

      {/* Catalog List (Single column rows) */}
      <div className="min-h-[160px]">
        {isLoading ? (
          <CatalogRowSkeleton count={5} />
        ) : items.length === 0 ? (
          <div className="py-8 text-center rounded-2xl border border-dashed border-diyar-brown/20 bg-diyar-cream/15 p-4">
            <p className="text-xs font-semibold text-diyar-dark">لا توجد منتجات مطابقة</p>
            <p className="text-[11px] text-muted-foreground mt-1">جرّب البحث بكلمة أخرى أو تصفح القائمة</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((product) => (
              <CatalogProductRow
                key={product.id}
                product={product}
                isBeingAdded={isAdding && selectedAddingId === product.id}
                disabled={isAdding}
                onSelect={() => handleSelect(product.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modern Pagination */}
      {pagination && pagination.last_page > 1 ? (
        <div className="mt-1 flex items-center justify-between gap-2 pt-2 border-t border-diyar-brown/15 text-xs">
          <button
            type="button"
            className="inline-flex min-h-8 items-center gap-1 rounded-xl border border-diyar-brown/25 bg-white px-2.5 py-1 text-xs font-medium text-diyar-dark shadow-2xs hover:bg-diyar-cream/40 hover:border-diyar-brown disabled:opacity-40 transition-all cursor-pointer"
            disabled={page <= 1 || isFetching || isAdding}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronRight size={13} />
            <span>السابق</span>
          </button>
          <span className="rounded-lg bg-diyar-cream/50 px-2 py-0.5 text-[11px] font-bold text-diyar-dark border border-diyar-brown/20">
            {pagination.current_page} من {pagination.last_page}
          </span>
          <button
            type="button"
            className="inline-flex min-h-8 items-center gap-1 rounded-xl border border-diyar-brown/25 bg-white px-2.5 py-1 text-xs font-medium text-diyar-dark shadow-2xs hover:bg-diyar-cream/40 hover:border-diyar-brown disabled:opacity-40 transition-all cursor-pointer"
            disabled={page >= pagination.last_page || isFetching || isAdding}
            onClick={() => setPage((p) => p + 1)}
          >
            <span>التالي</span>
            <ChevronLeft size={13} />
          </button>
        </div>
      ) : null}

      <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
        <span>{items.length > 0 ? `معروض ${items.length} قطع مختارة` : ''}</span>
        <span>اضغط لإضافة القطعة للغرفة</span>
      </div>
    </div>
  );
}

function CatalogProductRow({
  product,
  isBeingAdded,
  disabled,
  onSelect,
}: {
  product: ProductCard;
  isBeingAdded: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const priceNum = Number(product.sale_price ?? 0);
  const formattedPrice = priceNum > 0 ? priceNum.toLocaleString('en-US') : null;
  const has3dModel = Boolean(
    (product as { model_3d?: string; glb_url?: string; has_3d?: boolean; asset_ref?: string }).model_3d ||
    (product as { glb_url?: string }).glb_url ||
    (product as { has_3d?: boolean }).has_3d ||
    (product as { asset_ref?: string }).asset_ref
  );

  return (
    <div className="group flex items-center gap-2.5 rounded-xl border border-diyar-brown/15 bg-white p-2 hover:border-diyar-brown/40 hover:bg-diyar-cream/15 shadow-2xs transition-all duration-150">
      {/* Compact Thumbnail */}
      <div className="relative h-13 w-13 shrink-0 overflow-hidden rounded-lg bg-diyar-cream/30 border border-diyar-brown/10">
        <img
          src={product.image_url || PLACEHOLDER_FURNITURE}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = PLACEHOLDER_FURNITURE;
          }}
        />
        {has3dModel ? (
          <span className="absolute bottom-0.5 start-0.5 rounded bg-diyar-dark/85 px-1 py-0.2 text-[8px] font-black text-amber-300 shadow-xs">
            3D
          </span>
        ) : null}
      </div>

      {/* Title + Short Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <h4
            className="truncate text-xs font-bold text-diyar-dark group-hover:text-diyar-brown transition-colors"
            title={product.name}
          >
            {product.name}
          </h4>
          {formattedPrice ? (
            <span className="shrink-0 text-[11px] font-black text-diyar-dark whitespace-nowrap">
              {formattedPrice} <span className="font-normal text-[9px] text-diyar-brown">ر.س</span>
            </span>
          ) : null}
        </div>

        <div className="mt-0.5 flex items-center justify-between gap-1 text-[10px] text-muted-foreground">
          <span className="truncate">
            {product.category?.name || product.vendor?.store_name || 'أثاث ديار'}
          </span>
          <div className="flex items-center gap-1">
            {has3dModel ? (
              <span className="font-bold text-amber-800 bg-amber-50 px-1 py-0.2 rounded text-[9px] border border-amber-200">
                مجسم 3D
              </span>
            ) : null}
            {product.discount_percent ? (
              <span className="font-bold text-red-600 bg-red-50 px-1 py-0.2 rounded text-[9px]">
                -{product.discount_percent}%
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Add / Check Action Button */}
      <button
        type="button"
        onClick={onSelect}
        disabled={disabled}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-diyar-brown/10 text-diyar-brown hover:bg-diyar-brown hover:text-white active:scale-90 transition-all cursor-pointer disabled:opacity-40"
        title={`أضف ${product.name} للغرفة`}
        aria-label={`أضف ${product.name} للغرفة`}
      >
        {isBeingAdded ? (
          <Loader2 size={14} className="animate-spin text-diyar-brown" />
        ) : (
          <Plus size={16} strokeWidth={2.5} />
        )}
      </button>
    </div>
  );
}

