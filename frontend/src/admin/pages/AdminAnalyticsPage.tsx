import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Filter, Search, Users } from 'lucide-react';
import { AdminPageSkeleton } from '../components/AdminPageSkeleton.tsx';
import {
  AdminAnalyticsSection,
  AnalyticsPeriodSelect,
} from '../components/analytics/AdminAnalyticsSection.tsx';
import {
  AdminAnalyticsSectionNav,
  type AnalyticsSectionId,
} from '../components/analytics/AdminAnalyticsSectionNav.tsx';
import { FunnelConversionPanel } from '../components/analytics/FunnelConversionPanel.tsx';
import { CohortRetentionPanel } from '../components/analytics/CohortRetentionPanel.tsx';
import { ErrorState } from '../../components/common/ErrorState.tsx';
import { TableLtrValue } from '../../components/common/TableLtrValue.tsx';
import { MetricCard } from '../../components/dashboard/analytics/MetricCard.tsx';
import { AnalyticsEmptyState } from '../../components/dashboard/analytics/AnalyticsEmptyState.tsx';
import { useLocale } from '../../hooks/useLocale.ts';
import { useAdminAuth } from '../auth/AdminAuthContext.tsx';
import {
  useAdminCohortAnalytics,
  useAdminFunnelAnalytics,
  useAdminSearchAnalytics,
} from '../../hooks/admin/useAdminAnalytics.ts';
import type { AnalyticsPeriodPreset } from '../../api/vendorAnalytics.ts';

const PERIOD_OPTIONS: AnalyticsPeriodPreset[] = ['7d', '30d', '90d', 'year'];
const MONTH_OPTIONS = [3, 6, 9, 12] as const;
const SECTION_IDS: AnalyticsSectionId[] = ['funnel', 'cohorts', 'search'];

function resolveCohortNote(rawNote: string | undefined, t: (key: string) => string) {
  if (!rawNote) {
    return null;
  }

  if (rawNote.includes('SQLite')) {
    return t('admin.analytics.sections.cohorts.sqliteNote');
  }

  return t('admin.analytics.sections.cohorts.retentionNote');
}

export default function AdminAnalyticsPage() {
  const { t, dir } = useLocale();
  const { hasPermission } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const canViewFunnel = hasPermission('analytics.view');
  const canViewCohorts = hasPermission('analytics.view');
  const canViewSearch = hasPermission('search.analytics.view');

  const [funnelPeriod, setFunnelPeriod] = useState<AnalyticsPeriodPreset>('30d');
  const [searchPeriod, setSearchPeriod] = useState<AnalyticsPeriodPreset>('30d');
  const [cohortMonths, setCohortMonths] = useState<number>(6);
  const [scrollSpySection, setScrollSpySection] = useState<AnalyticsSectionId | null>(null);
  const [trackedHash, setTrackedHash] = useState(location.hash);

  const funnelQuery = useAdminFunnelAnalytics(funnelPeriod, { enabled: canViewFunnel });
  const cohortQuery = useAdminCohortAnalytics(cohortMonths, { enabled: canViewCohorts });
  const searchQuery = useAdminSearchAnalytics(searchPeriod, { enabled: canViewSearch });

  const visibleSections = useMemo(
    () =>
      SECTION_IDS.filter((section) => {
        if (section === 'funnel' || section === 'cohorts') {
          return canViewFunnel || canViewCohorts;
        }
        return canViewSearch;
      }).filter((section) => {
        if (section === 'funnel') return canViewFunnel;
        if (section === 'cohorts') return canViewCohorts;
        return canViewSearch;
      }),
    [canViewFunnel, canViewCohorts, canViewSearch],
  );

  const hashSection = location.hash.replace('#', '') as AnalyticsSectionId;
  const sectionFromHash = visibleSections.includes(hashSection)
    ? hashSection
    : (visibleSections[0] ?? null);

  if (trackedHash !== location.hash) {
    setTrackedHash(location.hash);
    setScrollSpySection(null);
  }

  const activeSection = scrollSpySection ?? sectionFromHash;

  const scrollToSection = useCallback(
    (section: AnalyticsSectionId) => {
      setScrollSpySection(section);
      const element = document.getElementById(section);
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      navigate({ hash: section }, { replace: true });
    },
    [navigate],
  );

  useEffect(() => {
    if (!hashSection || !visibleSections.includes(hashSection)) {
      return;
    }

    const element = document.getElementById(hashSection);
    if (element) {
      window.requestAnimationFrame(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [hashSection, visibleSections]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    for (const section of visibleSections) {
      const element = document.getElementById(section);
      if (!element) {
        continue;
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setScrollSpySection(section);
          }
        },
        { rootMargin: '-30% 0px -55% 0px', threshold: 0.1 },
      );

      observer.observe(element);
      observers.push(observer);
    }

    return () => observers.forEach((observer) => observer.disconnect());
  }, [visibleSections, funnelQuery.data, cohortQuery.data, searchQuery.data]);

  const cohortRows = useMemo(() => {
    if (!cohortQuery.data) {
      return [];
    }

    return Object.entries(cohortQuery.data.cohorts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([cohortMonth, data]) => ({
        cohortMonth,
        customers: data.customers ?? {},
      }));
  }, [cohortQuery.data]);

  if (visibleSections.length === 0) {
    return (
      <div dir={dir}>
        <ErrorState message={t('admin.analytics.noAccess')} />
      </div>
    );
  }

  const initialLoading =
    (canViewFunnel && funnelQuery.isLoading && !funnelQuery.data) ||
    (canViewCohorts && cohortQuery.isLoading && !cohortQuery.data) ||
    (canViewSearch && searchQuery.isLoading && !searchQuery.data);

  if (initialLoading) {
    return <AdminPageSkeleton />;
  }

  const dateSeparator = dir === 'rtl' ? '←' : '→';
  let sectionIndex = 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8" dir={dir}>
      <header className="animate-in fade-in slide-in-from-bottom-3 space-y-3 duration-500">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex rounded-2xl bg-diyar-brown/10 p-3 text-diyar-brown ring-1 ring-diyar-brown/10">
              <BarChart3 size={24} aria-hidden />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-diyar-dark sm:text-3xl">
                {t('admin.analytics.title')}
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-500 sm:text-base">
                {t('admin.analytics.subtitle')}
              </p>
            </div>
          </div>
        </div>
      </header>

      <AdminAnalyticsSectionNav
        sections={visibleSections}
        activeSection={activeSection}
        onNavigate={scrollToSection}
      />

      <div className="space-y-6 lg:space-y-8">
        {canViewFunnel ? (
          <AdminAnalyticsSection
            id="funnel"
            index={sectionIndex++}
            icon={Filter}
            title={t('admin.analytics.sections.funnel.title')}
            subtitle={t('admin.analytics.sections.funnel.subtitle')}
            controls={
              <AnalyticsPeriodSelect
                label={t('admin.analytics.sections.funnel.period')}
                value={funnelPeriod}
                onChange={(value) => setFunnelPeriod(value as AnalyticsPeriodPreset)}
                options={PERIOD_OPTIONS.map((option) => ({
                  value: option,
                  label: t(`admin.analytics.sections.funnel.periods.${option}`),
                }))}
              />
            }
          >
            {funnelQuery.isError ? (
              <ErrorState
                message={t('admin.analytics.sections.funnel.loadError')}
                onRetry={() => void funnelQuery.refetch()}
              />
            ) : funnelQuery.isFetching && !funnelQuery.data ? (
              <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
            ) : funnelQuery.data && !funnelQuery.data.stages.some((stage) => stage.count > 0) ? (
              <AnalyticsEmptyState
                title={t('admin.analytics.sections.funnel.emptyTitle')}
                description={t('admin.analytics.sections.funnel.emptyDescription')}
              />
            ) : funnelQuery.data ? (
              <FunnelConversionPanel
                stages={funnelQuery.data.stages}
                periodFrom={funnelQuery.data.period.from}
                periodTo={funnelQuery.data.period.to}
                dateSeparator={dateSeparator}
              />
            ) : null}
          </AdminAnalyticsSection>
        ) : null}

        {canViewCohorts ? (
          <AdminAnalyticsSection
            id="cohorts"
            index={sectionIndex++}
            icon={Users}
            title={t('admin.analytics.sections.cohorts.title')}
            subtitle={t('admin.analytics.sections.cohorts.subtitle')}
            controls={
              <AnalyticsPeriodSelect
                label={t('admin.analytics.sections.cohorts.window')}
                value={cohortMonths}
                onChange={(value) => setCohortMonths(Number(value))}
                options={MONTH_OPTIONS.map((option) => ({
                  value: option,
                  label: t('admin.analytics.sections.cohorts.monthsOption', { count: option }),
                }))}
              />
            }
          >
            {cohortQuery.isError ? (
              <ErrorState
                message={t('admin.analytics.sections.cohorts.loadError')}
                onRetry={() => void cohortQuery.refetch()}
              />
            ) : cohortQuery.data ? (
              <div className="space-y-4">
                {resolveCohortNote(cohortQuery.data.note, t) ? (
                  <p className="animate-in fade-in rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-relaxed text-blue-800 duration-300">
                    {resolveCohortNote(cohortQuery.data.note, t)}
                  </p>
                ) : null}

                {cohortRows.length === 0 ? (
                  <AnalyticsEmptyState
                    title={t('admin.analytics.sections.cohorts.emptyTitle')}
                    description={t('admin.analytics.sections.cohorts.emptyDescription')}
                  />
                ) : (
                  <CohortRetentionPanel rows={cohortRows} monthCount={cohortQuery.data.months} />
                )}
              </div>
            ) : null}
          </AdminAnalyticsSection>
        ) : null}

        {canViewSearch ? (
          <AdminAnalyticsSection
            id="search"
            index={sectionIndex++}
            icon={Search}
            title={t('admin.analytics.sections.search.title')}
            subtitle={t('admin.analytics.sections.search.subtitle')}
            controls={
              <AnalyticsPeriodSelect
                label={t('admin.analytics.sections.search.period')}
                value={searchPeriod}
                onChange={(value) => setSearchPeriod(value as AnalyticsPeriodPreset)}
                options={PERIOD_OPTIONS.map((option) => ({
                  value: option,
                  label: t(`admin.analytics.sections.search.periods.${option}`),
                }))}
              />
            }
          >
            {searchQuery.isError ? (
              <ErrorState
                message={t('admin.analytics.sections.search.loadError')}
                onRetry={() => void searchQuery.refetch()}
              />
            ) : searchQuery.data ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    label={t('admin.analytics.sections.search.totalSearches')}
                    value={searchQuery.data.totals.searches}
                    icon={<Search size={20} />}
                  />
                  <MetricCard
                    label={t('admin.analytics.sections.search.zeroResults')}
                    value={searchQuery.data.totals.zero_result_searches}
                  />
                  <MetricCard
                    label={t('admin.analytics.sections.search.zeroResultRate')}
                    value={`${searchQuery.data.totals.zero_result_rate}%`}
                  />
                  <MetricCard
                    label={t('admin.analytics.sections.search.avgDuration')}
                    value={`${searchQuery.data.totals.avg_duration_ms} ms`}
                  />
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50/40 p-4 sm:p-5">
                  <h3 className="text-base font-bold text-diyar-dark">
                    {t('admin.analytics.sections.search.topQueries')}
                  </h3>
                  {searchQuery.data.top_queries.length === 0 ? (
                    <AnalyticsEmptyState
                      className="mt-4"
                      title={t('admin.analytics.sections.search.emptyTitle')}
                      description={t('admin.analytics.sections.search.emptyDescription')}
                    />
                  ) : (
                    <div
                      className="mt-4 overflow-x-auto rounded-xl border border-gray-100 bg-white"
                      dir={dir}
                    >
                      <table className="min-w-full text-sm" dir={dir}>
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50/80 text-gray-500">
                            <th className="px-4 py-3 text-start font-semibold">
                              {t('admin.analytics.sections.search.query')}
                            </th>
                            <th className="px-4 py-3 text-start font-semibold">
                              {t('admin.analytics.sections.search.searches')}
                            </th>
                            <th className="px-4 py-3 text-start font-semibold">
                              {t('admin.analytics.sections.search.avgResults')}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {searchQuery.data.top_queries.map((row, index) => (
                            <tr
                              key={row.query}
                              className="animate-in fade-in border-b border-gray-50 transition-colors hover:bg-gray-50/80 fill-mode-both duration-300 last:border-b-0"
                              style={{ animationDelay: `${index * 40}ms` }}
                            >
                              <td className="px-4 py-3 text-start font-medium text-diyar-dark">
                                {row.query}
                              </td>
                              <td className="px-4 py-3 text-start">
                                <TableLtrValue>{row.searches}</TableLtrValue>
                              </td>
                              <td className="px-4 py-3 text-start">
                                <TableLtrValue>{row.avg_results}</TableLtrValue>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </AdminAnalyticsSection>
        ) : null}
      </div>
    </div>
  );
}
