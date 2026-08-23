import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, CalendarCheck, Package, Store, Users, Wallet } from 'lucide-react';
import { fetchAdminDashboard } from '../api/adminDashboard.ts';
import { adminApi } from '../../api/client.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { useAdminAuth } from '../auth/AdminAuthContext.tsx';
import { localizedAuditAction, localizedAuditResource } from '../utils/localizedAudit.ts';
import type { ApiSuccessResponse } from '../../types/api.ts';
import { AdminPageSkeleton } from '../components/AdminPageSkeleton.tsx';
import { AdminTablePagination } from '../components/AdminTablePagination.tsx';
import { formatLocaleNumber } from '../../lib/intlLocale.ts';
import {
  buildOrdersChartData,
  formatPeriodSubtitle,
  resolveChartPeriod,
} from '../utils/ordersChartData.ts';

type ReportSummary = {
  period: { from: string; to: string };
  totals: Record<string, string | number>;
  orders_by_day: Array<{ day: string; count: number; revenue: string }>;
};

type AuditLogRow = {
  id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  created_at?: string;
};

type ChartPeriodDays = 7 | 30;

function MetricCard({
  label,
  value,
  icon,
  accent = 'bg-[#f7f4f1] text-diyar-brown',
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent?: string;
}) {
  const { locale } = useLocale();

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-extrabold text-diyar-dark tabular-nums">
            {typeof value === 'number' ? formatLocaleNumber(value, locale) : value}
          </p>
        </div>
        <div className={`rounded-xl p-2.5 ${accent}`}>{icon}</div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { t, locale } = useLocale();
  const { user } = useAdminAuth();
  const [activityPage, setActivityPage] = useState(1);
  const [chartPeriodDays, setChartPeriodDays] = useState<ChartPeriodDays>(7);
  const activityPerPage = 8;

  const chartPeriod = useMemo(() => resolveChartPeriod(chartPeriodDays), [chartPeriodDays]);

  const dashboardQuery = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: fetchAdminDashboard,
  });

  const reportsQuery = useQuery({
    queryKey: ['admin-reports-summary', chartPeriod.from, chartPeriod.to],
    queryFn: async () => {
      const response = await adminApi.get<ApiSuccessResponse<ReportSummary>>(
        '/admin/reports/summary',
        {
          params: {
            from: chartPeriod.from,
            to: chartPeriod.to,
          },
        },
      );
      return response.data.data;
    },
  });

  const activityQuery = useQuery({
    queryKey: ['admin', 'dashboard', 'activity', activityPage, activityPerPage],
    queryFn: async () => {
      const response = await adminApi.get<
        ApiSuccessResponse<{
          audit_logs: AuditLogRow[];
          meta: {
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
          };
        }>
      >('/admin/audit-logs', {
        params: { page: activityPage, per_page: activityPerPage },
      });
      return response.data.data;
    },
  });

  const metrics = dashboardQuery.data;
  const report = reportsQuery.data;
  const chartData = useMemo(
    () => (report ? buildOrdersChartData(report.orders_by_day ?? [], chartPeriod, locale) : []),
    [report, chartPeriod, locale],
  );
  const chartTitle =
    chartPeriod.mode === 'daily'
      ? t('admin.reports.ordersLast7Days')
      : t('admin.reports.ordersByWeek');
  const periodSubtitle = formatPeriodSubtitle(chartPeriod, locale);
  const maxOrders = useMemo(
    () => chartData.reduce((max, row) => Math.max(max, row.orders), 0),
    [chartData],
  );
  const yMax = Math.max(5, Math.ceil(maxOrders * 1.2));

  if (dashboardQuery.isLoading) {
    return <AdminPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-diyar-dark/10 bg-linear-to-br from-diyar-dark via-[#2a4f4b] to-diyar-brown p-6 text-white shadow-lg md:p-8">
        <p className="text-sm font-semibold text-diyar-cream/80">
          {t('admin.dashboard.welcomeLabel')}
        </p>
        <h2 className="mt-1 text-2xl font-extrabold md:text-3xl">
          {t('admin.dashboard.welcome', { name: user?.name ?? '' })}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75">
          {t('admin.dashboard.intro')}
        </p>
      </section>

      {dashboardQuery.isError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {t('admin.dashboard.loadError')}
        </div>
      )}

      {metrics && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label={t('admin.dashboard.metrics.ordersToday')}
              value={metrics.orders_today}
              icon={<Package size={20} />}
            />
            <MetricCard
              label={t('admin.dashboard.metrics.activeUsers')}
              value={metrics.active_users}
              icon={<Users size={20} />}
            />
            <MetricCard
              label={t('admin.dashboard.metrics.vendors')}
              value={metrics.vendors}
              icon={<Store size={20} />}
            />
            <MetricCard
              label={t('admin.dashboard.metrics.providers')}
              value={metrics.providers}
              icon={<Store size={20} />}
            />
            <MetricCard
              label={t('admin.dashboard.metrics.pendingVendorPayouts')}
              value={metrics.pending_vendor_payouts}
              icon={<Wallet size={20} />}
              accent="bg-amber-50 text-amber-700"
            />
            <MetricCard
              label={t('admin.dashboard.metrics.pendingAffiliatePayouts')}
              value={metrics.pending_affiliate_payouts}
              icon={<Wallet size={20} />}
              accent="bg-amber-50 text-amber-700"
            />
            <MetricCard
              label={t('admin.dashboard.metrics.openServiceRequests')}
              value={metrics.service_requests_open}
              icon={<Activity size={20} />}
            />
            <MetricCard
              label={t('admin.dashboard.metrics.activeBookings')}
              value={metrics.bookings_active}
              icon={<CalendarCheck size={20} />}
            />
          </div>

          {report && (
            <div className="grid gap-4 xl:grid-cols-3">
              <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm xl:col-span-2">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-diyar-dark">{chartTitle}</h3>
                    <p className="text-xs text-gray-500">{periodSubtitle}</p>
                  </div>
                  <div className="flex rounded-xl border border-gray-200 bg-[#f7f4f1]/50 p-1">
                    {([7, 30] as const).map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setChartPeriodDays(days)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                          chartPeriodDays === days
                            ? 'bg-white text-diyar-dark shadow-sm'
                            : 'text-gray-500 hover:text-diyar-dark'
                        }`}
                      >
                        {days === 7
                          ? t('admin.reports.period7Days')
                          : t('admin.reports.period30Days')}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-72 w-full min-w-0" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                      <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 4" />
                      <XAxis
                        dataKey="label"
                        interval={0}
                        axisLine={{ stroke: '#9ca3af' }}
                        tickLine={{ stroke: '#9ca3af' }}
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        angle={chartPeriod.mode === 'weekly' ? -18 : 0}
                        textAnchor={chartPeriod.mode === 'weekly' ? 'end' : 'middle'}
                        height={chartPeriod.mode === 'weekly' ? 52 : 32}
                      />
                      <YAxis
                        allowDecimals={false}
                        domain={[0, yMax]}
                        tickCount={6}
                        axisLine={{ stroke: '#9ca3af' }}
                        tickLine={{ stroke: '#9ca3af' }}
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        width={36}
                      />
                      <Tooltip
                        formatter={(value: number) => [
                          formatLocaleNumber(value, locale),
                          t('admin.reports.ordersSeries'),
                        ]}
                        labelFormatter={(_, items) => {
                          const row = items?.[0]?.payload as { tooltipLabel?: string } | undefined;
                          return row?.tooltipLabel ?? '';
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="orders"
                        stroke="#1f3d3a"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#947961', stroke: '#1f3d3a', strokeWidth: 1 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-diyar-dark">
                  {t('admin.reports.summaryTitle')}
                </h3>
                <dl className="mt-4 space-y-3">
                  {[
                    { label: t('admin.reports.orderRevenue'), value: report.totals.order_revenue },
                    {
                      label: t('admin.reports.paymentVolume'),
                      value: report.totals.payment_volume,
                    },
                    {
                      label: t('admin.reports.ordersInPeriod'),
                      value: report.totals.orders,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between gap-3 rounded-xl bg-[#f7f4f1]/70 px-4 py-3"
                    >
                      <dt className="text-sm text-gray-600">{item.label}</dt>
                      <dd className="text-sm font-bold text-diyar-dark tabular-nums">
                        {String(item.value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            </div>
          )}

          <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-diyar-dark">
              {t('admin.dashboard.recentActivity')}
            </h3>
            {activityQuery.isLoading ? (
              <p className="mt-3 text-sm text-gray-500">{t('admin.dashboard.activityLoading')}</p>
            ) : activityQuery.isError ? (
              <p className="mt-3 text-sm text-red-600">{t('admin.dashboard.activityError')}</p>
            ) : (activityQuery.data?.audit_logs.length ?? 0) === 0 ? (
              <p className="mt-3 text-sm text-gray-500">{t('admin.dashboard.noRecentActivity')}</p>
            ) : (
              <>
                <ul className="mt-4 space-y-3">
                  {activityQuery.data?.audit_logs.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#f7f4f1] px-4 py-3 text-sm"
                    >
                      <span className="font-semibold text-diyar-dark">
                        {localizedAuditAction(entry.action, t)}
                      </span>
                      <span className="text-gray-500">
                        {localizedAuditResource(entry.resource_type ?? '', t)}
                        {entry.resource_id ? ` · ${entry.resource_id.slice(0, 8)}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
                <AdminTablePagination
                  meta={activityQuery.data?.meta}
                  page={activityPage}
                  onPageChange={setActivityPage}
                  isLoading={activityQuery.isFetching}
                />
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
