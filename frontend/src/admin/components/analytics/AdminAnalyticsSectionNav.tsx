import type { LucideIcon } from 'lucide-react';
import { Filter, Search, Users } from 'lucide-react';
import { useLocale } from '../../../hooks/useLocale.ts';

export type AnalyticsSectionId = 'funnel' | 'cohorts' | 'search';

const SECTION_META: Record<
  AnalyticsSectionId,
  { icon: LucideIcon; labelKey: string }
> = {
  funnel: { icon: Filter, labelKey: 'admin.analytics.sections.funnel.title' },
  cohorts: { icon: Users, labelKey: 'admin.analytics.sections.cohorts.title' },
  search: { icon: Search, labelKey: 'admin.analytics.sections.search.title' },
};

type AdminAnalyticsSectionNavProps = {
  sections: AnalyticsSectionId[];
  activeSection?: AnalyticsSectionId | null;
  onNavigate: (section: AnalyticsSectionId) => void;
};

export function AdminAnalyticsSectionNav({
  sections,
  activeSection,
  onNavigate,
}: AdminAnalyticsSectionNavProps) {
  const { t, dir } = useLocale();

  if (sections.length <= 1) {
    return null;
  }

  return (
    <nav
      aria-label={t('admin.analytics.sectionNav')}
      className="sticky top-0 z-10 -mx-1 border-b border-gray-100 bg-[#f7f4f1]/95 px-1 py-3 backdrop-blur-sm"
      dir={dir}
    >
      <div className="flex gap-2 overflow-x-auto pb-1">
        {sections.map((section) => {
          const meta = SECTION_META[section];
          const Icon = meta.icon;
          const isActive = activeSection === section;

          return (
            <button
              key={section}
              type="button"
              onClick={() => onNavigate(section)}
              className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'border-diyar-brown bg-diyar-brown text-white shadow-md shadow-diyar-brown/20'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-diyar-brown/30 hover:text-diyar-dark'
              }`}
            >
              <Icon size={15} aria-hidden />
              {t(meta.labelKey)}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
