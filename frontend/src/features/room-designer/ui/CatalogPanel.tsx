import { Loader2, Search } from 'lucide-react';
import { useState } from 'react';
import type { ProductCard } from '../../../types/catalog.ts';
import {
  CATALOG_PICKER_MIN_SEARCH_CHARS,
  CATALOG_PICKER_PER_PAGE,
} from '../catalog/constants.ts';
import { useRoomDesignerProductSearch } from '../catalog/useRoomDesignerProductSearch.ts';

export type CatalogPanelProps = {
  onSelectProduct: (productId: string) => void;
  isAdding?: boolean;
  enabled?: boolean;
};

export function CatalogPanel({ onSelectProduct, isAdding = false, enabled = true }: CatalogPanelProps) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
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

  return (
    <div className="flex flex-col gap-3" data-testid="room-designer-catalog-panel">
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="ابحث عن منتج..."
          className="min-h-11 w-full rounded-xl border border-border bg-background py-2.5 ps-10 pe-3 text-sm"
          aria-label="بحث المنتجات"
          disabled={!enabled || isAdding}
        />
      </div>

      {showSearchHint ? (
        <p className="text-xs text-muted-foreground">
          اكتب {CATALOG_PICKER_MIN_SEARCH_CHARS} أحرف على الأقل للبحث
        </p>
      ) : null}

      {isError ? (
        <p className="text-sm text-destructive" role="alert">
          {(error as Error)?.message ?? 'تعذّر تحميل المنتجات'}
        </p>
      ) : null}

      <div className="min-h-[120px] space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="animate-spin" size={20} />
          </div>
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">لا توجد منتجات</p>
        ) : (
          items.map((product) => (
            <CatalogProductRow
              key={product.id}
              product={product}
              disabled={isAdding}
              onSelect={() => onSelectProduct(product.id)}
            />
          ))
        )}
      </div>

      {pagination && pagination.last_page > 1 ? (
        <div className="flex items-center justify-between gap-2 text-xs">
          <button
            type="button"
            className="min-h-11 rounded-lg border px-3 py-2 disabled:opacity-40"
            disabled={page <= 1 || isFetching || isAdding}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            السابق
          </button>
          <span className="text-muted-foreground">
            {pagination.current_page} / {pagination.last_page}
          </span>
          <button
            type="button"
            className="min-h-11 rounded-lg border px-3 py-2 disabled:opacity-40"
            disabled={page >= pagination.last_page || isFetching || isAdding}
            onClick={() => setPage((p) => p + 1)}
          >
            التالي
          </button>
        </div>
      ) : null}

      <p className="text-[10px] text-muted-foreground">
        {CATALOG_PICKER_PER_PAGE} منتجات لكل صفحة — لا يتم جلب كل المنتجات دفعة واحدة
      </p>
    </div>
  );
}

function CatalogProductRow({
  product,
  onSelect,
  disabled,
}: {
  product: ProductCard;
  onSelect: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-border p-2 text-start transition hover:bg-muted/50 disabled:opacity-50"
    >
      {product.image_url ? (
        <img
          src={product.image_url}
          alt=""
          className="h-12 w-12 shrink-0 rounded-lg object-cover"
          loading="lazy"
        />
      ) : (
        <div className="h-12 w-12 shrink-0 rounded-lg bg-muted" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{product.name}</span>
        {product.category?.name ? (
          <span className="block truncate text-[11px] text-muted-foreground">{product.category.name}</span>
        ) : null}
      </span>
    </button>
  );
}
