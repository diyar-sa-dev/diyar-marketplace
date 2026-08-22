import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Filter,
  MessageSquare,
  DollarSign,
  Clock,
  MapPin,
  CheckCircle2,
  X,
  ChevronDown,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PaginationBar } from '../../components/catalog/PaginationBar.tsx';
import { ErrorState } from '../../components/common/ErrorState.tsx';
import { ProviderRequestCardSkeleton } from '../../components/provider/ProviderRequestCardSkeleton.tsx';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.ts';
import { useProviderServiceRequests } from '../../hooks/provider/useProviderDashboard.ts';
import { useServiceCategories } from '../../hooks/services/useServices.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { usePaginationState } from '../../hooks/usePaginationState.ts';
import {
  formatProviderBudget,
  formatProviderRequestDate,
  providerCategoryLabel,
} from '../../lib/providerDashboardUi.ts';
import type { ProviderInboxFilters } from '../../types/providerDashboard.ts';

const PER_PAGE_DEFAULT = 9;

type SortOption = NonNullable<ProviderInboxFilters['sort']>;

export default function ServiceClientRequests() {
  const { t, dir, locale } = useLocale();
  const [activeTab, setActiveTab] = useState<'open' | 'offered'>('open');
  const [searchInput, setSearchInput] = useState('');
  const { page, perPage, perPageOptions, onPageChange, onPerPageChange, resetPage } =
    usePaginationState({ initialPerPage: PER_PAGE_DEFAULT });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortFilter, setSortFilter] = useState<SortOption>('newest');
  const filterRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  const { data: categories = [] } = useServiceCategories();

  const filters: ProviderInboxFilters = {
    status: activeTab === 'open' ? 'open' : 'submitted',
    page,
    per_page: perPage,
    q: debouncedSearch.trim() || undefined,
    category: categoryFilter || undefined,
    sort: sortFilter,
  };

  const { data, isLoading, isError, error, refetch } = useProviderServiceRequests(filters);

  const requests = data?.items ?? [];
  const activeFilterCount = (categoryFilter ? 1 : 0) + (sortFilter !== 'newest' ? 1 : 0);

  const sortOptions = useMemo(
    () => [
      { value: 'newest' as const, label: t('providerDashboard.clientRequests.filters.sortNewest') },
      { value: 'oldest' as const, label: t('providerDashboard.clientRequests.filters.sortOldest') },
      {
        value: 'budget_asc' as const,
        label: t('providerDashboard.clientRequests.filters.sortBudgetAsc'),
      },
      {
        value: 'budget_desc' as const,
        label: t('providerDashboard.clientRequests.filters.sortBudgetDesc'),
      },
    ],
    [t],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFiltersOpen(false);
      }
    };
    if (filtersOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filtersOpen]);

  const handleTabChange = (tab: 'open' | 'offered') => {
    setActiveTab(tab);
    resetPage();
  };

  const clearFilters = () => {
    setCategoryFilter('');
    setSortFilter('newest');
    resetPage();
  };

  return (
    <div className="space-y-6" dir={dir}>
      <div>
        <h1 className="text-2xl font-bold text-diyar-dark mb-2">
          {t('providerDashboard.clientRequests.title')}
        </h1>
        <p className="text-gray-500">{t('providerDashboard.clientRequests.subtitle')}</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => handleTabChange('open')}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'open' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {t('providerDashboard.clientRequests.tabs.open')}
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('offered')}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'offered' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {t('providerDashboard.clientRequests.tabs.offered')}
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute inset-s-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={t('providerDashboard.clientRequests.searchPlaceholder')}
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                resetPage();
              }}
              className="w-full bg-gray-50 border border-gray-100 rounded-lg pe-3 ps-9 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          <div className="relative" ref={filterRef}>
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              className={`relative p-2 border rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                filtersOpen || activeFilterCount > 0
                  ? 'border-blue-600 bg-blue-50 text-blue-600'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              aria-expanded={filtersOpen}
              aria-label={t('providerDashboard.clientRequests.filters.title')}
            >
              <Filter size={18} />
              <ChevronDown
                size={14}
                className={`hidden sm:block transition-transform ${filtersOpen ? 'rotate-180' : ''}`}
              />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -inset-e-1.5 min-w-4 h-4 px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {filtersOpen && (
              <div className="absolute inset-e-0 top-full mt-2 w-72 bg-white rounded-2xl border border-gray-100 shadow-xl z-50 p-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-diyar-dark">
                    {t('providerDashboard.clientRequests.filters.title')}
                  </h3>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      {t('providerDashboard.clientRequests.filters.clear')}
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    {t('providerDashboard.clientRequests.filters.category')}
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      resetPage();
                    }}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none cursor-pointer"
                  >
                    <option value="">
                      {t('providerDashboard.clientRequests.filters.allCategories')}
                    </option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.slug}>
                        {locale === 'ar' ? category.name_ar : category.name_en}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    {t('providerDashboard.clientRequests.filters.sort')}
                  </label>
                  <select
                    value={sortFilter}
                    onChange={(e) => {
                      setSortFilter(e.target.value as SortOption);
                      resetPage();
                    }}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none cursor-pointer"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-diyar-dark text-white text-sm font-bold hover:bg-black transition cursor-pointer"
                >
                  {t('providerDashboard.clientRequests.filters.apply')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {categoryFilter && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-diyar-dark text-xs font-bold border border-blue-600/20">
              {categories.find((c) => c.slug === categoryFilter)?.[
                locale === 'ar' ? 'name_ar' : 'name_en'
              ] ?? categoryFilter}
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter('');
                  resetPage();
                }}
                className="cursor-pointer hover:text-red-600"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {sortFilter !== 'newest' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">
              {sortOptions.find((o) => o.value === sortFilter)?.label}
              <button
                type="button"
                onClick={() => {
                  setSortFilter('newest');
                  resetPage();
                }}
                className="cursor-pointer hover:text-red-600"
              >
                <X size={12} />
              </button>
            </span>
          )}
        </div>
      )}

      {isError ? (
        <ErrorState
          message={t('providerDashboard.clientRequests.loadError')}
          error={error as Error}
          onRetry={() => void refetch()}
        />
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: perPage }).map((_, index) => (
            <ProviderRequestCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((request) => (
              <Link
                to={`/dashboard/service/client-requests/${request.id}`}
                key={request.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col p-5 group focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg truncate max-w-37.5">
                    {providerCategoryLabel(request, locale)}
                  </span>
                  <span className="text-gray-400 text-xs flex items-center gap-1">
                    <Clock size={12} /> {formatProviderRequestDate(request.created_at, locale)}
                  </span>
                </div>

                <h3 className="font-bold text-gray-800 mb-2 truncate group-hover:text-blue-600 transition-colors">
                  {t('providerDashboard.clientRequests.requestFrom', {
                    name: request.customer?.name ?? t('providerDashboard.common.client'),
                  })}
                </h3>

                <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-1">
                  {request.description}
                </p>

                <div className="space-y-2 mb-5">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MapPin size={14} className="text-gray-400" />
                    <span>{request.location ?? '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <DollarSign size={14} className="text-gray-400" />
                    <span className="font-medium text-gray-700">
                      {t('providerDashboard.common.budgetLabel')}{' '}
                      <span dir="ltr">
                        {formatProviderBudget(request.budget_min, request.budget_max, locale)}
                      </span>
                    </span>
                  </div>
                </div>

                <hr className="border-gray-50 mb-4" />

                {activeTab === 'open' ? (
                  <div className="w-full bg-blue-600 text-white py-2 rounded-xl text-sm font-bold text-center group-hover:bg-blue-700 transition-colors">
                    {t('providerDashboard.clientRequests.viewDetails')}
                  </div>
                ) : (
                  <div className="w-full bg-green-50 text-green-700 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} />{' '}
                    {t('providerDashboard.clientRequests.offerSubmitted')}
                  </div>
                )}
              </Link>
            ))}
          </div>

          {requests.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 flex flex-col items-center justify-center text-center">
              <MessageSquare size={48} className="text-gray-200 mb-4" />
              <h3 className="text-lg font-bold text-gray-700 mb-2">
                {t('providerDashboard.clientRequests.emptyTitle')}
              </h3>
              <p className="text-gray-500 text-sm max-w-sm">
                {t('providerDashboard.clientRequests.emptyDescription')}
              </p>
            </div>
          )}

          {data?.pagination && (
            <PaginationBar
              pagination={data.pagination}
              page={page}
              perPage={perPage}
              perPageOptions={[...perPageOptions]}
              onPageChange={onPageChange}
              onPerPageChange={onPerPageChange}
              alwaysShow={data.pagination.total > 0}
              className="mt-4"
            />
          )}
        </>
      )}
    </div>
  );
}
