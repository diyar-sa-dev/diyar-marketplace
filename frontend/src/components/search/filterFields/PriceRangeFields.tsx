import { sanitizePriceDigits } from '../../../lib/priceInput.ts';
import { useLocale } from '../../../hooks/useLocale.ts';

type PriceRangeFieldsProps = {
  minPrice: string;
  maxPrice: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  layout?: 'row' | 'grid';
};

export function PriceRangeFields({
  minPrice,
  maxPrice,
  onMinChange,
  onMaxChange,
  layout = 'grid',
}: PriceRangeFieldsProps) {
  const { t } = useLocale();

  const containerClass =
    layout === 'row'
      ? 'flex items-center gap-3'
      : 'grid grid-cols-2 gap-3';

  return (
    <div className="space-y-2">
      <h3 className="font-bold text-sm text-diyar-dark">{t('catalog.search.filters.price')}</h3>
      <div className={containerClass}>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder={t('catalog.search.filters.minPrice')}
          value={minPrice}
          onChange={(event) => onMinChange(sanitizePriceDigits(event.target.value))}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition-all focus:border-diyar-brown focus:bg-white"
        />
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder={t('catalog.search.filters.maxPrice')}
          value={maxPrice}
          onChange={(event) => onMaxChange(sanitizePriceDigits(event.target.value))}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition-all focus:border-diyar-brown focus:bg-white"
        />
      </div>
    </div>
  );
}
