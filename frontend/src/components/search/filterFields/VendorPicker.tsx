import { useInfiniteQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { fetchVendors } from '../../../api/catalog.ts';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue.ts';
import { useLocale } from '../../../hooks/useLocale.ts';
import { useState } from 'react';

const PER_PAGE = 12;

type VendorPickerProps = {
  value: string;
  onChange: (slug: string) => void;
};

export function VendorPicker({ value, onChange }: VendorPickerProps) {
  const { t } = useLocale();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isFetching } =
    useInfiniteQuery({
      queryKey: ['vendor-picker', debouncedSearch],
      queryFn: ({ pageParam }) =>
        fetchVendors({
          page: pageParam,
          per_page: PER_PAGE,
          q: debouncedSearch || undefined,
        }),
      initialPageParam: 1,
      getNextPageParam: (lastPage) =>
        lastPage.pagination.current_page < lastPage.pagination.last_page
          ? lastPage.pagination.current_page + 1
          : undefined,
      staleTime: 60_000,
    });

  const vendors = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-sm text-diyar-dark">{t('catalog.search.filters.store')}</h3>

      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={t('catalog.search.filters.searchStore')}
        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition-all focus:border-diyar-brown focus:bg-white"
      />

      <div className="max-h-52 overflow-y-auto space-y-1 pe-1">
        <label className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm cursor-pointer hover:bg-gray-50">
          <input
            type="radio"
            name="vendor-picker"
            checked={!value}
            onChange={() => onChange('')}
            className="accent-diyar-brown"
          />
          <span>{t('catalog.search.filters.allStores')}</span>
        </label>

        {isLoading ? (
          <div className="flex items-center justify-center py-6 text-diyar-brown">
            <Loader2 className="animate-spin" size={20} />
          </div>
        ) : (
          vendors.map((vendor) => (
            <label
              key={vendor.id}
              className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm cursor-pointer hover:bg-gray-50"
            >
              <span className="inline-flex items-center gap-2 min-w-0">
                <input
                  type="radio"
                  name="vendor-picker"
                  checked={value === vendor.slug}
                  onChange={() => onChange(vendor.slug)}
                  className="accent-diyar-brown shrink-0"
                />
                <span className="truncate font-medium text-diyar-dark">{vendor.store_name}</span>
              </span>
              {vendor.product_count != null || vendor.products_count != null ? (
                <span className="text-xs text-gray-400 shrink-0">
                  {vendor.product_count ?? vendor.products_count ?? 0}
                </span>
              ) : null}
            </label>
          ))
        )}
      </div>

      {hasNextPage && (
        <button
          type="button"
          disabled={isFetchingNextPage || isFetching}
          onClick={() => void fetchNextPage()}
          className="w-full rounded-xl border border-gray-200 bg-white py-2 text-xs font-bold text-diyar-dark hover:bg-gray-50 cursor-pointer disabled:opacity-60"
        >
          {isFetchingNextPage ? t('common.loading') : t('catalog.search.filters.loadMoreStores')}
        </button>
      )}
    </div>
  );
}
