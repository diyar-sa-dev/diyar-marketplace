import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, DollarSign, Wrench, Clock, ChevronRight } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ErrorState } from '../../components/common/ErrorState.tsx';
import { LoadingState } from '../../components/common/LoadingState.tsx';
import { AnalyticsEmptyState } from '../../components/dashboard/analytics/AnalyticsEmptyState.tsx';
import {
  useProviderBookings,
  useProviderFinanceAnalytics,
  useProviderFinanceSummary,
  useProviderOwnServices,
} from '../../hooks/provider/useProviderDashboard.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import {
  buildProviderDashboardStats,
  formatBookingDisplayDate,
  formatBookingDisplayTime,
  formatFinanceAnalyticsLabel,
  formatProviderMoney,
  formatWesternNumber,
  mapProviderBookingUiStatus,
} from '../../lib/providerDashboardUi.ts';

export default function ServiceDashboard() {
  const { t, dir, locale } = useLocale();
  const {
    data: bookingsData,
    isLoading: bookingsLoading,
    isError: bookingsError,
    error: bookingsErr,
    refetch: refetchBookings,
  } = useProviderBookings({ page: 1, per_page: 50 }, { refetchOnMount: 'always' });
  const { data: servicesData, isLoading: servicesLoading } = useProviderOwnServices(1, 50);
  const { data: financeSummary, isLoading: financeLoading } = useProviderFinanceSummary();
  const { data: financeAnalytics, isLoading: analyticsLoading } = useProviderFinanceAnalytics();

  const bookings = bookingsData?.items ?? [];
  const activeServicesCount =
    servicesData?.items.filter((service) => service.is_active !== false).length ?? 0;

  const stats = useMemo(() => {
    const base = buildProviderDashboardStats(bookings, locale);
    const chartData =
      financeAnalytics && financeAnalytics.length > 0
        ? financeAnalytics.map((point) => ({
            name: formatFinanceAnalyticsLabel(point, locale),
            earnings: point.net,
          }))
        : [];

    return {
      ...base,
      monthlyEarnings: financeSummary?.monthly_gross_earnings ?? base.monthlyEarnings,
      chartData,
      activeServices: activeServicesCount,
    };
  }, [bookings, activeServicesCount, locale, financeSummary, financeAnalytics]);

  if (bookingsLoading || servicesLoading || financeLoading || analyticsLoading) {
    return <LoadingState className="min-h-96" />;
  }

  if (bookingsError) {
    return (
      <ErrorState
        message={t('providerDashboard.home.loadError')}
        error={bookingsErr as Error}
        onRetry={() => void refetchBookings()}
      />
    );
  }

  return (
    <div className="space-y-6" dir={dir}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">
              {t('providerDashboard.home.monthlyEarnings')}
            </h3>
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-diyar-dark" dir="ltr">
              {formatProviderMoney(stats.monthlyEarnings, locale)}
            </span>
            <span className="text-sm font-bold text-diyar-dark mb-1">
              {t('providerDashboard.common.currency')}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">
              {t('providerDashboard.home.activeBookings')}
            </h3>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Calendar size={20} />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-diyar-dark">{stats.activeBookings}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">
              {t('providerDashboard.home.activeServices')}
            </h3>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Wrench size={20} />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-diyar-dark">{stats.activeServices}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">
              {t('providerDashboard.home.openRequests')}
            </h3>
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
              <Clock size={20} />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-diyar-dark">
              {bookings.filter((b) => mapProviderBookingUiStatus(b) === 'pending').length}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-diyar-dark mb-6">
            {t('providerDashboard.home.earningsChart')}
          </h3>
          {stats.chartData.length === 0 ? (
            <AnalyticsEmptyState
              title={t('providerDashboard.home.chartEmptyTitle')}
              description={t('providerDashboard.home.chartEmptyDescription')}
            />
          ) : (
            <div className="h-72 w-full min-w-0" dir="ltr">
              <ResponsiveContainer width="100%" height={288}>
                <AreaChart data={stats.chartData}>
                  <defs>
                    <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af' }}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '16px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value: number) => [
                      `${formatWesternNumber(value)} ${t('providerDashboard.common.currency')}`,
                      t('providerDashboard.home.earningsLabel'),
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="earnings"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorEarnings)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-diyar-dark">
              {t('providerDashboard.home.todaysAppointments')}
            </h3>
            <Link
              to="/dashboard/service/bookings"
              className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition flex items-center gap-1 cursor-pointer"
            >
              {t('providerDashboard.common.viewAll')}
              <ChevronRight size={14} className={dir === 'rtl' ? 'rotate-180' : ''} />
            </Link>
          </div>

          <div className="space-y-4">
            {stats.todaysAppointments.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">
                {t('providerDashboard.home.noAppointmentsToday')}
              </p>
            ) : (
              stats.todaysAppointments.map((booking) => (
                <div key={booking.id} className="border-s-2 border-blue-400 ps-4 py-2">
                  <p className="text-sm text-gray-500 mb-1" dir="ltr">
                    {formatBookingDisplayTime(booking)} — {formatBookingDisplayDate(booking)}
                  </p>
                  <h4 className="font-bold text-diyar-dark">
                    {booking.service_title ??
                      booking.service_request?.title ??
                      t('providerDashboard.common.service')}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">
                    {t('providerDashboard.home.customerLabel', {
                      name: booking.customer?.name ?? t('providerDashboard.common.client'),
                    })}
                    {booking.location ? ` (${booking.location})` : ''}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
