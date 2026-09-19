import {
  clampMaxPriceInput,
  clampMinPriceInput,
  parsePriceDigits,
  sanitizePriceDigits,
} from '../../../lib/priceInput.ts';
import { useLocale } from '../../../hooks/useLocale.ts';

type PriceRangeFieldsProps = {
  minPrice: string;
  maxPrice: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  layout?: 'row' | 'grid';
  maxCeiling?: number;
  showTitle?: boolean;
};

export function PriceRangeFields({
  minPrice,
  maxPrice,
  onMinChange,
  onMaxChange,
  layout = 'grid',
  maxCeiling,
  showTitle = true,
}: PriceRangeFieldsProps) {
  const { t } = useLocale();

  const parsedMin = parsePriceDigits(minPrice);
  const parsedMax = parsePriceDigits(maxPrice);

  const containerClass = layout === 'row' ? 'flex items-center gap-3' : 'grid grid-cols-2 gap-3';

  return (
    <div className="space-y-2">
      {showTitle ? (
        <h3 className="font-bold text-sm text-diyar-dark">{t('catalog.search.filters.price')}</h3>
      ) : null}
      <div className={containerClass}>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={parsedMax}
          placeholder={t('catalog.search.filters.minPrice')}
          value={minPrice}
          onChange={(event) =>
            onMinChange(clampMinPriceInput(sanitizePriceDigits(event.target.value), maxPrice))
          }
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition-all focus:border-diyar-brown focus:bg-white"
        />
        <input
          type="number"
          inputMode="numeric"
          min={parsedMin ?? 0}
          max={maxCeiling}
          placeholder={t('catalog.search.filters.maxPrice')}
          value={maxPrice}
          onChange={(event) =>
            onMaxChange(clampMaxPriceInput(sanitizePriceDigits(event.target.value), minPrice))
          }
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition-all focus:border-diyar-brown focus:bg-white"
        />
      </div>
    </div>
  );
}
