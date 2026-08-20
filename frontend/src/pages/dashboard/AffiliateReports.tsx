import React, { useMemo, useState } from 'react';
import {
  Download,
  TrendingUp,
  Users,
  MousePointerClick,
  ShoppingBag,
  Search,
  Filter,
  Loader2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { PaginationBar } from '../../components/catalog/PaginationBar.tsx';
import { PageLoadingOverlay } from '../../components/common/PageLoadingOverlay.tsx';
import { ErrorState } from '../../components/common/ErrorState.tsx';
import { TableSkeleton } from '../../components/common/TableSkeleton.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { useAffiliateReports } from '../../hooks/affiliate/useAffiliate.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { usePaginationState } from '../../hooks/usePaginationState.ts';
import { resolveMediaUrl } from '../../lib/media.ts';
import type { AffiliateReportLinkRow, AffiliateReportPeriod } from '../../types/affiliate.ts';

const FALLBACK_IMAGE = '/placeholder-product.png';

const PERIOD_OPTIONS: AffiliateReportPeriod[] = ['day', 'week', 'month', '3m', '6m', '12m', 'year'];

type LinkFilter = 'all' | 'active';

function escapeCsvCell(value: string | number): string {
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export default function AffiliateReports() {
  const { t, locale, dir } = useLocale();
  const [period, setPeriod] = useState<AffiliateReportPeriod>('month');
  const [search, setSearch] = useState('');
  const [linkFilter, setLinkFilter] = useState<LinkFilter>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { page, perPage, perPageOptions, onPageChange, onPerPageChange, resetPage } =
    usePaginationState({ initialPerPage: 10 });

  const reportsQuery = useAffiliateReports(period);

  const summary = reportsQuery.data?.summary;
  const daily = reportsQuery.data?.daily ?? [];
  const byLink = reportsQuery.data?.by_link ?? [];

  const displaySummary = summary ?? {
    clicks: daily.reduce((sum, row) => sum + row.clicks, 0),
    conversions: daily.reduce((sum, row) => sum + row.conversions, 0),
    conversion_rate: '0.00',
    earnings: daily.reduce((sum, row) => sum + Number(row.earnings), 0).toFixed(2),
    pending_commissions: '0.00',
    available_commissions: '0.00',
    paid_commissions: '0.00',
    reversed_commissions: '0.00',
  };

  const cvr =
    displaySummary.conversion_rate !== '0.00'
      ? `${displaySummary.conversion_rate}%`
      : displaySummary.clicks > 0
        ? `${Math.round((displaySummary.conversions / displaySummary.clicks) * 100)}%`
        : '0%';

  const clicksLabel = t('affiliate.reports.chartClicks');
  const conversionsLabel = t('affiliate.reports.chartConversions');
  const noDataLabel = t('affiliate.common.noData');

  const areaData = useMemo(
    () =>
      daily.map((row) => ({
        name: row.date,
        [clicksLabel]: row.clicks,
        [conversionsLabel]: row.conversions,
      })),
    [daily, clicksLabel, conversionsLabel],
  );

  const topLinks = useMemo(
    () => [...byLink].sort((a, b) => b.clicks - a.clicks).slice(0, 5),
    [byLink],
  );

  const filteredLinks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return byLink.filter((row) => {
      if (linkFilter === 'active' && !row.is_active) {
        return false;
      }

      if (!query) {
        return true;
      }

      const productName = row.product?.name?.toLowerCase() ?? '';
      return row.name.toLowerCase().includes(query) || productName.includes(query);
    });
  }, [byLink, search, linkFilter]);

  const paginatedLinks = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredLinks.slice(start, start + perPage);
  }, [filteredLinks, page, perPage]);

  const pagination = useMemo(
    () => ({
      current_page: page,
      last_page: Math.max(1, Math.ceil(filteredLinks.length / perPage)),
      per_page: perPage,
      total: filteredLinks.length,
    }),
    [filteredLinks.length, page, perPage],
  );

  const periodLabel = (value: AffiliateReportPeriod) => {
    const map: Record<AffiliateReportPeriod, string> = {
      day: t('affiliate.reports.periodDay'),
      week: t('affiliate.reports.periodWeek'),
      month: t('affiliate.reports.periodMonth'),
      '3m': t('affiliate.reports.period3m'),
      '6m': t('affiliate.reports.period6m'),
      '12m': t('affiliate.reports.period12m'),
      year: t('affiliate.reports.periodYear'),
    };
    return map[value];
  };

  const linkFilterLabel = (value: LinkFilter) =>
    value === 'active' ? t('affiliate.reports.filterActive') : t('affiliate.reports.filterAll');

  const handlePeriodChange = (next: AffiliateReportPeriod) => {
    setPeriod(next);
    resetPage();
  };

  const handleFilterChange = (next: LinkFilter) => {
    setLinkFilter(next);
    resetPage();
    setFiltersOpen(false);
  };

  const handleExport = async () => {
    setExporting(true);

    try {
      const headers = [
        t('affiliate.reports.tableLink'),
        t('affiliate.reports.tableProduct'),
        t('affiliate.reports.tableClicks'),
        t('affiliate.reports.tableConversions'),
        t('affiliate.reports.tableEarnings'),
        t('affiliate.reports.tableStatus'),
      ];

      const rows = filteredLinks.map((row) =>
        [
          row.name,
          row.product?.name ?? noDataLabel,
          row.clicks,
          row.conversions,
          row.earnings,
          row.is_active
            ? t('affiliate.reports.statusActive')
            : t('affiliate.reports.statusInactive'),
        ]
          .map(escapeCsvCell)
          .join(','),
      );

      const summaryRows = [
        '',
        t('affiliate.reports.totalClicks'),
        displaySummary.clicks,
        '',
        '',
        '',
        '',
        t('affiliate.reports.totalConversions'),
        displaySummary.conversions,
        '',
        '',
        '',
        t('affiliate.reports.conversionRate'),
        cvr,
        '',
        '',
        '',
        t('affiliate.reports.availableCommissions'),
        displaySummary.available_commissions,
      ].map(escapeCsvCell);

      const csv = `\uFEFF${headers.map(escapeCsvCell).join(',')}\n${rows.join('\n')}\n\n${summaryRows.join(',')}`;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `affiliate-report-${period}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  if (reportsQuery.isLoading) {
    return <PageLoadingOverlay />;
  }

  if (reportsQuery.isError || !reportsQuery.data) {
    return (
      <ErrorState
        message={t('affiliate.reports.loadError')}
        onRetry={() => void reportsQuery.refetch()}
      />
    );
  }

  return (
    <div className="relative space-y-6 animate-in fade-in duration-300">
      {(reportsQuery.isFetching || exporting) && <PageLoadingOverlay />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-diyar-dark">{t('affiliate.reports.title')}</h2>
          <p className="text-gray-500 text-sm mt-1">{t('affiliate.reports.subtitle')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm overflow-x-auto scrollbar-hide">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handlePeriodChange(option)}
                className={`px-3 sm:px-4 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer whitespace-nowrap ${
                  period === option
                    ? 'bg-gray-100 text-diyar-dark font-bold'
                    : 'text-gray-500 hover:text-diyar-dark'
                }`}
              >
                {periodLabel(option)}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={exporting}
            className="border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition shadow-sm bg-white cursor-pointer disabled:opacity-60"
          >
            {exporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            {exporting ? t('affiliate.reports.exporting') : t('affiliate.reports.exportReport')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <MousePointerClick size={20} />
          </div>
          <div className="text-2xl font-bold text-diyar-dark mb-1">
            {displaySummary.clicks.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}
          </div>
          <div className="text-sm font-medium text-gray-500">
            {t('affiliate.reports.totalClicks')}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-4">
            <ShoppingBag size={20} />
          </div>
          <div className="text-2xl font-bold text-diyar-dark mb-1">
            {displaySummary.conversions.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}
          </div>
          <div className="text-sm font-medium text-gray-500">
            {t('affiliate.reports.totalConversions')}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
            <TrendingUp size={20} />
          </div>
          <div className="text-2xl font-bold text-diyar-dark mb-1" dir="ltr">
            {cvr}
          </div>
          <div className="text-sm font-medium text-gray-500">
            {t('affiliate.reports.conversionRate')}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <Users size={20} />
          </div>
          <div className="text-2xl font-bold text-diyar-dark mb-1" dir="ltr">
            {displaySummary.available_commissions}
          </div>
          <div className="text-sm font-medium text-gray-500">
            {t('affiliate.reports.availableCommissions')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2">
          <h3 className="font-bold text-diyar-dark mb-6">
            {t('affiliate.reports.clicksAndConversions')}
          </h3>
          <div className="h-72 w-full min-w-0" dir="ltr">
            {areaData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">
                {t('affiliate.reports.emptyChart')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={288}>
                <AreaChart data={areaData}>
                  <defs>
                    <linearGradient id="affiliateColorClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '16px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey={clicksLabel}
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#affiliateColorClicks)"
                  />
                  <Line
                    type="monotone"
                    dataKey={conversionsLabel}
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-diyar-dark mb-4">{t('affiliate.reports.topLinks')}</h3>
          <div className="space-y-3 min-h-72">
            {topLinks.length === 0 ? (
              <div className="h-full min-h-60 flex items-center justify-center text-sm text-gray-400">
                {noDataLabel}
              </div>
            ) : (
              topLinks.map((row, index) => (
                <div
                  key={row.link_id}
                  className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-full bg-white text-diyar-brown font-bold text-sm flex items-center justify-center shadow-sm shrink-0">
                      {index + 1}
                    </span>
                    <div className="w-9 h-9 rounded-lg bg-white overflow-hidden shrink-0 shadow-sm">
                      <img
                        src={resolveMediaUrl(row.product?.image_url) ?? FALLBACK_IMAGE}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-diyar-dark truncate">{row.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {row.product?.name ?? noDataLabel}
                      </p>
                    </div>
                  </div>
                  <div className="text-end shrink-0">
                    <p className="text-sm font-bold text-diyar-dark tabular-nums">
                      {row.clicks.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                    </p>
                    <p className="text-xs text-gray-500">{t('affiliate.reports.chartClicks')}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-bold text-diyar-dark">{t('affiliate.reports.tableTitle')}</h3>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <Search
                size={16}
                className="absolute top-1/2 -translate-y-1/2 inset-s-3 text-gray-400 pointer-events-none"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  resetPage();
                }}
                placeholder={t('affiliate.reports.searchPlaceholder')}
                className="w-full sm:w-64 ps-9 pe-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown"
              />
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setFiltersOpen((open) => !open)}
                className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition cursor-pointer w-full sm:w-auto justify-center"
              >
                <Filter size={16} />
                {linkFilterLabel(linkFilter)}
              </button>
              {filtersOpen ? (
                <div className="absolute top-full mt-2 min-w-45 rounded-xl border border-gray-100 bg-white shadow-lg z-20 p-2 inset-e-0">
                  {(['all', 'active'] as LinkFilter[]).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => handleFilterChange(filter)}
                      className={`w-full text-start px-3 py-2 rounded-lg text-sm font-bold cursor-pointer ${
                        linkFilter === filter
                          ? 'bg-diyar-dark text-white'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {linkFilterLabel(filter)}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {reportsQuery.isFetching && !reportsQuery.isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={5} columns={5} />
          </div>
        ) : paginatedLinks.length === 0 ? (
          <div className="p-8">
            <EmptyState title={t('affiliate.reports.emptyLinks')} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" dir={dir}>
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-100 text-xs font-bold">
                <tr>
                  <th className="px-6 py-4 text-start">{t('affiliate.reports.tableLink')}</th>
                  <th className="px-6 py-4 text-start">{t('affiliate.reports.tableProduct')}</th>
                  <th className="px-6 py-4 text-start">{t('affiliate.reports.tableClicks')}</th>
                  <th className="px-6 py-4 text-start">
                    {t('affiliate.reports.tableConversions')}
                  </th>
                  <th className="px-6 py-4 text-start">{t('affiliate.reports.tableEarnings')}</th>
                  <th className="px-6 py-4 text-start">{t('affiliate.reports.tableStatus')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedLinks.map((row) => (
                  <tr key={row.link_id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4 font-bold text-gray-700">{row.name}</td>
                    <td className="px-6 py-4 text-gray-600">{row.product?.name ?? noDataLabel}</td>
                    <td className="px-6 py-4 text-gray-700 tabular-nums">
                      {row.clicks.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                    </td>
                    <td className="px-6 py-4 text-gray-700 tabular-nums">
                      {row.conversions.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                    </td>
                    <td className="px-6 py-4 font-bold text-diyar-dark tabular-nums" dir="ltr">
                      {row.earnings}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                          row.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {row.is_active
                          ? t('affiliate.reports.statusActive')
                          : t('affiliate.reports.statusInactive')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredLinks.length > 0 ? (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <PaginationBar
              pagination={pagination}
              page={page}
              perPage={perPage}
              perPageOptions={[...perPageOptions]}
              onPageChange={onPageChange}
              onPerPageChange={(next) => {
                onPerPageChange(next);
                resetPage();
              }}
              alwaysShow={filteredLinks.length > 0}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
