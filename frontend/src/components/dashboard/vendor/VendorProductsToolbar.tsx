import React from 'react';
import { Search, Plus, Filter, LayoutGrid, List } from 'lucide-react';
import type { Category } from '../../../types/catalog.ts';
import { useLocale } from '../../../hooks/useLocale.ts';
import { vendorButtonClass } from '../../../lib/vendorProductValidation.ts';

export interface VendorProductsToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  viewMode: 'list' | 'grid';
  onViewModeChange: (mode: 'list' | 'grid') => void;
  isFilterOpen: boolean;
  onFilterToggle: () => void;
  onAddProduct: () => void;
  canAddProduct?: boolean;
  categories: Category[];
  categoryFilter?: string;
  onCategoryFilterChange: (categoryId?: string) => void;
  stockFilter: 'all' | 'in_stock' | 'out_of_stock';
  onStockFilterChange: (value: 'all' | 'in_stock' | 'out_of_stock') => void;
}

export function VendorProductsToolbar({
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
  isFilterOpen,
  onFilterToggle,
  onAddProduct,
  canAddProduct = true,
  categories,
  categoryFilter,
  onCategoryFilterChange,
  stockFilter,
  onStockFilterChange,
}: VendorProductsToolbarProps) {
  const { t } = useLocale();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="text-right">
        <h2 className="text-2xl font-bold text-diyar-dark">{t('vendor.products.title')}</h2>
        <p className="text-gray-500 text-sm mt-1">{t('vendor.products.subtitle')}</p>
      </div>

      <div className="flex items-center gap-3 relative flex-wrap justify-end">
        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200/60">
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            className={`${vendorButtonClass} p-1.5 rounded-lg ${
              viewMode === 'list'
                ? 'bg-white shadow-sm text-diyar-dark ring-1 ring-gray-200'
                : 'text-gray-500 hover:text-diyar-dark hover:bg-white/60'
            }`}
            aria-label={t('vendor.products.listView')}
          >
            <List size={18} />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            className={`${vendorButtonClass} p-1.5 rounded-lg ${
              viewMode === 'grid'
                ? 'bg-white shadow-sm text-diyar-dark ring-1 ring-gray-200'
                : 'text-gray-500 hover:text-diyar-dark hover:bg-white/60'
            }`}
            aria-label={t('vendor.products.gridView')}
          >
            <LayoutGrid size={18} />
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder={t('vendor.products.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-diyar-brown/15 focus:border-diyar-brown text-sm w-full md:w-64 text-right hover:border-gray-300 transition-colors cursor-text bg-white"
          />
          <Search
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={onFilterToggle}
            className={`${vendorButtonClass} p-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-diyar-brown/30 hover:text-diyar-brown ${
              isFilterOpen ? 'bg-amber-50 border-diyar-brown/30 text-diyar-brown' : 'bg-white'
            }`}
            aria-label={t('vendor.products.filter')}
          >
            <Filter size={20} />
          </button>
          {isFilterOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-100 rounded-xl shadow-xl z-10 py-2 text-right animate-in fade-in slide-in-from-top-1 duration-200">
              <h4 className="px-4 py-1 text-xs font-bold text-gray-400 mb-1">
                {t('vendor.products.category')}
              </h4>
              <button
                type="button"
                onClick={() => onCategoryFilterChange(undefined)}
                className={`${vendorButtonClass} w-full text-right px-4 py-1.5 hover:bg-gray-50 text-sm justify-end ${
                  !categoryFilter ? 'text-diyar-brown font-bold bg-amber-50/50' : 'text-diyar-dark'
                }`}
              >
                {t('vendor.products.allCategories')}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onCategoryFilterChange(cat.id)}
                  className={`${vendorButtonClass} w-full text-right px-4 py-1.5 hover:bg-gray-50 text-sm justify-end ${
                    categoryFilter === cat.id
                      ? 'text-diyar-brown font-bold bg-amber-50/50'
                      : 'text-diyar-dark'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
              <div className="border-t border-gray-100 my-1" />
              <h4 className="px-4 py-1 text-xs font-bold text-gray-400 mb-1">
                {t('vendor.products.stockStatus')}
              </h4>
              {(
                [
                  ['all', 'vendor.products.stockAll'],
                  ['in_stock', 'vendor.products.stockInStock'],
                  ['out_of_stock', 'vendor.products.stockOutOfStock'],
                ] as const
              ).map(([value, labelKey]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onStockFilterChange(value)}
                  className={`${vendorButtonClass} w-full text-right px-4 py-1.5 hover:bg-gray-50 text-sm justify-end ${
                    stockFilter === value
                      ? 'text-diyar-brown font-bold bg-amber-50/50'
                      : 'text-diyar-dark'
                  }`}
                >
                  {t(labelKey)}
                </button>
              ))}
            </div>
          )}
        </div>

        {canAddProduct ? (
          <button
            type="button"
            onClick={onAddProduct}
            className={`${vendorButtonClass} bg-diyar-brown text-white px-5 py-2.5 text-sm hover:bg-[#A67B5B]/90 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]`}
          >
            <Plus size={18} />
            {t('vendor.products.addProduct')}
          </button>
        ) : null}
      </div>
    </div>
  );
}
