import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, ChevronLeft, ChevronRight, FolderHeart, ShoppingBag } from 'lucide-react';
import ProductCard from '../components/cards/ProductCard.tsx';
import ServiceCard from '../components/cards/ServiceCard.tsx';
import { PaginationBar } from '../components/catalog/PaginationBar.tsx';
import { ErrorState } from '../components/common/ErrorState.tsx';
import { LoadingState } from '../components/common/LoadingState.tsx';
import { useClearWishlist, useWishlist, useWishlistSummary } from '../hooks/profile/useWishlist.ts';
import { useAuth } from '../hooks/auth/useAuth.ts';
import { resolveAccountHubPath } from '../lib/auth/roles.ts';
import { useLocale } from '../lib/i18n/localeContext.ts';
import { mapProductCard } from '../lib/catalogMappers.ts';
import { confirmClearWishlist, showSuccessToast } from '../lib/confirmDialog.ts';
import type { ProductCard as ProductCardType } from '../types/catalog.ts';
import type { ServiceCard as ServiceCardType } from '../types/services.ts';

const PER_PAGE = 12;

export default function WishlistPage() {
  const { t, dir } = useLocale();
  const { user } = useAuth();
  const accountHubPath = resolveAccountHubPath(user?.roles);
  const [filterTab, setFilterTab] = useState<'all' | 'products' | 'services'>('all');
  const [productsPage, setProductsPage] = useState(1);
  const [servicesPage, setServicesPage] = useState(1);

  const summaryQuery = useWishlistSummary();
  const productsQuery = useWishlist(productsPage, PER_PAGE, 'products');
  const servicesQuery = useWishlist(servicesPage, PER_PAGE, 'services');
  const clearWishlist = useClearWishlist();

  const BreadcrumbChevron = dir === 'rtl' ? ChevronLeft : ChevronRight;

  const savedProducts = useMemo(
    () => (productsQuery.data?.items ?? []).map((item) => mapProductCard(item as ProductCardType)),
    [productsQuery.data?.items],
  );
  const savedServices = (servicesQuery.data?.items ?? []) as ServiceCardType[];
  const productCount = summaryQuery.data?.products ?? productsQuery.data?.pagination.total ?? 0;
  const savedServicesCount =
    summaryQuery.data?.services ?? servicesQuery.data?.pagination.total ?? 0;
  const totalCount = summaryQuery.data?.total ?? productCount + savedServicesCount;

  const isLoading =
    summaryQuery.isLoading ||
    ((filterTab === 'all' || filterTab === 'products') && productsQuery.isLoading) ||
    ((filterTab === 'all' || filterTab === 'services') && servicesQuery.isLoading);

  const isError =
    summaryQuery.isError ||
    ((filterTab === 'all' || filterTab === 'products') && productsQuery.isError) ||
    ((filterTab === 'all' || filterTab === 'services') && servicesQuery.isError);

  const handleClearAll = async () => {
    const confirmed = await confirmClearWishlist(t);
    if (!confirmed) {
      return;
    }

    await clearWishlist.mutateAsync();
    setProductsPage(1);
    setServicesPage(1);
    await showSuccessToast(t, 'profile.wishlistPage.clearSuccess');
  };

  const tabClass = (active: boolean) =>
    `flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer ${
      active
        ? 'bg-diyar-dark text-white shadow-sm scale-[1.01]'
        : 'text-gray-500 hover:text-diyar-brown hover:bg-gray-50 active:scale-[0.99]'
    }`;

  const showProductsSection = filterTab === 'all' || filterTab === 'products';
  const showServicesSection = filterTab === 'all' || filterTab === 'services';

  return (
    <div className="bg-gray-50 min-h-screen pb-24 md:pb-12 animate-in fade-in duration-300">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-diyar-dark transition-colors cursor-pointer">
              {t('common.home')}
            </Link>
            <BreadcrumbChevron size={16} />
            <Link to={accountHubPath} className="hover:text-diyar-dark transition-colors cursor-pointer">
              {t('common.myAccount')}
            </Link>
            <BreadcrumbChevron size={16} />
            <span className="font-bold text-diyar-dark">
              {t('profile.wishlistPage.breadcrumb')}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-diyar-dark mb-1 flex items-center gap-2">
              <Bookmark className="text-diyar-brown fill-diyar-brown" size={28} />
              {t('profile.wishlistPage.title')}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {t('profile.wishlistPage.subtitle', { count: totalCount })}
            </p>
          </div>
          {totalCount > 0 && (
            <button
              type="button"
              onClick={() => void handleClearAll()}
              disabled={clearWishlist.isPending}
              className="text-red-500 hover:text-red-600 font-bold text-sm bg-red-50 hover:bg-red-100/60 px-4 py-2 rounded-xl transition-all duration-200 self-start sm:self-auto cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {t('profile.wishlistPage.clearAll')}
            </button>
          )}
        </div>

        <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm max-w-md mb-8">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={tabClass(filterTab === 'all')}
          >
            {t('profile.wishlistPage.tabAll')} ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterTab('products');
              setProductsPage(1);
            }}
            className={tabClass(filterTab === 'products')}
          >
            {t('profile.wishlistPage.tabProducts')} ({productCount})
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterTab('services');
              setServicesPage(1);
            }}
            className={tabClass(filterTab === 'services')}
          >
            {t('profile.wishlistPage.tabServices')} ({savedServicesCount})
          </button>
        </div>

        {isLoading ? (
          <LoadingState className="min-h-60" />
        ) : isError ? (
          <ErrorState
            error={(productsQuery.error ?? servicesQuery.error ?? summaryQuery.error) as Error}
            title={t('profile.wishlistPage.loadError')}
            onRetry={() => {
              void summaryQuery.refetch();
              void productsQuery.refetch();
              void servicesQuery.refetch();
            }}
          />
        ) : totalCount === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-100 flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-300 relative">
              <Bookmark size={48} strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-bold text-diyar-dark mb-2">
              {t('profile.wishlistPage.emptyTitle')}
            </h3>
            <p className="text-gray-500 mb-8 max-w-md">{t('profile.wishlistPage.emptyBody')}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/category/all"
                className="bg-diyar-dark text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-all duration-200 cursor-pointer active:scale-[0.98]"
              >
                {t('profile.wishlistPage.browseProducts')}
              </Link>
              <Link
                to="/services"
                className="bg-diyar-brown text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-700 transition-all duration-200 cursor-pointer active:scale-[0.98]"
              >
                {t('profile.wishlistPage.exploreServices')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {showProductsSection && (
              <div className="mb-10">
                {filterTab === 'all' && savedProducts.length > 0 && (
                  <h2 className="text-lg font-bold text-diyar-dark mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-diyar-brown rounded-full" />
                    {t('profile.wishlistPage.savedProducts')} ({productCount})
                  </h2>
                )}

                {filterTab === 'products' && savedProducts.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 flex flex-col items-center animate-in fade-in duration-300">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                      <ShoppingBag size={28} />
                    </div>
                    <h3 className="text-lg font-bold text-diyar-dark mb-1">
                      {t('profile.wishlistPage.noProductsTitle')}
                    </h3>
                    <p className="text-gray-500 text-sm max-w-sm mb-4">
                      {t('profile.wishlistPage.noProductsBody')}
                    </p>
                    <Link
                      to="/category/all"
                      className="bg-diyar-brown text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-orange-700 transition-all duration-200 cursor-pointer active:scale-[0.98]"
                    >
                      {t('profile.wishlistPage.shopProducts')}
                    </Link>
                  </div>
                ) : savedProducts.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-3 md:gap-4">
                      {savedProducts.map((product, index) => (
                        <div
                          key={product.id}
                          className="h-full animate-in fade-in slide-in-from-bottom-1 duration-300 fill-mode-both"
                          style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                        >
                          <ProductCard product={product} />
                        </div>
                      ))}
                    </div>
                    {productsQuery.data?.pagination && filterTab !== 'all' && (
                      <PaginationBar
                        pagination={productsQuery.data.pagination}
                        page={productsPage}
                        onPageChange={setProductsPage}
                        className="mt-10"
                      />
                    )}
                  </>
                ) : null}
              </div>
            )}

            {showServicesSection && (
              <div>
                {filterTab === 'all' && savedServices.length > 0 && (
                  <h2 className="text-lg font-bold text-diyar-dark mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-diyar-brown rounded-full" />
                    {t('profile.wishlistPage.savedServices')} ({savedServicesCount})
                  </h2>
                )}

                {filterTab === 'services' && savedServices.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 flex flex-col items-center animate-in fade-in duration-300">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                      <FolderHeart size={28} />
                    </div>
                    <h3 className="text-lg font-bold text-diyar-dark mb-1">
                      {t('profile.wishlistPage.noServicesTitle')}
                    </h3>
                    <p className="text-gray-500 text-sm max-w-sm mb-4">
                      {t('profile.wishlistPage.noServicesBody')}
                    </p>
                    <Link
                      to="/services"
                      className="bg-diyar-brown text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-orange-700 transition-all duration-200 cursor-pointer active:scale-[0.98]"
                    >
                      {t('profile.wishlistPage.exploreServices')}
                    </Link>
                  </div>
                ) : savedServices.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {savedServices.map((service) => (
                        <ServiceCard key={service.id} service={service} />
                      ))}
                    </div>
                    {servicesQuery.data?.pagination && filterTab !== 'all' && (
                      <PaginationBar
                        pagination={servicesQuery.data.pagination}
                        page={servicesPage}
                        onPageChange={setServicesPage}
                        className="mt-10"
                      />
                    )}
                  </>
                ) : filterTab === 'all' && savedServicesCount === 0 ? null : null}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
