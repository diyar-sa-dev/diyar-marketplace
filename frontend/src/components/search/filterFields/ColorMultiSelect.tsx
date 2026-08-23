import type { CatalogSearchColorFacet } from '../../../types/catalogSearch.ts';
import { useLocale } from '../../../hooks/useLocale.ts';

type ColorMultiSelectProps = {
  colors: CatalogSearchColorFacet[];
  selected: string[];
  onChange: (colors: string[]) => void;
  showTitle?: boolean;
};

export function ColorMultiSelect({
  colors,
  selected,
  onChange,
  showTitle = true,
}: ColorMultiSelectProps) {
  const { t } = useLocale();

  if (colors.length === 0) {
    return null;
  }

  const toggleColor = (name: string) => {
    if (selected.includes(name)) {
      onChange(selected.filter((item) => item !== name));
      return;
    }

    onChange([...selected, name]);
  };

  return (
    <div className="space-y-3">
      {showTitle && (
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-sm text-diyar-dark">{t('catalog.search.filters.color')}</h3>
          {selected.length > 0 && (
            <span className="text-xs font-bold text-diyar-brown">
              {t('catalog.search.filters.selectedCount', { count: selected.length })}
            </span>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => {
          const isActive = selected.includes(color.name);

          return (
            <button
              key={color.name}
              type="button"
              onClick={() => toggleColor(color.name)}
              className={`rounded-full border px-3 py-1 text-xs font-bold cursor-pointer transition-colors ${
                isActive
                  ? 'border-diyar-brown bg-diyar-cream/60 text-diyar-dark'
                  : 'border-gray-200 text-gray-600 hover:border-diyar-brown/40'
              }`}
            >
              {color.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
