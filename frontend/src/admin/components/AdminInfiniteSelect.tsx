import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { Check, ChevronDown, Loader2, Search } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { adminApi } from '../../api/client.ts';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { adminQueryKey } from '../../lib/auth/queryKeys.ts';
import type { ApiSuccessResponse } from '../../types/api.ts';

type PaginatedMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

type AdminInfiniteSelectProps<TItem extends { id: string }> = {
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  resourceKey: string;
  endpoint: string;
  itemsKey: string;
  extraParams?: Record<string, string | undefined>;
  getLabel?: (item: TItem) => string;
  disabled?: boolean;
  enabled?: boolean;
  perPage?: number;
  allowClear?: boolean;
};

const DEFAULT_PER_PAGE = 20;

function unwrapListItems<TItem>(raw: unknown): TItem[] {
  if (Array.isArray(raw)) {
    return raw as TItem[];
  }

  if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
    return (raw as { data: TItem[] }).data;
  }

  return [];
}

function defaultGetLabel<TItem extends { id: string }>(item: TItem): string {
  if ('name' in item && typeof item.name === 'string' && item.name.trim() !== '') {
    return item.name;
  }

  return item.id;
}

export function AdminInfiniteSelect<TItem extends { id: string }>({
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  resourceKey,
  endpoint,
  itemsKey,
  extraParams,
  getLabel = defaultGetLabel,
  disabled = false,
  enabled = true,
  perPage = DEFAULT_PER_PAGE,
  allowClear = true,
}: AdminInfiniteSelectProps<TItem>) {
  const { t } = useLocale();
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [pickedLabel, setPickedLabel] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const trimmedSearch = debouncedSearch.trim();

  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: adminQueryKey(resourceKey, 'infinite', perPage, trimmedSearch, extraParams),
      queryFn: async ({ pageParam }) => {
        const response = await adminApi.get<
          ApiSuccessResponse<
            Record<string, unknown> & { meta?: PaginatedMeta; pagination?: PaginatedMeta }
          >
        >(endpoint, {
          params: {
            page: pageParam,
            per_page: perPage,
            q: trimmedSearch || undefined,
            ...extraParams,
          },
        });

        const payload = response.data.data;
        const pageItems = unwrapListItems<TItem>(payload[itemsKey]);
        const meta = (payload.meta as PaginatedMeta | undefined) ??
          (payload.pagination as PaginatedMeta | undefined) ?? {
            current_page: pageParam,
            last_page: pageParam,
            per_page: perPage,
            total: pageItems.length,
          };

        return { items: pageItems, meta };
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage) =>
        lastPage.meta.current_page < lastPage.meta.last_page
          ? lastPage.meta.current_page + 1
          : undefined,
      enabled: enabled && open && !disabled,
      placeholderData: keepPreviousData,
      staleTime: 30_000,
    });

  const items = useMemo(() => {
    const seen = new Set<string>();
    const result: TItem[] = [];

    for (const page of data?.pages ?? []) {
      for (const item of page.items) {
        if (seen.has(item.id)) {
          continue;
        }
        seen.add(item.id);
        result.push(item);
      }
    }

    return result;
  }, [data]);

  useEffect(() => {
    if (!open) {
      return;
    }

    searchRef.current?.focus();

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open || isLoading || !hasNextPage || isFetchingNextPage) {
      return;
    }

    const sentinel = sentinelRef.current;
    const root = listRef.current;
    if (!sentinel || !root) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void fetchNextPage();
        }
      },
      { root, rootMargin: '48px', threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [open, items.length, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const matchedItem = items.find((item) => item.id === value);
  const selectedLabel = !value ? '' : matchedItem ? getLabel(matchedItem) : pickedLabel;
  const triggerLabel = selectedLabel || placeholder;
  const showPinnedSelected =
    Boolean(value) && Boolean(selectedLabel) && trimmedSearch === '' && !matchedItem;

  const choose = (id: string, label: string) => {
    onChange(id);
    setPickedLabel(id ? label : '');
    setSearch('');
    setOpen(false);
  };

  const toggleOpen = () => {
    if (disabled) {
      return;
    }

    if (open) {
      setOpen(false);
      return;
    }

    setSearch('');
    setOpen(true);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={toggleOpen}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition hover:border-diyar-brown focus:border-diyar-brown cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={`truncate ${value ? 'font-medium text-diyar-dark' : 'text-gray-400'}`}>
          {triggerLabel}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-400 transition ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <div className="absolute start-0 end-0 z-30 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
            <Search size={14} className="shrink-0 text-gray-400" />
            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                }
              }}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
            {isFetching && !isFetchingNextPage ? (
              <Loader2 size={14} className="shrink-0 animate-spin text-diyar-brown" />
            ) : null}
          </div>

          <div
            ref={listRef}
            id={listboxId}
            role="listbox"
            className="max-h-56 overflow-y-auto py-1"
          >
            {allowClear ? (
              <button
                type="button"
                role="option"
                aria-selected={!value}
                onClick={() => choose('', '')}
                className="flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-start text-sm text-gray-500 hover:bg-[#f7f4f1]"
              >
                {placeholder}
              </button>
            ) : null}

            {showPinnedSelected ? (
              <OptionButton
                id={value}
                label={selectedLabel}
                selected
                onChoose={() => choose(value, selectedLabel)}
              />
            ) : null}

            {isLoading ? (
              <div className="flex items-center justify-center py-6 text-diyar-brown">
                <Loader2 className="animate-spin" size={20} />
              </div>
            ) : items.length === 0 && !showPinnedSelected ? (
              <p className="px-3 py-6 text-center text-sm text-gray-400">
                {t('admin.shipping.noMatchingOptions')}
              </p>
            ) : (
              items.map((item) => {
                const label = getLabel(item);
                return (
                  <OptionButton
                    key={item.id}
                    id={item.id}
                    label={label}
                    selected={item.id === value}
                    onChoose={() => choose(item.id, label)}
                  />
                );
              })
            )}

            <div ref={sentinelRef} className="h-1" />

            {isFetchingNextPage ? (
              <div className="flex items-center justify-center py-2 text-diyar-brown">
                <Loader2 className="animate-spin" size={16} />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function OptionButton({
  id,
  label,
  selected,
  onChoose,
}: {
  id: string;
  label: string;
  selected: boolean;
  onChoose: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      data-id={id}
      onClick={onChoose}
      className={`flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-start text-sm hover:bg-[#f7f4f1] ${
        selected ? 'bg-[#f7f4f1] font-semibold text-diyar-dark' : 'text-diyar-dark'
      }`}
    >
      <span className="truncate">{label}</span>
      {selected ? <Check size={14} className="shrink-0 text-diyar-brown" /> : null}
    </button>
  );
}
