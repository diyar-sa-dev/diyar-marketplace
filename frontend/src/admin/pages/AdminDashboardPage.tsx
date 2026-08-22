import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  CartesianGrid,
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

type ReportSummary = {
  period: { from: string; to: string };
  totals: Record<string, string | number>;
  orders_by_day: Array<{ day: string; count: number; revenue: string }>;
};

function buildOrdersChartData(
  rows: Array<{ day: string; count: number; revenue: string }>,
  period: { from: string; to: string },
): Array<{ day: string; orders: number; revenue: number }> {
  if (rows.length > 0) {
    return rows.map((row) => ({
      day: row.day.slice(5),
      orders: row.count,
      revenue: Number.parseFloat(row.revenue) || 0,
    }));
  }

  const start = new Date(`${period.from}T00:00:00`);
  const end = new Date(`${period.to}T00:00:00`);
  const points: Array<{ day: string; orders: number; revenue: number }> = [];

  if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start <= end) {
    const cursor = new Date(start);
    while (cursor <= end) {
      const month = String(cursor.getMonth() + 1).padStart(2, '0');
      const date = String(cursor.getDate()).padStart(2, '0');
      points.push({ day: `${month}-${date}`, orders: 0, revenue: 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  if (points.length === 0) {
    const today = new Date();
    for (let offset = 6; offset >= 0; offset -= 1) {
      const day = new Date(today);
      day.setDate(today.getDate() - offset);
      const month = String(day.getMonth() + 1).padStart(2, '0');
      const date = String(day.getDate()).padStart(2, '0');
      points.push({ day: `${month}-${date}`, orders: 0, revenue: 0 });
    }
  }

  return points;
}

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
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-extrabold text-diyar-dark tabular-nums">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
        <div className={`rounded-xl p-2.5 ${accent}`}>{icon}</div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { t } = useLocale();
  const { user } = useAdminAuth();

  const dashboardQuery = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: fetchAdminDashboard,
  });

  const reportsQuery = useQuery({
    queryKey: ['admin-reports-summary'],
    queryFn: async () => {
      const response =
        await adminApi.get<ApiSuccessResponse<ReportSummary>>('/admin/reports/summary');
      return response.data.data;
    },
  });

  const metrics = dashboardQuery.data;
  const report = reportsQuery.data;
  const chartData = report ? buildOrdersChartData(report.orders_by_day ?? [], report.period) : [];

  if (dashboardQuery.isLoading) {
    return <AdminPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-[#1f3d3a]/10 bg-gradient-to-br from-[#1f3d3a] via-[#2a4f4b] to-[#947961] p-6 text-white shadow-lg md:p-8">
        <p className="text-sm font-semibold text-[#f3ecdb]/80">
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
                <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-diyar-dark">
                      {t('admin.reports.ordersByDay')}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {report.period.from} → {report.period.to}
                    </p>
                  </div>
                </div>
                <div className="h-64 w-full min-w-0" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="ordersFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#947961" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#947961" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0ebe4" />
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                      />
                      <YAxis
                        allowDecimals={false}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                        domain={[0, 'auto']}
                      />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="orders"
                        stroke="#1f3d3a"
                        fill="url(#ordersFill)"
                        strokeWidth={2}
                      />
                    </AreaChart>
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
                      label: t('admin.dashboard.metrics.ordersToday'),
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
            {metrics.recent_activity.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">{t('admin.dashboard.noRecentActivity')}</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {metrics.recent_activity.map((entry, index) => (
                  <li
                    key={`${entry.action}-${entry.created_at}-${index}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#f7f4f1] px-4 py-3 text-sm"
                  >
                    <span className="font-semibold text-diyar-dark">
                      {localizedAuditAction(entry.action, t)}
                    </span>
                    <span className="text-gray-500">
                      {localizedAuditResource(entry.resource_type, t)}
                      {entry.resource_id ? ` · ${entry.resource_id.slice(0, 8)}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
