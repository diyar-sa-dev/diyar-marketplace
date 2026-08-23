import React, { useMemo, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale.ts';
import { parsePriceDigits, sanitizePriceDigits } from '../../lib/priceInput.ts';
import type {
  CatalogSearchColorFacet,
  CatalogSearchCategoryFacet,
  CatalogSearchFilters,
  CatalogSearchVendorFacet,
} from '../../types/catalogSearch.ts';
import { ColorMultiSelect } from './filterFields/ColorMultiSelect.tsx';
import { VendorPicker } from './filterFields/VendorPicker.tsx';

const MAX_PRICE = 20000;

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Accordion({ title, children, defaultOpen = true }: AccordionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="border-b border-gray-100 py-4">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center justify-between font-bold text-diyar-dark outline-none group cursor-pointer"
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        <ChevronDown
          size={18}
          className={`text-gray-400 transition-transform duration-300 group-hover:text-diyar-brown ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-112 mt-4 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        {children}
      </div>
    </div>
  );
}

interface CatalogSearchFiltersProps {
  filters: CatalogSearchFilters;
  facets: {
    vendors: CatalogSearchVendorFacet[];
    categories: CatalogSearchCategoryFacet[];
    colors: CatalogSearchColorFacet[];
  };
  onChange: (patch: Partial<CatalogSearchFilters>, resetPage?: boolean) => void;
  onClear: () => void;
  maxPrice?: number;
  variant?: 'card' | 'plain';
}

export function CatalogSearchFiltersPanel({
  filters,
  facets,
  onChange,
  onClear,
  maxPrice = MAX_PRICE,
  variant = 'card',
}: CatalogSearchFiltersProps) {
  const { t } = useLocale();

  const selectedColors = filters.colors ?? (filters.color ? [filters.color] : []);
  const [minPriceInput, setMinPriceInput] = useState(
    filters.min_price !== undefined ? String(filters.min_price) : '',
  );
  const [maxPriceInput, setMaxPriceInput] = useState(
    filters.max_price !== undefined ? String(filters.max_price) : '',
  );

  const productCategories = useMemo(
    () => facets.categories.filter((category) => category.type !== 'service'),
    [facets.categories],
  );

  const activeChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; onRemove: () => void }> = [];

    if (filters.category_slug) {
      const category = facets.categories.find((item) => item.slug === filters.category_slug);
      chips.push({
        key: 'category',
        label: category?.name ?? filters.category_slug,
        onRemove: () => onChange({ category_slug: undefined }),
      });
    }

    if (filters.vendor_slug) {
      chips.push({
        key: 'vendor',
        label: filters.vendor_slug,
        onRemove: () => onChange({ vendor_slug: undefined }),
      });
    }

    selectedColors.forEach((color) => {
      chips.push({
        key: `color-${color}`,
        label: color,
        onRemove: () =>
          onChange({
            colors: selectedColors.filter((item) => item !== color),
            color: undefined,
          }),
      });
    });

    if (filters.material) {
      chips.push({
        key: 'material',
        label: filters.material,
        onRemove: () => onChange({ material: undefined }),
      });
    }

    if (filters.min_price || filters.max_price) {
      chips.push({
        key: 'price',
        label: `${filters.min_price ?? 0} - ${filters.max_price ?? maxPrice}`,
        onRemove: () => {
          setMinPriceInput('');
          setMaxPriceInput('');
          onChange({ min_price: undefined, max_price: undefined });
        },
      });
    }

    if (filters.discounted) {
      chips.push({
        key: 'discounted',
        label: t('catalog.search.filters.offers'),
        onRemove: () => onChange({ discounted: undefined }),
      });
    }

    if (filters.availability_mode === 'in_stock') {
      chips.push({
        key: 'in_stock',
        label: t('catalog.search.filters.inStockOnly'),
        onRemove: () => onChange({ availability_mode: undefined }),
      });
    }

    return chips;
  }, [facets.categories, filters, maxPrice, onChange, selectedColors, t]);

  const commitPrice = (nextMin: string, nextMax: string) => {
    onChange({
      min_price: parsePriceDigits(nextMin),
      max_price: parsePriceDigits(nextMax),
    });
  };

  return (
    <div
      className={
        variant === 'card'
          ? 'bg-white rounded-2xl border border-gray-100 p-4 md:p-5 shadow-sm'
          : 'space-y-0'
      }
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <h2 className="font-bold text-diyar-dark">{t('catalog.search.filters.title')}</h2>
        {activeChips.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-bold text-diyar-brown hover:text-diyar-dark cursor-pointer"
          >
            {t('catalog.search.filters.clearAll')}
          </button>
        )}
      </div>

      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.onRemove}
              className="inline-flex items-center gap-1 rounded-full bg-diyar-cream/50 px-3 py-1 text-xs font-bold text-diyar-dark cursor-pointer"
            >
              <span>{chip.label}</span>
              <X size={12} />
            </button>
          ))}
        </div>
      )}

      <Accordion title={t('catalog.search.filters.type')}>
        <div className="space-y-2">
          {(['all', 'products', 'services'] as const).map((type) => (
            <label key={type} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="search-type"
                checked={(filters.type ?? 'all') === type}
                onChange={() => onChange({ type }, true)}
                className="accent-diyar-brown"
              />
              <span>{t(`catalog.search.filters.type_${type}`)}</span>
            </label>
          ))}
        </div>
      </Accordion>

      <Accordion title={t('catalog.search.filters.category')}>
        <div className="space-y-2 max-h-48 overflow-y-auto pe-1">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="search-category"
              checked={!filters.category_slug}
              onChange={() => onChange({ category_slug: undefined })}
              className="accent-diyar-brown"
            />
            <span>{t('catalog.search.filters.allCategories')}</span>
          </label>
          {productCategories.map((category) => (
            <label key={category.slug} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="search-category"
                checked={filters.category_slug === category.slug}
                onChange={() => onChange({ category_slug: category.slug }, true)}
                className="accent-diyar-brown"
              />
              <span>{category.name}</span>
            </label>
          ))}
        </div>
      </Accordion>

      <Accordion title={t('catalog.search.filters.price')}>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={minPriceInput}
            onChange={(event) => {
              const next = sanitizePriceDigits(event.target.value);
              setMinPriceInput(next);
              commitPrice(next, maxPriceInput);
            }}
            placeholder={t('catalog.search.filters.minPrice')}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={maxPriceInput}
            onChange={(event) => {
              const next = sanitizePriceDigits(event.target.value);
              setMaxPriceInput(next);
              commitPrice(minPriceInput, next);
            }}
            placeholder={t('catalog.search.filters.maxPrice')}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
      </Accordion>

      {facets.colors.length > 0 && (
        <Accordion title={t('catalog.search.filters.color')}>
          <ColorMultiSelect
            colors={facets.colors}
            selected={selectedColors}
            onChange={(colors) => onChange({ colors, color: undefined }, true)}
            showTitle={false}
          />
        </Accordion>
      )}

      <Accordion title={t('catalog.search.filters.store')} defaultOpen={false}>
        <VendorPicker
          value={filters.vendor_slug ?? ''}
          onChange={(slug) => onChange({ vendor_slug: slug || undefined }, true)}
        />
      </Accordion>

      <Accordion title={t('catalog.search.filters.sort')}>
        <select
          value={filters.sort ?? '-created_at'}
          onChange={(event) => onChange({ sort: event.target.value as CatalogSearchFilters['sort'] }, true)}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm cursor-pointer"
        >
          <option value="-created_at">{t('catalog.search.filters.sortNewest')}</option>
          <option value="-popular">{t('catalog.search.filters.sortPopular')}</option>
          <option value="-discount">{t('catalog.search.filters.sortOffers')}</option>
          <option value="price">{t('catalog.search.filters.sortPriceLow')}</option>
          <option value="-price">{t('catalog.search.filters.sortPriceHigh')}</option>
          <option value="rating">{t('catalog.search.filters.sortRating')}</option>
        </select>
      </Accordion>

      <label className="mt-4 flex items-center gap-2 text-sm font-bold text-diyar-dark cursor-pointer">
        <input
          type="checkbox"
          checked={Boolean(filters.discounted)}
          onChange={(event) => onChange({ discounted: event.target.checked ? 1 : undefined }, true)}
          className="accent-diyar-brown"
        />
        <span>{t('catalog.search.filters.offersOnly')}</span>
      </label>

      <label className="mt-3 flex items-center gap-2 text-sm font-bold text-diyar-dark cursor-pointer">
        <input
          type="checkbox"
          checked={filters.availability_mode === 'in_stock'}
          onChange={(event) =>
            onChange({ availability_mode: event.target.checked ? 'in_stock' : undefined }, true)
          }
          className="accent-diyar-brown"
        />
        <span>{t('catalog.search.filters.inStockOnly')}</span>
      </label>
    </div>
  );
}
