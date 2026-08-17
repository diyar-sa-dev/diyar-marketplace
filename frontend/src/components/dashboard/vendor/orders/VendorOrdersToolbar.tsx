import { Filter, Search } from 'lucide-react';
import { useLocale } from '../../../../hooks/useLocale.ts';
import type { PaymentFilter, VendorOrderTab } from './vendorOrderUtils.ts';

export function VendorOrdersToolbar({
  searchTerm,
  onSearchChange,
  paymentFilter,
  onPaymentFilterChange,
  isFilterOpen,
  onFilterToggle,
  isSearching = false,
  activeTab,
  onTabChange,
  tabs,
}: {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  paymentFilter: PaymentFilter;
  onPaymentFilterChange: (value: PaymentFilter) => void;
  isFilterOpen: boolean;
  onFilterToggle: () => void;
  isSearching?: boolean;
  activeTab: VendorOrderTab;
  onTabChange: (tab: VendorOrderTab) => void;
  tabs: Array<{ id: VendorOrderTab; label: string }>;
}) {
  const { t } = useLocale();

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <span className="text-xs font-bold text-gray-400">{t('vendorOrders.filterHint')}</span>

        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={t('vendorOrders.searchPlaceholder')}
              className="w-full rounded-xl border border-gray-200 py-2 ps-4 pe-10 text-sm focus:border-diyar-brown focus:outline-none focus:ring-2 focus:ring-diyar-brown/20"
            />
            <Search
              size={18}
              className={`absolute inset-e-3 top-1/2 -translate-y-1/2 ${isSearching ? 'animate-pulse text-diyar-brown' : 'text-gray-400'}`}
            />
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={onFilterToggle}
              className={`cursor-pointer rounded-xl border p-2 transition hover:bg-gray-50 ${
                isFilterOpen || paymentFilter !== 'all'
                  ? 'border-diyar-brown/30 bg-amber-50 text-diyar-brown'
                  : 'border-gray-200 text-gray-600'
              }`}
              aria-label={t('vendorOrders.filterTitle')}
            >
              <Filter size={20} />
            </button>

            {isFilterOpen && (
              <div className="absolute inset-e-0 z-10 mt-2 w-48 rounded-xl border border-gray-100 bg-white py-2 shadow-lg">
                <h4 className="mb-1 px-4 py-1 text-xs font-bold text-gray-400">
                  {t('vendorOrders.paymentFilterTitle')}
                </h4>
                {(['all', 'paid', 'pending', 'failed', 'refunded'] as PaymentFilter[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onPaymentFilterChange(option)}
                    className={`w-full cursor-pointer px-4 py-1.5 text-sm text-start hover:bg-gray-50 ${
                      paymentFilter === option ? 'font-bold text-diyar-brown' : 'text-diyar-dark'
                    }`}
                  >
                    {t(`vendorOrders.paymentFilter.${option}`)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto border-t border-gray-100 pt-4 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`cursor-pointer whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-diyar-brown text-white shadow-sm'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-diyar-dark'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
