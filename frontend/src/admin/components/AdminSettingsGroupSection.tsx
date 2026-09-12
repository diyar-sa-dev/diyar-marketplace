import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { TranslateFn } from '../../lib/i18n/types.ts';

type AdminSettingsGroupSectionProps = {
  title: string;
  description?: string;
  icon: LucideIcon;
  accentClass: string;
  count: number;
  countLabel: string;
  children: ReactNode;
  headerExtra?: ReactNode;
};

export function AdminSettingsGroupSection({
  title,
  description,
  icon: Icon,
  accentClass,
  count,
  countLabel,
  children,
  headerExtra,
}: AdminSettingsGroupSectionProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-linear-to-r from-[#faf8f5] to-white px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl sm:h-12 sm:w-12 ${accentClass}`}
            >
              <Icon size={22} strokeWidth={2.2} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-extrabold text-diyar-dark sm:text-lg">{title}</h3>
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-gray-500 ring-1 ring-gray-200">
                  {count} {countLabel}
                </span>
              </div>
              {description ? (
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-500">
                  {description}
                </p>
              ) : null}
            </div>
          </div>
          {headerExtra ? <div className="w-full shrink-0 sm:w-auto">{headerExtra}</div> : null}
        </div>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </section>
  );
}

export function AdminSettingsFieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">{children}</div>;
}

export function AdminSettingsBooleanGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

export function groupDescription(group: string, t: TranslateFn): string {
  const key = `admin.settings.groupDescriptions.${group}` as never;
  const translated = t(key);
  return translated === key ? '' : translated;
}
