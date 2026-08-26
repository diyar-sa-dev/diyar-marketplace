import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

type AdminAnalyticsSectionProps = {
  id: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  controls?: ReactNode;
  children: ReactNode;
  index?: number;
};

export function AdminAnalyticsSection({
  id,
  icon: Icon,
  title,
  subtitle,
  controls,
  children,
  index = 0,
}: AdminAnalyticsSectionProps) {
  return (
    <section
      id={id}
      className="animate-in fade-in slide-in-from-bottom-4 scroll-mt-28 rounded-2xl border border-gray-100 bg-white shadow-sm fill-mode-both duration-500 transition-shadow hover:shadow-md"
      style={{ animationDelay: `${index * 120}ms` }}
      aria-labelledby={`${id}-heading`}
    >
      <div className="flex flex-col gap-4 border-b border-gray-100 bg-linear-to-r from-white to-[#faf8f6] px-4 py-4 sm:px-6 sm:py-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <span className="inline-flex shrink-0 rounded-xl bg-diyar-brown/10 p-2.5 text-diyar-brown ring-1 ring-diyar-brown/10">
              <Icon size={18} aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 id={`${id}-heading`} className="text-lg font-bold text-diyar-dark sm:text-xl">
                {title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{subtitle}</p>
            </div>
          </div>
        </div>
        {controls ? (
          <div className="shrink-0 rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-sm">
            {controls}
          </div>
        ) : null}
      </div>
      <div className="px-4 py-5 sm:px-6 sm:py-6">{children}</div>
    </section>
  );
}

type PeriodSelectProps = {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  options: Array<{ value: string | number; label: string }>;
};

export function AnalyticsPeriodSelect({ label, value, onChange, options }: PeriodSelectProps) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-600 sm:flex-row sm:items-center sm:gap-2">
      <span className="whitespace-nowrap">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-34 rounded-xl border border-gray-200 bg-white px-3 py-2 text-diyar-dark transition-colors focus:border-diyar-brown focus:outline-none focus:ring-2 focus:ring-diyar-brown/20"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
