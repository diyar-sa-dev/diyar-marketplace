import type { VendorWorkingHour, Weekday } from '../../api/vendorSettings.ts';
import { useLocale } from '../../hooks/useLocale.ts';

type WorkingHoursEditorProps = {
  hours: VendorWorkingHour[];
  onChange: (hours: VendorWorkingHour[]) => void;
};

export function WorkingHoursEditor({ hours, onChange }: WorkingHoursEditorProps) {
  const { t, dir } = useLocale();

  const updateHour = (day: Weekday, patch: Partial<VendorWorkingHour>) => {
    onChange(
      hours.map((entry) =>
        entry.day === day
          ? {
              ...entry,
              ...patch,
            }
          : entry,
      ),
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
      {hours.map((entry) => (
        <div
          key={entry.day}
          className={`rounded-2xl border p-4 transition-colors ${
            entry.is_closed
              ? 'border-gray-100 bg-gray-50/80'
              : 'border-diyar-brown/15 bg-amber-50/20'
          }`}
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="font-bold text-diyar-dark">
              {t(`vendor.settings.weekdays.${entry.day}`)}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={!entry.is_closed}
              onClick={() =>
                updateHour(entry.day, {
                  is_closed: !entry.is_closed,
                  opens_at: entry.is_closed ? (entry.opens_at ?? '09:00') : null,
                  closes_at: entry.is_closed ? (entry.closes_at ?? '22:00') : null,
                })
              }
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                entry.is_closed ? 'bg-gray-300' : 'bg-diyar-brown'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  entry.is_closed
                    ? dir === 'rtl'
                      ? '-translate-x-1'
                      : 'translate-x-1'
                    : dir === 'rtl'
                      ? '-translate-x-6'
                      : 'translate-x-6'
                }`}
              />
            </button>
          </div>

          <p
            className={`text-xs font-bold mb-2 ${entry.is_closed ? 'text-gray-400' : 'text-emerald-700'}`}
          >
            {entry.is_closed ? t('vendor.settings.store.closed') : t('vendor.settings.store.open')}
          </p>

          {!entry.is_closed && (
            <div className="flex items-center gap-2 dir-ltr">
              <div className="flex-1 min-w-0">
                <label className="sr-only">{t('vendor.settings.store.opensAt')}</label>
                <input
                  type="time"
                  value={entry.opens_at ?? '09:00'}
                  onChange={(event) => updateHour(entry.day, { opens_at: event.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-white px-2 py-2 text-sm focus:outline-none focus:border-diyar-brown cursor-pointer"
                />
              </div>
              <span className="text-gray-400 text-xs shrink-0">—</span>
              <div className="flex-1 min-w-0">
                <label className="sr-only">{t('vendor.settings.store.closesAt')}</label>
                <input
                  type="time"
                  value={entry.closes_at ?? '22:00'}
                  onChange={(event) => updateHour(entry.day, { closes_at: event.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-white px-2 py-2 text-sm focus:outline-none focus:border-diyar-brown cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
