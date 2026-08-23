import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Search,
  Star,
  Filter,
  Wrench,
  LayoutDashboard,
  Plus,
  User,
  Loader2,
} from 'lucide-react';
import { RequestServiceModal } from '../components/modals/RequestServiceModal.tsx';
import { ServiceRequestListCard } from '../components/services/ServiceRequestListCard.tsx';
import { ServiceTypeBadge } from '../components/services/ServiceTypeBadge.tsx';
import { PaginationBar } from '../components/catalog/PaginationBar.tsx';
import { useAuth } from '../hooks/auth/useAuth.ts';
import { useDebouncedValue } from '../hooks/useDebouncedValue.ts';
import { useServiceRequests } from '../hooks/services/useServiceRequests.ts';
import { useLocale } from '../hooks/useLocale.ts';
import { useServiceCategories, useServices } from '../hooks/services/useServices.ts';
import { parsePriceDigits } from '../lib/priceInput.ts';
import type { ServiceListFilters } from '../types/services.ts';
import { serviceCategoryIcon, SERVICE_IMAGE_FALLBACK } from '../lib/services/serviceUi.ts';
import { resolveServiceTypeLabel } from '../lib/serviceBookingDisplay.ts';

const SERVICE_SORTS: ServiceListFilters['sort'][] = [
  'latest',
  'rating',
  'most_requested',
  'price_asc',
  'price_desc',
];

function readServiceFiltersFromParams(searchParams: URLSearchParams): {
  q: string;
  category: string | null;
  sort: ServiceListFilters['sort'];
  page: number;
  minPrice: string;
  maxPrice: string;
  perPage: number;
} {
  const sortParam = searchParams.get('sort');
  const sort = SERVICE_SORTS.includes(sortParam as ServiceListFilters['sort'])
    ? (sortParam as ServiceListFilters['sort'])
    : 'latest';

  return {
    q: searchParams.get('q') ?? '',
    category: searchParams.get('category'),
    sort,
    page: Math.max(1, Number(searchParams.get('page') ?? 1) || 1),
    minPrice: searchParams.get('min_price') ?? '',
    maxPrice: searchParams.get('max_price') ?? '',
    perPage: Math.min(48, Math.max(1, Number(searchParams.get('per_page') ?? 12) || 12)),
  };
}

export default function ServicesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, dir, locale } = useLocale();
  const { isAuthenticated } = useAuth();

  const urlState = useMemo(() => readServiceFiltersFromParams(searchParams), [searchParams]);

  const [searchTerm, setSearchTerm] = useState(urlState.q);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(urlState.category);
  const [sort, setSort] = useState<ServiceListFilters['sort']>(urlState.sort);
  const [page, setPage] = useState(urlState.page);
  const [minPrice, setMinPrice] = useState(urlState.minPrice);
  const [maxPrice, setMaxPrice] = useState(urlState.maxPrice);
  const [perPage, setPerPage] = useState(urlState.perPage);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  useEffect(() => {
    setSearchTerm(urlState.q);
    setSelectedCategory(urlState.category);
    setSort(urlState.sort);
    setPage(urlState.page);
    setMinPrice(urlState.minPrice);
    setMaxPrice(urlState.maxPrice);
    setPerPage(urlState.perPage);
  }, [urlState]);

  useEffect(() => {
    const state = location.state as { openRequest?: boolean } | null;
    if (state?.openRequest) {
      setIsRequestModalOpen(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  const debouncedSearch = useDebouncedValue(searchTerm, 350);

  const syncUrl = useCallback(
    (patch: Partial<ReturnType<typeof readServiceFiltersFromParams>>) => {
      const next = new URLSearchParams(searchParams);

      const values = {
        q: patch.q ?? debouncedSearch.trim(),
        category: patch.category !== undefined ? patch.category : selectedCategory,
        sort: patch.sort ?? sort,
        page: patch.page ?? page,
        minPrice: patch.minPrice ?? minPrice,
        maxPrice: patch.maxPrice ?? maxPrice,
        perPage: patch.perPage ?? perPage,
      };

      if (values.q) {
        next.set('q', values.q);
      } else {
        next.delete('q');
      }

      if (values.category) {
        next.set('category', values.category);
      } else {
        next.delete('category');
      }

      if (values.sort && values.sort !== 'latest') {
        next.set('sort', values.sort);
      } else {
        next.delete('sort');
      }

      const min = parsePriceDigits(values.minPrice);
      const max = parsePriceDigits(values.maxPrice);
      if (min !== undefined) {
        next.set('min_price', String(min));
      } else {
        next.delete('min_price');
      }
      if (max !== undefined) {
        next.set('max_price', String(max));
      } else {
        next.delete('max_price');
      }

      if (values.page > 1) {
        next.set('page', String(values.page));
      } else {
        next.delete('page');
      }

      if (values.perPage !== 12) {
        next.set('per_page', String(values.perPage));
      } else {
        next.delete('per_page');
      }

      setSearchParams(next, { replace: true });
    },
    [
      debouncedSearch,
      maxPrice,
      minPrice,
      page,
      perPage,
      searchParams,
      selectedCategory,
      setSearchParams,
      sort,
    ],
  );

  useEffect(() => {
    syncUrl({
      q: debouncedSearch.trim(),
      page: debouncedSearch.trim() !== urlState.q ? 1 : page,
    });
  }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: categories = [], isLoading: categoriesLoading } = useServiceCategories();
  const { data: myRequestsData, isLoading: myRequestsLoading } = useServiceRequests(
    1,
    'all',
    3,
    isAuthenticated,
  );

  const filters = useMemo(
    () => ({
      q: debouncedSearch.trim() || undefined,
      category: selectedCategory ?? undefined,
      sort,
      page,
      per_page: perPage,
      min_price: parsePriceDigits(minPrice),
      max_price: parsePriceDigits(maxPrice),
    }),
    [debouncedSearch, selectedCategory, sort, page, perPage, minPrice, maxPrice],
  );

  const { data, isLoading, isFetching, isError } = useServices(filters);
  const services = data?.items ?? [];
  const pagination = data?.pagination;
  const myRequests = myRequestsData?.items ?? [];

  const categoryLabel = (nameAr: string, nameEn: string) => (locale === 'ar' ? nameAr : nameEn);

  const updateCategory = (slug: string | null) => {
    setSelectedCategory(slug);
    setPage(1);
    syncUrl({ category: slug, page: 1 });
  };

  const updateSort = (nextSort: ServiceListFilters['sort']) => {
    setSort(nextSort);
    setPage(1);
    syncUrl({ sort: nextSort, page: 1 });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-6" dir={dir}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-diyar-dark mb-3">
              {t('serviceMarketplace.catalog.title')}
            </h1>
            <p className="text-gray-600 max-w-2xl text-sm md:text-base">
              {t('serviceMarketplace.catalog.subtitle')}
            </p>
          </div>
          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="shrink-0 bg-diyar-brown text-white px-6 py-3 rounded-xl font-bold hover:bg-[#8A6D46] transition-colors shadow-lg shadow-diyar-brown/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus size={20} />
            {t('serviceMarketplace.catalog.customRequest')}
          </button>
        </div>

        {isAuthenticated && (
          <div className="mb-8">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-lg font-bold text-diyar-dark">
                {t('serviceMarketplace.catalog.yourRequests')}
              </h2>
              <Link
                to="/profile/service-requests"
                className="text-sm font-bold text-diyar-brown hover:text-diyar-dark transition-colors cursor-pointer"
              >
                {t('serviceMarketplace.catalog.viewAll')}
              </Link>
            </div>
            {myRequestsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-diyar-brown" />
              </div>
            ) : myRequests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center">
                <p className="text-gray-500 text-sm mb-3">
                  {t('serviceMarketplace.catalog.noRequests')}
                </p>
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-diyar-brown text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#8A6D46] transition-colors cursor-pointer"
                >
                  <Plus size={16} />
                  {t('serviceMarketplace.catalog.startRequest')}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myRequests.map((item) => (
                  <ServiceRequestListCard
                    key={item.id}
                    item={item}
                    locale={locale}
                    compact
                    onClick={() =>
                      navigate(`/profile/service-requests?id=${encodeURIComponent(item.id)}`)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex overflow-x-auto snap-x gap-4 mb-8 pb-4 scrollbar-hide">
          <button
            onClick={() => updateCategory(null)}
            className={`flex-none min-w-30 sm:flex-1 flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300 snap-center cursor-pointer ${
              selectedCategory === null
                ? 'bg-diyar-dark border-diyar-dark text-white shadow-lg'
                : 'bg-white border-gray-100 text-gray-600 hover:border-diyar-brown/30 hover:shadow-md'
            }`}
          >
            <LayoutDashboard
              className={`w-8 h-8 mb-3 ${selectedCategory === null ? 'text-white' : 'text-diyar-brown'}`}
            />
            <span className="font-bold text-sm">
              {t('serviceMarketplace.catalog.allCategories')}
            </span>
          </button>

          {categoriesLoading &&
            [...Array(5)].map((_, index) => (
              <div
                key={index}
                className="flex-none min-w-30 sm:flex-1 h-30 rounded-2xl bg-gray-100 animate-pulse"
              />
            ))}

          {!categoriesLoading &&
            categories.map((category) => {
              const Icon = serviceCategoryIcon(category.icon_key);
              const label = categoryLabel(category.name_ar, category.name_en);
              const isActive = selectedCategory === category.slug;

              return (
                <button
                  key={category.id}
                  onClick={() => updateCategory(category.slug)}
                  className={`flex-none min-w-30 sm:flex-1 flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300 snap-center cursor-pointer ${
                    isActive
                      ? 'bg-diyar-dark border-diyar-dark text-white shadow-lg'
                      : 'bg-white border-gray-100 text-gray-600 hover:border-diyar-brown/30 hover:shadow-md'
                  }`}
                >
                  <Icon
                    className={`w-8 h-8 mb-3 ${isActive ? 'text-white' : 'text-diyar-brown'}`}
                  />
                  <span className="font-bold text-sm text-center">{label}</span>
                </button>
              );
            })}
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute inset-s-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t('serviceMarketplace.catalog.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-xl pe-4 ps-10 py-3 text-sm focus:ring-2 focus:ring-diyar-brown outline-none"
            />
          </div>
          <div className="relative md:w-52 shrink-0">
            <select
              value={sort ?? 'latest'}
              onChange={(event) => updateSort(event.target.value as ServiceListFilters['sort'])}
              className="w-full appearance-none bg-gray-50 border border-transparent rounded-xl px-4 py-3 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-diyar-brown outline-none cursor-pointer"
            >
              <option value="latest">{t('serviceMarketplace.catalog.sort.latest')}</option>
              <option value="rating">{t('serviceMarketplace.catalog.sort.rating')}</option>
              <option value="most_requested">
                {t('serviceMarketplace.catalog.sort.mostRequested')}
              </option>
              <option value="price_asc">{t('serviceMarketplace.catalog.sort.priceAsc')}</option>
              <option value="price_desc">{t('serviceMarketplace.catalog.sort.priceDesc')}</option>
            </select>
            <Filter
              size={18}
              className="absolute inset-e-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <p className="text-sm text-gray-500">
            {pagination
              ? t('serviceMarketplace.catalog.resultsCount', { count: pagination.total })
              : null}
          </p>
          {isFetching && !isLoading && (
            <p className="text-xs text-diyar-brown inline-flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              {t('catalog.search.updating')}
            </p>
          )}
        </div>

        {isLoading && !data && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-diyar-brown" />
          </div>
        )}

        {isError && !isLoading && (
          <div className="text-center py-20">
            <p className="text-red-500 font-medium">{t('serviceMarketplace.catalog.loadError')}</p>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {services.map((service) => (
                <Link
                  to={`/service/${service.slug}`}
                  key={service.id}
                  className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col"
                >
                  <div className="relative h-48 overflow-hidden bg-gray-100">
                    <img
                      src={service.image_url || SERVICE_IMAGE_FALLBACK}
                      alt={service.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = SERVICE_IMAGE_FALLBACK;
                      }}
                    />
                    {resolveServiceTypeLabel(service) && (
                      <ServiceTypeBadge label={resolveServiceTypeLabel(service)!} overlay />
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-diyar-dark line-clamp-2 leading-snug group-hover:text-diyar-brown transition-colors">
                        {service.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-4">
                      <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0 text-gray-500">
                        <User size={12} />
                      </div>
                      <span className="line-clamp-1">{service.provider?.display_name}</span>
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-gray-400 block mb-0.5">
                          {t('serviceMarketplace.catalog.startingPrice')}
                        </span>
                        <div className="font-bold text-lg text-diyar-dark">
                          {service.pricing_label ||
                            (service.starting_price != null
                              ? `${service.starting_price} ${service.currency}`
                              : '—')}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded text-xs">
                        <Star size={12} className="text-yellow-500 fill-yellow-500" />
                        <span className="font-bold text-yellow-700">{service.rating_average}</span>
                        <span className="text-yellow-600/60">({service.reviews_count})</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {services.length === 0 && (
              <div className="text-center py-20">
                <Wrench size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">{t('serviceMarketplace.catalog.empty')}</p>
              </div>
            )}

            {pagination && (
              <PaginationBar
                pagination={pagination}
                page={page}
                perPage={perPage}
                perPageOptions={[12, 24, 36, 48]}
                onPageChange={(nextPage) => {
                  setPage(nextPage);
                  syncUrl({ page: nextPage });
                }}
                onPerPageChange={(nextPerPage) => {
                  setPerPage(nextPerPage);
                  setPage(1);
                  syncUrl({ perPage: nextPerPage, page: 1 });
                }}
                alwaysShow={pagination.total > 0}
              />
            )}
          </>
        )}
      </div>
      <RequestServiceModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
      />
    </div>
  );
}
