import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  X,
  Check,
  Sparkles,
  SlidersHorizontal,
  Package,
  Wrench,
} from 'lucide-react';
import { fetchCatalogSearch } from '../../api/catalogSearch.ts';
import { fetchServiceCategories, fetchServices } from '../../api/services.ts';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.ts';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { parsePriceDigits } from '../../lib/priceInput.ts';
import type { CatalogSearchFilters } from '../../types/catalogSearch.ts';
import type { ServiceListFilters } from '../../types/services.ts';
import { ColorMultiSelect } from '../search/filterFields/ColorMultiSelect.tsx';
import { PriceRangeFields } from '../search/filterFields/PriceRangeFields.tsx';
import { VendorPicker } from '../search/filterFields/VendorPicker.tsx';

type FilterTab = 'products' | 'services' | 'ai';
type ServiceSort = NonNullable<ServiceListFilters['sort']>;

export function FilterModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t, locale, dir } = useLocale();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FilterTab>('products');

  const [searchType, setSearchType] = useState<'products' | 'services' | 'all'>('products');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [categorySlug, setCategorySlug] = useState('');
  const [vendorSlug, setVendorSlug] = useState('');
  const [offersOnly, setOffersOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<'-created_at' | '-popular'>('-created_at');

  const [serviceCategorySlug, setServiceCategorySlug] = useState('');
  const [serviceSort, setServiceSort] = useState<ServiceSort>('latest');
  const [serviceMinPrice, setServiceMinPrice] = useState('');
  const [serviceMaxPrice, setServiceMaxPrice] = useState('');

  const previewFilters = useMemo<CatalogSearchFilters>(
    () => ({
      type: searchType,
      category_slug: categorySlug || undefined,
      vendor_slug: vendorSlug || undefined,
      min_price: parsePriceDigits(minPrice),
      max_price: parsePriceDigits(maxPrice),
      colors: selectedColors.length > 0 ? selectedColors : undefined,
      discounted: offersOnly ? 1 : undefined,
      availability_mode: inStockOnly ? 'in_stock' : undefined,
      sort,
      per_page: 1,
      page: 1,
    }),
    [
      searchType,
      categorySlug,
      vendorSlug,
      minPrice,
      maxPrice,
      selectedColors,
      offersOnly,
      inStockOnly,
      sort,
    ],
  );

  const servicePreviewFilters = useMemo<ServiceListFilters>(
    () => ({
      category: serviceCategorySlug || undefined,
      sort: serviceSort,
      min_price: parsePriceDigits(serviceMinPrice),
      max_price: parsePriceDigits(serviceMaxPrice),
      per_page: 1,
      page: 1,
    }),
    [serviceCategorySlug, serviceSort, serviceMinPrice, serviceMaxPrice],
  );

  const debouncedPreviewFilters = useDebouncedValue(previewFilters, 400);
  const debouncedServicePreviewFilters = useDebouncedValue(servicePreviewFilters, 400);

  const { data: facetData } = useQuery({
    queryKey: ['filter-modal-facets'],
    queryFn: () => fetchCatalogSearch({ type: 'products', per_page: 1, page: 1 }),
    enabled: isOpen && activeTab === 'products',
    staleTime: 60_000,
  });

  const { data: serviceCategories = [] } = useQuery({
    queryKey: ['filter-modal-service-categories'],
    queryFn: () => fetchServiceCategories(),
    enabled: isOpen && activeTab === 'services',
    staleTime: 60_000,
  });

  const { data: previewData } = useQuery({
    queryKey: ['filter-modal-preview', debouncedPreviewFilters],
    queryFn: () => fetchCatalogSearch(debouncedPreviewFilters),
    enabled: isOpen && activeTab === 'products',
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });

  const { data: servicePreviewData } = useQuery({
    queryKey: ['filter-modal-services-preview', debouncedServicePreviewFilters],
    queryFn: () => fetchServices(debouncedServicePreviewFilters),
    enabled: isOpen && activeTab === 'services',
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });

  const facets = facetData?.facets;
  const productCategories = useMemo(
    () => facets?.categories.filter((category) => category.type !== 'service') ?? [],
    [facets?.categories],
  );

  const resultCount = useMemo(() => {
    if (activeTab === 'services') {
      return servicePreviewData?.pagination.total ?? 0;
    }

    if (!previewData) {
      return 0;
    }

    if (searchType === 'services') {
      return previewData.services?.pagination.total ?? 0;
    }

    if (searchType === 'products') {
      return previewData.products?.pagination.total ?? 0;
    }

    return (
      (previewData.products?.pagination.total ?? 0) + (previewData.services?.pagination.total ?? 0)
    );
  }, [activeTab, previewData, searchType, servicePreviewData?.pagination.total]);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setActiveTab('products');
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const applyProductFilters = () => {
    const params = new URLSearchParams();

    if (searchType !== 'all') {
      params.set('type', searchType);
    }

    const min = parsePriceDigits(minPrice);
    const max = parsePriceDigits(maxPrice);
    if (min !== undefined) {
      params.set('min_price', String(min));
    }
    if (max !== undefined) {
      params.set('max_price', String(max));
    }

    if (selectedColors.length > 0) {
      params.set('colors', selectedColors.join(','));
    }

    if (categorySlug) {
      params.set('category_slug', categorySlug);
    }

    if (vendorSlug) {
      params.set('vendor_slug', vendorSlug);
    }

    if (offersOnly) {
      params.set('discounted', '1');
    }

    if (inStockOnly) {
      params.set('availability_mode', 'in_stock');
    }

    if (sort) {
      params.set('sort', sort);
    }

    params.set('per_page', '48');

    onClose();
    navigate(`/search?${params.toString()}`);
  };

  const applyServiceFilters = () => {
    const params = new URLSearchParams();

    if (serviceCategorySlug) {
      params.set('category', serviceCategorySlug);
    }

    const min = parsePriceDigits(serviceMinPrice);
    const max = parsePriceDigits(serviceMaxPrice);
    if (min !== undefined) {
      params.set('min_price', String(min));
    }
    if (max !== undefined) {
      params.set('max_price', String(max));
    }

    if (serviceSort && serviceSort !== 'latest') {
      params.set('sort', serviceSort);
    }

    params.set('per_page', '12');

    onClose();
    navigate(`/services?${params.toString()}`);
  };

  const applyFilters = () => {
    if (activeTab === 'services') {
      applyServiceFilters();
      return;
    }

    applyProductFilters();
  };

  const resetFilters = () => {
    setSearchType('products');
    setMinPrice('');
    setMaxPrice('');
    setSelectedColors([]);
    setCategorySlug('');
    setVendorSlug('');
    setOffersOnly(false);
    setInStockOnly(false);
    setSort('-created_at');
    setServiceCategorySlug('');
    setServiceSort('latest');
    setServiceMinPrice('');
    setServiceMaxPrice('');
  };

  const categoryLabel = (nameAr: string, nameEn: string) => (locale === 'ar' ? nameAr : nameEn);

  const renderProductFilters = () => (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-diyar-dark">{t('catalog.search.filters.type')}</h3>
        <div className="flex flex-wrap gap-2">
          {(['products', 'services', 'all'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSearchType(type)}
              className={`px-4 py-2 rounded-xl border transition-all text-xs font-bold cursor-pointer ${
                searchType === type
                  ? 'border-diyar-brown bg-diyar-brown text-white'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {t(`catalog.search.filters.type_${type}`)}
            </button>
          ))}
        </div>
      </div>

      {productCategories.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-diyar-dark">{t('catalog.search.filters.category')}</h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategorySlug('')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer ${
                !categorySlug
                  ? 'bg-diyar-dark text-white'
                  : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t('catalog.search.filters.allCategories')}
            </button>
            {productCategories.map((category) => (
              <button
                key={category.slug}
                type="button"
                onClick={() => setCategorySlug(category.slug)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer ${
                  categorySlug === category.slug
                    ? 'bg-diyar-dark text-white'
                    : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <PriceRangeFields
        minPrice={minPrice}
        maxPrice={maxPrice}
        onMinChange={setMinPrice}
        onMaxChange={setMaxPrice}
        layout="grid"
      />

      {facets?.colors && (
        <ColorMultiSelect
          colors={facets.colors}
          selected={selectedColors}
          onChange={setSelectedColors}
        />
      )}

      <VendorPicker value={vendorSlug} onChange={setVendorSlug} />

      <div className="space-y-3 pt-4 border-t border-gray-100">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div
            className={`w-5 h-5 rounded flex items-center justify-center transition-colors border ${
              sort === '-created_at'
                ? 'bg-diyar-brown border-diyar-brown'
                : 'border-gray-300 group-hover:border-diyar-brown'
            }`}
          >
            {sort === '-created_at' && <Check size={14} className="text-white" />}
          </div>
          <span className="text-sm font-bold text-gray-700">{t('catalog.search.filters.sortNewest')}</span>
          <input
            type="radio"
            className="hidden"
            checked={sort === '-created_at'}
            onChange={() => setSort('-created_at')}
          />
        </label>
        <label className="flex items-center gap-3 cursor-pointer group">
          <div
            className={`w-5 h-5 rounded flex items-center justify-center transition-colors border ${
              sort === '-popular'
                ? 'bg-diyar-brown border-diyar-brown'
                : 'border-gray-300 group-hover:border-diyar-brown'
            }`}
          >
            {sort === '-popular' && <Check size={14} className="text-white" />}
          </div>
          <span className="text-sm font-bold text-gray-700">{t('catalog.search.filters.sortPopular')}</span>
          <input
            type="radio"
            className="hidden"
            checked={sort === '-popular'}
            onChange={() => setSort('-popular')}
          />
        </label>
        <label className="flex items-center gap-3 cursor-pointer group">
          <div
            className={`w-5 h-5 rounded flex items-center justify-center transition-colors border ${
              offersOnly ? 'bg-diyar-brown border-diyar-brown' : 'border-gray-300 group-hover:border-diyar-brown'
            }`}
          >
            {offersOnly && <Check size={14} className="text-white" />}
          </div>
          <span className="text-sm font-bold text-gray-700">{t('catalog.search.filters.offersOnly')}</span>
          <input
            type="checkbox"
            className="hidden"
            checked={offersOnly}
            onChange={() => setOffersOnly((value) => !value)}
          />
        </label>
        <label className="flex items-center gap-3 cursor-pointer group">
          <div
            className={`w-5 h-5 rounded flex items-center justify-center transition-colors border ${
              inStockOnly ? 'bg-diyar-brown border-diyar-brown' : 'border-gray-300 group-hover:border-diyar-brown'
            }`}
          >
            {inStockOnly && <Check size={14} className="text-white" />}
          </div>
          <span className="text-sm font-bold text-gray-700">{t('catalog.search.filters.inStockOnly')}</span>
          <input
            type="checkbox"
            className="hidden"
            checked={inStockOnly}
            onChange={() => setInStockOnly((value) => !value)}
          />
        </label>
      </div>
    </div>
  );

  const renderServiceFilters = () => (
    <div className="space-y-8 animate-in fade-in duration-300">
      <p className="text-sm text-gray-500">{t('catalog.search.filters.servicesHint')}</p>

      {serviceCategories.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-diyar-dark">{t('catalog.search.filters.category')}</h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setServiceCategorySlug('')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer ${
                !serviceCategorySlug
                  ? 'bg-diyar-dark text-white'
                  : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t('catalog.search.filters.allCategories')}
            </button>
            {serviceCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setServiceCategorySlug(category.slug)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer ${
                  serviceCategorySlug === category.slug
                    ? 'bg-diyar-dark text-white'
                    : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {categoryLabel(category.name_ar, category.name_en)}
              </button>
            ))}
          </div>
        </div>
      )}

      <PriceRangeFields
        minPrice={serviceMinPrice}
        maxPrice={serviceMaxPrice}
        onMinChange={setServiceMinPrice}
        onMaxChange={setServiceMaxPrice}
        layout="grid"
      />

      <div className="space-y-3 pt-4 border-t border-gray-100">
        <h3 className="font-bold text-sm text-diyar-dark">{t('catalog.search.filters.sort')}</h3>
        {(
          [
            ['latest', 'serviceMarketplace.catalog.sort.latest'],
            ['rating', 'serviceMarketplace.catalog.sort.rating'],
            ['most_requested', 'serviceMarketplace.catalog.sort.mostRequested'],
            ['price_asc', 'serviceMarketplace.catalog.sort.priceAsc'],
            ['price_desc', 'serviceMarketplace.catalog.sort.priceDesc'],
          ] as const
        ).map(([value, labelKey]) => (
          <label key={value} className="flex items-center gap-3 cursor-pointer group">
            <div
              className={`w-5 h-5 rounded flex items-center justify-center transition-colors border ${
                serviceSort === value
                  ? 'bg-diyar-brown border-diyar-brown'
                  : 'border-gray-300 group-hover:border-diyar-brown'
              }`}
            >
              {serviceSort === value && <Check size={14} className="text-white" />}
            </div>
            <span className="text-sm font-bold text-gray-700">{t(labelKey)}</span>
            <input
              type="radio"
              className="hidden"
              checked={serviceSort === value}
              onChange={() => setServiceSort(value)}
            />
          </label>
        ))}
      </div>
    </div>
  );

  const renderAIFilters = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl flex items-start gap-3">
        <Sparkles className="text-yellow-600 mt-0.5 shrink-0" size={20} />
        <div>
          <h4 className="font-bold text-sm text-yellow-800 mb-1">
            {t('catalog.search.aiFilters.title')}
          </h4>
          <p className="text-xs text-yellow-700/80">{t('catalog.search.aiFilters.description')}</p>
        </div>
      </div>
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
        {t('catalog.search.comingSoon')}
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-250 flex items-end justify-center p-0 overscroll-none md:items-center md:p-6"
      dir={dir}
    >
      <button
        type="button"
        className="absolute inset-0 bg-diyar-dark/60 backdrop-blur-sm transition-opacity cursor-pointer"
        aria-label={t('catalog.search.filters.close')}
        onClick={onClose}
      />

      <div className="relative z-10 mt-auto flex w-full max-w-xl max-h-[min(calc(100dvh-env(safe-area-inset-bottom,0px)-0.5rem),920px)] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl animate-in slide-in-from-bottom duration-300 md:mt-0 md:max-h-[min(90dvh,920px)] md:rounded-3xl">
        <div className="flex shrink-0 flex-col border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="text-diyar-brown" size={20} />
              <h2 className="text-lg font-bold text-diyar-dark sm:text-xl">
                {t('catalog.search.filters.title')}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-diyar-dark"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex gap-1 overflow-x-auto px-3 pb-2 scrollbar-hide sm:px-4">
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`py-2 px-4 whitespace-nowrap rounded-xl text-sm font-bold flex items-center gap-2 transition-all flex-1 justify-center cursor-pointer ${
                activeTab === 'products' ? 'bg-[#132624] text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Package size={16} /> {t('catalog.search.filters.type_products')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('services')}
              className={`py-2 px-4 whitespace-nowrap rounded-xl text-sm font-bold flex items-center gap-2 transition-all flex-1 justify-center cursor-pointer ${
                activeTab === 'services' ? 'bg-[#132624] text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Wrench size={16} /> {t('catalog.search.filters.type_services')}
            </button>
            <button
              type="button"
              disabled
              title={t('catalog.search.comingSoon')}
              className="py-2 px-4 whitespace-nowrap rounded-xl text-sm font-bold flex items-center gap-2 transition-all flex-1 justify-center opacity-50 cursor-not-allowed text-yellow-700 bg-yellow-50 border border-yellow-100"
            >
              <Sparkles size={16} /> {t('catalog.search.aiFilters.tab')}
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y bg-white p-4 sm:p-6">
          {activeTab === 'products' && renderProductFilters()}
          {activeTab === 'services' && renderServiceFilters()}
          {activeTab === 'ai' && renderAIFilters()}
        </div>

        <div className="sticky bottom-0 z-20 flex shrink-0 gap-3 border-t border-gray-100 bg-white p-4 pb-safe sm:p-5">
          <button
            type="button"
            onClick={resetFilters}
            className="px-5 py-3 text-diyar-dark text-sm font-bold hover:bg-gray-100 transition rounded-xl cursor-pointer"
          >
            {t('catalog.search.filters.clearAll')}
          </button>
          <button
            type="button"
            onClick={applyFilters}
            disabled={activeTab === 'ai'}
            className="flex-1 bg-diyar-brown text-white py-3 rounded-xl text-sm font-bold hover:bg-[#7a6450] transition-colors shadow-lg shadow-diyar-brown/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {activeTab === 'services'
              ? t('catalog.search.filters.browseServicesWithCount', { count: resultCount })
              : t('catalog.search.showResults', { count: resultCount })}
          </button>
        </div>
      </div>
    </div>
  );
}
