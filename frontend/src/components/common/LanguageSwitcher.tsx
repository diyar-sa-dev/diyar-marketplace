import { useLocale } from '../../hooks/useLocale.ts';
import type { Locale } from '../../lib/i18n/types.ts';

const options: Array<{ id: Locale; label: string }> = [
  { id: 'ar', label: 'AR' },
  { id: 'en', label: 'EN' },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div
      className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 p-0.5"
      dir="ltr"
      role="group"
      aria-label="Language"
    >
      {options.map((option) => {
        const isActive = locale === option.id;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => setLocale(option.id)}
            aria-pressed={isActive}
            className={`min-w-9 rounded-md px-2 py-1 text-xs font-bold transition-colors cursor-pointer ${
              isActive
                ? 'bg-diyar-dark text-white shadow-sm'
                : 'text-gray-600 hover:bg-white hover:text-diyar-dark'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
