import { useMemo, useState } from 'react';
import { Calendar, DollarSign, Star, Wrench } from 'lucide-react';
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartContainer } from '../../components/common/ChartContainer.tsx';
import { ErrorState } from '../../components/common/ErrorState.tsx';
import { PageLoadingOverlay } from '../../components/common/PageLoadingOverlay.tsx';
import { MetricCard } from '../../components/dashboard/analytics/MetricCard.tsx';
import { AnalyticsEmptyState } from '../../components/dashboard/analytics/AnalyticsEmptyState.tsx';
import { PaginationBar } from '../../components/catalog/PaginationBar.tsx';
import { useLocale } from '../../hooks/useLocale.ts';
import {
  useProviderAnalyticsBookings,
  useProviderAnalyticsOverview,
  useProviderAnalyticsServices,
} from '../../hooks/provider/useProviderAnalytics.ts';
import type { AnalyticsPeriodPreset } from '../../api/vendorAnalytics.ts';
import { formatMoney } from '../../lib/formatMoney.ts';
import { Link } from 'react-router-dom';

const PERIOD_OPTIONS: AnalyticsPeriodPreset[] = ['7d', '30d', '90d', 'year'];

export default function ProviderAnalyticsPage() {
  const { t, locale, dir } = useLocale();
  const [period, setPeriod] = useState<AnalyticsPeriodPreset>('30d');
  const [servicesPage, setServicesPage] = useState(1);

  const overviewQuery = useProviderAnalyticsOverview(period);
  const bookingsQuery = useProviderAnalyticsBookings(period);
  const servicesQuery = useProviderAnalyticsServices(period, servicesPage);

  const chartData = useMemo(
    () =>
      (bookingsQuery.data?.series ?? []).map((point) => ({
        name: point.label,
        revenue: Number(point.revenue),
        bookings: point.bookings_created,
      })),
    [bookingsQuery.data?.series],
  );

  if (overviewQuery.isLoading) {
    return <PageLoadingOverlay />;
  }

  if (overviewQuery.isError || !overviewQuery.data) {
    return (
      <ErrorState
        message={t('providerDashboard.analytics.loadError')}
        onRetry={() => void overviewQuery.refetch()}
      />
    );
  }

  const overview = overviewQuery.data;
  const currency = overview.currency ?? t('providerDashboard.common.currency');
  const hasBookings = chartData.some((point) => point.revenue > 0 || point.bookings > 0);

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-diyar-dark">
            {t('providerDashboard.analytics.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{t('providerDashboard.analytics.subtitle')}</p>
        </div>
        <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-600">
          <span>{t('providerDashboard.analytics.period')}</span>
          <select
            value={period}
            onChange={(event) => {
              setPeriod(event.target.value as AnalyticsPeriodPreset);
              setServicesPage(1);
            }}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-diyar-dark focus:border-diyar-brown focus:outline-none"
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {t(`providerDashboard.analytics.periods.${option}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={t('providerDashboard.analytics.kpis.revenue')}
          value={overview.kpis.revenue}
          formatValue={(value) => formatMoney(value, locale, currency)}
          icon={<DollarSign size={20} />}
          iconClassName="bg-emerald-50 text-emerald-600"
        />
        <MetricCard
          label={t('providerDashboard.analytics.kpis.bookingsCreated')}
          value={overview.kpis.bookings_created}
          icon={<Calendar size={20} />}
          iconClassName="bg-blue-50 text-blue-600"
        />
        <MetricCard
          label={t('providerDashboard.analytics.kpis.bookingsCompleted')}
          value={overview.kpis.bookings_completed}
          icon={<Calendar size={20} />}
          iconClassName="bg-amber-50 text-amber-700"
        />
        <MetricCard
          label={t('providerDashboard.analytics.kpis.averageBookingValue')}
          value={overview.kpis.average_booking_value}
          formatValue={(value) => formatMoney(value, locale, currency)}
          icon={<DollarSign size={20} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={t('providerDashboard.analytics.kpis.bookingsConfirmed')}
          value={overview.kpis.bookings_confirmed}
        />
        <MetricCard
          label={t('providerDashboard.analytics.kpis.bookingsCancelled')}
          value={overview.kpis.bookings_cancelled}
        />
        <MetricCard
          label={t('providerDashboard.analytics.kpis.rating')}
          value={
            overview.kpis.rating != null
              ? `${overview.kpis.rating} (${overview.kpis.review_count})`
              : t('providerDashboard.analytics.noRating')
          }
          icon={<Star size={20} />}
          iconClassName="bg-yellow-50 text-yellow-600"
        />
        <MetricCard
          label={t('providerDashboard.analytics.kpis.activeServices')}
          value={overview.kpis.active_services}
          icon={<Wrench size={20} />}
        />
      </div>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-diyar-dark">
          {t('providerDashboard.analytics.bookingsChart')}
        </h2>
        {bookingsQuery.isError ? (
          <ErrorState
            className="mt-6"
            message={t('providerDashboard.analytics.loadError')}
            onRetry={() => void bookingsQuery.refetch()}
          />
        ) : bookingsQuery.isLoading ? (
          <div className="mt-6 h-72 animate-pulse rounded-xl bg-gray-100" />
        ) : hasBookings ? (
          <div className="mt-6 h-72 min-w-0" dir="ltr">
            <ChartContainer height={288}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === 'revenue' ? formatMoney(value, locale, currency) : value,
                    name === 'revenue'
                      ? t('providerDashboard.analytics.revenue')
                      : t('providerDashboard.analytics.bookings'),
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8B4513"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </div>
        ) : (
          <AnalyticsEmptyState
            className="mt-6"
            title={t('providerDashboard.analytics.empty.title')}
            description={t('providerDashboard.analytics.empty.description')}
            action={
              <Link
                to="/dashboard/service/services"
                className="inline-flex rounded-xl bg-diyar-brown px-4 py-2 text-sm font-bold text-white hover:bg-diyar-dark"
              >
                {t('providerDashboard.analytics.empty.action')}
              </Link>
            }
          />
        )}
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-diyar-dark">
          {t('providerDashboard.analytics.topServices')}
        </h2>
        {servicesQuery.isError ? (
          <ErrorState
            className="mt-4"
            message={t('providerDashboard.analytics.loadError')}
            onRetry={() => void servicesQuery.refetch()}
          />
        ) : servicesQuery.isLoading ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : (servicesQuery.data?.services.length ?? 0) === 0 ? (
          <AnalyticsEmptyState
            className="mt-4"
            title={t('providerDashboard.analytics.servicesEmpty.title')}
            description={t('providerDashboard.analytics.servicesEmpty.description')}
          />
        ) : (
          <>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500">
                    <th className="px-3 py-2 text-start font-semibold">
                      {t('providerDashboard.analytics.table.service')}
                    </th>
                    <th className="px-3 py-2 text-start font-semibold">
                      {t('providerDashboard.analytics.table.bookings')}
                    </th>
                    <th className="px-3 py-2 text-start font-semibold">
                      {t('providerDashboard.analytics.table.completed')}
                    </th>
                    <th className="px-3 py-2 text-start font-semibold">
                      {t('providerDashboard.analytics.table.revenue')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {servicesQuery.data?.services.map((service) => (
                    <tr key={service.service_id} className="border-b border-gray-50">
                      <td className="px-3 py-3 font-medium text-diyar-dark">
                        {service.service_title}
                      </td>
                      <td className="px-3 py-3 tabular-nums" dir="ltr">
                        {service.bookings_count}
                      </td>
                      <td className="px-3 py-3 tabular-nums" dir="ltr">
                        {service.completed_bookings}
                      </td>
                      <td className="px-3 py-3 tabular-nums" dir="ltr">
                        {formatMoney(service.revenue, locale, service.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {servicesQuery.data && servicesQuery.data.pagination.last_page > 1 ? (
              <PaginationBar
                className="mt-4"
                page={servicesQuery.data.pagination.current_page}
                pagination={{
                  current_page: servicesQuery.data.pagination.current_page,
                  last_page: servicesQuery.data.pagination.last_page,
                  per_page: servicesQuery.data.pagination.per_page,
                  total: servicesQuery.data.pagination.total,
                }}
                onPageChange={setServicesPage}
              />
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
