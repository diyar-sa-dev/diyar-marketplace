import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import ProductCard from '../components/cards/ProductCard.tsx';
import { PaginationBar } from '../components/catalog/PaginationBar.tsx';
import { ChevronLeft, Camera } from 'lucide-react';
import { useSearchProducts, useVendors } from '../hooks/catalog/useCatalog.ts';
import { useLocale } from '../hooks/useLocale.ts';
import { usePaginationState } from '../hooks/usePaginationState.ts';
import { mapProductCard } from '../lib/catalogMappers.ts';
import { resolveMediaUrl } from '../lib/media.ts';
import { isValidStoreSlug, storePath } from '../lib/storePath.ts';
import { LoadingState } from '../components/common/LoadingState.tsx';
import { ErrorState } from '../components/common/ErrorState.tsx';
import { EmptyState } from '../components/common/EmptyState.tsx';

function useSearchParamsHelper() {
  return new URLSearchParams(useLocation().search);
}

export default function SearchPage() {
  const { t, dir } = useLocale();
  const query = useSearchParamsHelper();
  const searchQuery = query.get('q') || '';
  const [activeTab, setActiveTab] = useState<'all' | 'products' | 'stores' | 'services'>('all');
  const { page, perPage, perPageOptions, onPageChange, onPerPageChange, resetPage } =
    usePaginationState({ initialPerPage: 24, perPageOptions: [12, 24, 36, 48] });

  const {
    data: searchData,
    isLoading,
    isError,
    error,
    refetch,
  } = useSearchProducts({ q: searchQuery, per_page: perPage, page });

  const {
    data: vendorsData,
    isLoading: vendorsLoading,
    isError: vendorsError,
    error: vendorsErr,
    refetch: refetchVendors,
  } = useVendors({ q: searchQuery, per_page: 12 });

  const filteredProducts = searchData?.items.map(mapProductCard) ?? [];
  const vendors = vendorsData?.items ?? [];
  const isVisualSearch = searchQuery === 'visual_search_results';
  const productCount = searchData?.pagination.total ?? filteredProducts.length;
  const storeCount = vendorsData?.pagination.total ?? vendors.length;
  const totalResults = productCount + storeCount;

  const showProducts =
    (activeTab === 'all' || activeTab === 'products') && !isVisualSearch && Boolean(searchQuery);
  const showStoresTab = activeTab === 'stores' && !isVisualSearch;
  const showServicesTab = activeTab === 'services' && !isVisualSearch;

  useEffect(() => {
    resetPage();
  }, [searchQuery, activeTab, resetPage]);

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
              <span>{t('catalog.search.resultsFor', { query: searchQuery })}</span>
            )}
          </h1>
          {!isVisualSearch && searchQuery && !isLoading && (
            <p className="text-gray-500 text-sm">
              {t('catalog.productDetail.productsFound', { count: productCount })}
            </p>
          )}

          {isVisualSearch && (
            <div className="mt-4 flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-100 w-fit shadow-sm">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden shrink-0 border border-gray-100 bg-gray-100">
                <img
                  src="https://images.unsplash.com/photo-1544457070-4cd773b4d71e?auto=format&fit=crop&q=80&w=200"
                  alt={t('catalog.search.uploadedImage')}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <p className="text-sm font-bold text-diyar-dark mb-1">
                  {t('catalog.search.uploadedImage')}
                </p>
                <p className="text-xs text-gray-500">
                  {t('catalog.search.uploadedImageDescription')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        {!isVisualSearch && (
          <div className="flex overflow-x-auto scrollbar-hide gap-2 mb-8">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${activeTab === 'all' ? 'bg-diyar-dark text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
            >
              {t('catalog.search.all')} ({totalResults})
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${activeTab === 'products' ? 'bg-diyar-dark text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
            >
              {t('catalog.search.products')} ({productCount})
            </button>
            <button
              onClick={() => setActiveTab('stores')}
              className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${activeTab === 'stores' ? 'bg-diyar-dark text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
            >
              {t('catalog.search.stores')} ({storeCount})
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${activeTab === 'services' ? 'bg-diyar-dark text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
            >
              {t('catalog.productDetail.servicesTab')} (0)
            </button>
          </div>
        )}

        {!searchQuery && !isVisualSearch ? (
          <EmptyState
            title={t('catalog.search.emptyTitle')}
            description={t('catalog.search.emptyDescription')}
          />
        ) : isVisualSearch ? (
          showProducts && (
            <EmptyState
              title={t('catalog.search.visualSearchSoon')}
              description={t('catalog.search.visualSearchSoonDescription')}
            />
          )
        ) : showStoresTab ? (
          vendorsLoading ? (
            <LoadingState className="min-h-40" />
          ) : vendorsError ? (
            <ErrorState error={vendorsErr as Error} onRetry={() => refetchVendors()} />
          ) : vendors.length === 0 ? (
            <EmptyState
              title={t('catalog.search.noStores')}
              description={t('catalog.search.noStoresDescription')}
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {vendors
                .filter((vendor) => isValidStoreSlug(vendor.slug))
                .map((vendor) => (
                  <Link
                    key={vendor.id}
                    to={storePath(vendor.slug)!}
                    className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition text-center cursor-pointer"
                  >
                    {vendor.logo_url ? (
                      <img
                        src={resolveMediaUrl(vendor.logo_url) ?? ''}
                        alt={vendor.store_name}
                        className="w-16 h-16 rounded-full object-cover mx-auto mb-3"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-diyar-cream/40 flex items-center justify-center mx-auto mb-3 text-diyar-brown font-bold">
                        {vendor.store_name.charAt(0)}
                      </div>
                    )}
                    <h3 className="font-bold text-diyar-dark">{vendor.store_name}</h3>
                    {vendor.location && (
                      <p className="text-xs text-gray-500 mt-1">{vendor.location}</p>
                    )}
                  </Link>
                ))}
            </div>
          )
        ) : showServicesTab ? (
          <EmptyState
            title={t('catalog.search.servicesSoon')}
            description={t('catalog.search.servicesSoonDescription')}
          />
        ) : isLoading ? (
          <LoadingState className="min-h-60" />
        ) : isError ? (
          <ErrorState error={error as Error} onRetry={() => refetch()} />
        ) : showProducts && filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-100 flex flex-col items-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-400"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-diyar-dark mb-2">
              {t('catalog.search.noResultsTitle')}
            </h3>
            <p className="text-gray-500 mb-8 max-w-md">
              {t('catalog.search.noResultsDescription')}
            </p>
            <Link
              to="/"
              className="bg-diyar-dark text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-all cursor-pointer"
            >
              {t('catalog.search.backHome')}
            </Link>
          </div>
        ) : (
          showProducts && (
            <div className="space-y-12">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <path d="M16 10a4 4 0 0 1-8 0"></path>
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-diyar-dark">
                      {t('catalog.search.products')}
                    </h2>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {searchData?.pagination && (
                  <PaginationBar
                    pagination={searchData.pagination}
                    page={page}
                    perPage={perPage}
                    perPageOptions={[...perPageOptions]}
                    onPageChange={onPageChange}
                    onPerPageChange={onPerPageChange}
                    alwaysShow={searchData.pagination.total > 0}
                    className="mt-8"
                  />
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
