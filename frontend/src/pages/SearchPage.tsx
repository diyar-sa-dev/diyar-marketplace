import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Camera,
  ChevronLeft,
  Filter,
  LayoutGrid,
  List,
  Loader2,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import ProductCard from '../components/cards/ProductCard.tsx';
import ServiceCard from '../components/cards/ServiceCard.tsx';
import { PaginationBar } from '../components/catalog/PaginationBar.tsx';
import { CatalogSearchFiltersPanel } from '../components/search/CatalogSearchFilters.tsx';
import {
  SearchFiltersSkeleton,
  SearchResultsSkeleton,
} from '../components/search/SearchResultsSkeleton.tsx';
import { EmptyState } from '../components/common/EmptyState.tsx';
import { ErrorState } from '../components/common/ErrorState.tsx';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchCatalogSearch } from '../api/catalogSearch.ts';
import { useDebouncedValue } from '../hooks/useDebouncedValue.ts';
import { usePlatformCommerce } from '../hooks/usePlatformCommerce.ts';
import {
  hasCatalogSearchContext,
  normalizeCatalogSearchFilters,
  useCatalogSearch,
} from '../hooks/catalog/useCatalogSearch.ts';
import { useLocale } from '../hooks/useLocale.ts';
import { mapProductCard } from '../lib/catalogMappers.ts';
import type { CatalogSearchFilters } from '../types/catalogSearch.ts';

const VISUAL_SEARCH_QUERY = 'visual_search_results';
const PER_PAGE_OPTIONS = [12, 24, 36, 48] as const;
const MAX_PRICE = 20000;

function readFiltersFromParams(
  searchParams: URLSearchParams,
  debouncedQuery: string,
): CatalogSearchFilters {
  const entries = Object.fromEntries(searchParams.entries());
  return normalizeCatalogSearchFilters({
    ...entries,
    q: debouncedQuery || entries.q,
  });
}

export default function SearchPage() {
  const { t, dir } = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<CatalogSearchFilters | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const rawQuery = searchParams.get('q')?.replace(/\s+/g, ' ').trim() ?? '';
  const debouncedQuery = useDebouncedValue(rawQuery, 300);
  const isVisualSearch = rawQuery === VISUAL_SEARCH_QUERY;

  const filters = useMemo(
    () => readFiltersFromParams(searchParams, debouncedQuery),
    [searchParams, debouncedQuery],
  );

  const { loyaltySarPerPoint, loyaltyPointsPerUnit } = usePlatformCommerce();
  const searchEnabled = !isVisualSearch && hasCatalogSearchContext(filters, rawQuery);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useCatalogSearch(filters, { enabled: searchEnabled });

  const products = useMemo(
    () =>
      data?.products?.items.map((item) =>
        mapProductCard(item, {
          sarPerPoint: loyaltySarPerPoint,
          pointsPerUnit: loyaltyPointsPerUnit,
        }),
      ) ?? [],
    [data?.products?.items, loyaltySarPerPoint, loyaltyPointsPerUnit],
  );
  const services = data?.services?.items ?? [];
  const productPagination = data?.products?.pagination;
  const servicePagination = data?.services?.pagination;
  const facets = data?.facets ?? { vendors: [], categories: [], colors: [] };

  const activeType = filters.type ?? 'all';
  const productCount = productPagination?.total ?? 0;
  const serviceCount = servicePagination?.total ?? 0;
  const displayProductCount = isError ? 0 : productCount;
  const displayServiceCount = isError ? 0 : serviceCount;
  const displayTotalResults = isError
    ? 0
    : activeType === 'products'
      ? displayProductCount
      : activeType === 'services'
        ? displayServiceCount
        : displayProductCount + displayServiceCount;

  const updateFilters = useCallback(
    (patch: Partial<CatalogSearchFilters>, resetPage = false) => {
      const next = new URLSearchParams(searchParams);

      Object.entries(patch).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          next.delete(key);
          if (key === 'colors') {
            next.delete('color');
          }
          return;
        }

        if (key === 'colors' && Array.isArray(value)) {
          if (value.length === 0) {
            next.delete('colors');
            next.delete('color');
          } else {
            next.set('colors', value.join(','));
            next.delete('color');
          }
          return;
        }

        if (key === 'discounted') {
          next.set(key, value === true || value === 1 ? '1' : '0');
          return;
        }

        next.set(key, String(value));
      });

      if (resetPage) {
        next.delete('page');
      }

      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const clearFilters = useCallback(() => {
    const next = new URLSearchParams();
    if (rawQuery) {
      next.set('q', rawQuery);
    }
    setSearchParams(next, { replace: true });
  }, [rawQuery, setSearchParams]);

  const openFilterModal = () => {
    setDraftFilters(filters);
    setIsFilterOpen(true);
  };

  const applyDraftFilters = () => {
    if (!draftFilters) {
      setIsFilterOpen(false);
      return;
    }

    const next = new URLSearchParams();
    if (rawQuery) {
      next.set('q', rawQuery);
    }

    Object.entries(draftFilters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }
      if (key === 'colors' && Array.isArray(value)) {
        if (value.length > 0) {
          next.set('colors', value.join(','));
        }
        return;
      }
      if (key === 'discounted') {
        next.set(key, value === true || value === 1 ? '1' : '0');
        return;
      }
      if (key === 'q') {
        return;
      }
      next.set(key, String(value));
    });

    setSearchParams(next, { replace: true });
    setIsFilterOpen(false);
  };

  useEffect(() => {
    setIsFilterOpen(false);
  }, [searchParams]);

  const showInitialSkeleton = isLoading && !data;
  const showSubtleLoading = isFetching && Boolean(data);
  const panelFilters = draftFilters ?? filters;
  const debouncedPanelFilters = useDebouncedValue(panelFilters, 400);

  const { data: draftPreviewData } = useQuery({
    queryKey: ['search-page-draft-preview', debouncedPanelFilters],
    queryFn: () =>
      fetchCatalogSearch({
        ...debouncedPanelFilters,
        per_page: 1,
        page: 1,
      }),
    enabled: isFilterOpen,
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });

  const draftResultCount = useMemo(() => {
    if (!draftPreviewData) {
      return displayTotalResults;
    }

    const draftType = debouncedPanelFilters.type ?? 'all';
    if (draftType === 'services') {
      return draftPreviewData.services?.pagination.total ?? 0;
    }
    if (draftType === 'products') {
      return draftPreviewData.products?.pagination.total ?? 0;
    }

    return (
      (draftPreviewData.products?.pagination.total ?? 0) +
      (draftPreviewData.services?.pagination.total ?? 0)
    );
  }, [debouncedPanelFilters.type, draftPreviewData, displayTotalResults]);

  const renderProducts = () => {
    if (showInitialSkeleton) {
      return <SearchResultsSkeleton />;
    }
    if (products.length === 0) {
      return null;
    }

    return (
      <div className="space-y-6">
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4'
              : 'flex flex-col gap-3'
          }
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} layout={viewMode} />
          ))}
        </div>
        {productPagination && (
          <PaginationBar
            pagination={productPagination}
            page={filters.page ?? 1}
            perPage={filters.per_page ?? 48}
            perPageOptions={[...PER_PAGE_OPTIONS]}
            onPageChange={(page) => updateFilters({ page }, false)}
            onPerPageChange={(perPage) => updateFilters({ per_page: perPage, page: 1 }, false)}
            alwaysShow={productPagination.total > 0}
          />
        )}
      </div>
    );
  };

  const renderServices = () => {
    if (showInitialSkeleton) {
      return <SearchResultsSkeleton count={4} />;
    }
    if (services.length === 0) {
      return null;
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
        {servicePagination && (
          <PaginationBar
            pagination={servicePagination}
            page={filters.page ?? 1}
            perPage={filters.per_page ?? 48}
            perPageOptions={[...PER_PAGE_OPTIONS]}
            onPageChange={(page) => updateFilters({ page }, false)}
            onPerPageChange={(perPage) => updateFilters({ per_page: perPage, page: 1 }, false)}
            alwaysShow={servicePagination.total > 0}
          />
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-12" dir={dir}>
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-diyar-dark transition cursor-pointer">
              {t('catalog.productDetail.home')}
            </Link>
            <ChevronLeft size={16} />
            <span>{t('catalog.productDetail.searchResults')}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-diyar-dark mb-2 flex items-center gap-2">
            {isVisualSearch ? (
              <>
                <Camera className="text-diyar-brown" size={24} />
                <span>{t('catalog.productDetail.visualSearchTitle')}</span>
              </>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Search size={22} className="text-diyar-brown" />
                {rawQuery
                  ? t('catalog.search.resultsFor', { query: rawQuery })
                  : searchEnabled
                    ? t('catalog.search.filteredResultsTitle')
                    : t('catalog.search.startBrowsingTitle')}
              </span>
            )}
          </h1>
          {searchEnabled && !showInitialSkeleton && !isError && (
            <p className="text-gray-500 text-sm">
              {t('catalog.search.resultsCount', { count: displayTotalResults })}
            </p>
          )}
          {showSubtleLoading && (
            <p className="text-xs text-diyar-brown mt-2 inline-flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              {t('catalog.search.updating')}
            </p>
          )}
        </div>

        {isVisualSearch ? (
          <EmptyState
            title={t('catalog.search.visualSearchSoon')}
            description={t('catalog.search.visualSearchSoonDescription')}
          />
        ) : (
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            <aside className="hidden md:block w-72 shrink-0 self-start">
              {showInitialSkeleton && searchEnabled ? (
                <SearchFiltersSkeleton />
              ) : (
                <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm">
                  <CatalogSearchFiltersPanel
                    filters={filters}
                    facets={facets}
                    onChange={updateFilters}
                    onClear={clearFilters}
                    maxPrice={MAX_PRICE}
                    variant="plain"
                  />
                </div>
              )}
            </aside>

            <div className="flex-1 min-w-0">
              {!searchEnabled ? (
                <EmptyState
                  title={t('catalog.search.emptyTitle')}
                  description={t('catalog.search.emptyDescription')}
                  action={
                    <button
                      type="button"
                      onClick={openFilterModal}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-diyar-dark px-6 py-3 text-sm font-bold text-white cursor-pointer"
                    >
                      <SlidersHorizontal size={16} />
                      {t('catalog.search.filters.open')}
                    </button>
                  }
                />
              ) : isError ? (
                <ErrorState error={error as Error} onRetry={() => refetch()} />
              ) : (
                <>
                  <div className="bg-white border border-gray-200 rounded-2xl p-3 md:p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={openFilterModal}
                      className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold text-diyar-dark cursor-pointer md:hidden"
                    >
                      <Filter size={18} />
                      {t('catalog.search.filters.open')}
                    </button>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium hidden sm:inline">
                        {t('catalog.search.showingResults', {
                          shown:
                            activeType === 'services'
                              ? services.length
                              : activeType === 'products'
                                ? products.length
                                : products.length + services.length,
                          total: displayTotalResults,
                        })}
                      </span>
                      <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-1.5 bg-gray-50">
                        <span className="text-gray-500">{t('catalog.search.filters.sort')}:</span>
                        <select
                          value={filters.sort ?? '-created_at'}
                          onChange={(event) =>
                            updateFilters(
                              { sort: event.target.value as CatalogSearchFilters['sort'] },
                              true,
                            )
                          }
                          className="bg-transparent border-none outline-none font-bold text-diyar-dark cursor-pointer"
                        >
                          <option value="-created_at">{t('catalog.search.filters.sortNewest')}</option>
                          <option value="-popular">{t('catalog.search.filters.sortPopular')}</option>
                          <option value="-discount">{t('catalog.search.filters.sortOffers')}</option>
                          <option value="price">{t('catalog.search.filters.sortPriceLow')}</option>
                          <option value="-price">{t('catalog.search.filters.sortPriceHigh')}</option>
                          <option value="rating">{t('catalog.search.filters.sortRating')}</option>
                        </select>
                      </div>
                    </div>

                    <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-white shadow-sm text-diyar-brown' : 'text-gray-400 hover:text-diyar-dark'}`}
                        aria-label="Grid view"
                      >
                        <LayoutGrid size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-white shadow-sm text-diyar-brown' : 'text-gray-400 hover:text-diyar-dark'}`}
                        aria-label="List view"
                      >
                        <List size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="flex overflow-x-auto scrollbar-hide gap-2 mb-6">
                    {(['all', 'products', 'services'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => updateFilters({ type }, true)}
                        className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                          activeType === type
                            ? 'bg-diyar-dark text-white shadow-md'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {t(`catalog.search.filters.type_${type}`)} (
                        {type === 'products'
                          ? displayProductCount
                          : type === 'services'
                            ? displayServiceCount
                            : displayProductCount + displayServiceCount}
                        )
                      </button>
                    ))}
                  </div>

                  {(activeType === 'all' || activeType === 'products') && renderProducts()}
                  {(activeType === 'all' || activeType === 'services') && (
                    <div className={activeType === 'all' && products.length > 0 ? 'mt-10' : ''}>
                      {activeType === 'all' && services.length > 0 && (
                        <h2 className="text-lg font-bold text-diyar-dark mb-4">
                          {t('catalog.search.servicesSection')}
                        </h2>
                      )}
                      {renderServices()}
                    </div>
                  )}

                  {!showInitialSkeleton && products.length === 0 && services.length === 0 && (
                    <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-gray-100">
                      <h3 className="text-2xl font-bold text-diyar-dark mb-2">
                        {t('catalog.search.noResultsTitle')}
                      </h3>
                      <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        {t('catalog.search.noResultsDescription')}
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="bg-white border border-gray-200 text-diyar-dark px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all cursor-pointer"
                        >
                          {t('catalog.search.filters.clearAll')}
                        </button>
                        <Link
                          to="/"
                          className="bg-diyar-dark text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-all cursor-pointer"
                        >
                          {t('catalog.search.backHome')}
                        </Link>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {isFilterOpen && !isVisualSearch && (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 cursor-pointer"
            aria-label={t('catalog.search.filters.close')}
            onClick={() => setIsFilterOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 md:inset-y-0 md:inset-inline-end-0 md:left-auto md:w-full md:max-w-md max-h-[90vh] md:max-h-none bg-white md:rounded-none rounded-t-3xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <h2 className="font-bold text-lg text-diyar-dark inline-flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-diyar-brown" />
                {t('catalog.search.filters.title')}
              </h2>
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 cursor-pointer"
                aria-label={t('catalog.search.filters.close')}
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <CatalogSearchFiltersPanel
                filters={panelFilters}
                facets={facets}
                onChange={(patch) =>
                  setDraftFilters((current) => ({
                    ...(current ?? filters),
                    ...patch,
                  }))
                }
                onClear={() => setDraftFilters({ q: rawQuery || undefined })}
                maxPrice={MAX_PRICE}
                variant="plain"
              />
            </div>
            <div className="border-t border-gray-100 p-4 flex gap-3 bg-white">
              <button
                type="button"
                onClick={() => {
                  setDraftFilters({ q: rawQuery || undefined });
                  clearFilters();
                  setIsFilterOpen(false);
                }}
                className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-600 cursor-pointer"
              >
                {t('catalog.search.filters.clearAll')}
              </button>
              <button
                type="button"
                onClick={applyDraftFilters}
                className="flex-[1.4] rounded-xl bg-diyar-dark py-3 text-sm font-bold text-white shadow-lg cursor-pointer"
              >
                {t('catalog.search.showResults', { count: draftResultCount })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
