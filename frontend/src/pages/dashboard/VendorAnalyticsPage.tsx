import { useMemo, useState } from 'react';
import { DollarSign, Package, ShoppingCart, TrendingUp } from 'lucide-react';
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartContainer } from '../../components/common/ChartContainer.tsx';
import { ErrorState } from '../../components/common/ErrorState.tsx';
import { PageLoadingOverlay } from '../../components/common/PageLoadingOverlay.tsx';
import { MetricCard } from '../../components/dashboard/analytics/MetricCard.tsx';
import { AnalyticsEmptyState } from '../../components/dashboard/analytics/AnalyticsEmptyState.tsx';
import { PaginationBar } from '../../components/catalog/PaginationBar.tsx';
import { useLocale } from '../../hooks/useLocale.ts';
import {
  useVendorAnalyticsOverview,
  useVendorAnalyticsProducts,
  useVendorAnalyticsSales,
} from '../../hooks/vendor/useVendorAnalytics.ts';
import type { AnalyticsPeriodPreset } from '../../api/vendorAnalytics.ts';
import { formatMoney } from '../../lib/formatMoney.ts';
import { Link } from 'react-router-dom';

const PERIOD_OPTIONS: AnalyticsPeriodPreset[] = ['7d', '30d', '90d', 'year'];

export default function VendorAnalyticsPage() {
  const { t, locale, dir } = useLocale();
  const [period, setPeriod] = useState<AnalyticsPeriodPreset>('30d');
  const [productsPage, setProductsPage] = useState(1);

  const overviewQuery = useVendorAnalyticsOverview(period);
  const salesQuery = useVendorAnalyticsSales(period);
  const productsQuery = useVendorAnalyticsProducts(period, productsPage);

  const chartData = useMemo(
    () =>
      (salesQuery.data?.series ?? []).map((point) => ({
        name: point.label,
        revenue: Number(point.revenue),
        orders: point.orders,
      })),
    [salesQuery.data?.series],
  );

  if (overviewQuery.isLoading) {
    return <PageLoadingOverlay />;
  }

  if (overviewQuery.isError || !overviewQuery.data) {
    return (
      <ErrorState
        message={t('vendor.analytics.loadError')}
        onRetry={() => void overviewQuery.refetch()}
      />
    );
  }

  const overview = overviewQuery.data;
  const currency = overview.currency ?? t('common.currency');

  const hasSales = chartData.some((point) => point.revenue > 0 || point.orders > 0);

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-diyar-dark">{t('vendor.analytics.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('vendor.analytics.subtitle')}</p>
        </div>
        <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-600">
          <span>{t('vendor.analytics.period')}</span>
          <select
            value={period}
            onChange={(event) => {
              setPeriod(event.target.value as AnalyticsPeriodPreset);
              setProductsPage(1);
            }}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-diyar-dark focus:border-diyar-brown focus:outline-none"
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {t(`vendor.analytics.periods.${option}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={t('vendor.analytics.kpis.grossSales')}
          value={overview.kpis.gross_sales}
          formatValue={(value) => formatMoney(value, locale, currency)}
          icon={<DollarSign size={20} />}
          iconClassName="bg-amber-50 text-amber-700"
        />
        <MetricCard
          label={t('vendor.analytics.kpis.netSales')}
          value={overview.kpis.net_sales}
          formatValue={(value) => formatMoney(value, locale, currency)}
          icon={<DollarSign size={20} />}
          iconClassName="bg-emerald-50 text-emerald-600"
        />
        <MetricCard
          label={t('vendor.analytics.kpis.orders')}
          value={overview.kpis.orders}
          icon={<ShoppingCart size={20} />}
          iconClassName="bg-blue-50 text-blue-600"
        />
        <MetricCard
          label={t('vendor.analytics.kpis.aov')}
          value={overview.kpis.average_order_value}
          formatValue={(value) => formatMoney(value, locale, currency)}
          icon={<TrendingUp size={20} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label={t('vendor.analytics.kpis.itemsSold')}
          value={overview.kpis.items_sold}
          icon={<Package size={20} />}
        />
        <MetricCard
          label={t('vendor.analytics.kpis.refunds')}
          value={overview.kpis.refund_amount}
          formatValue={(value) => formatMoney(value, locale, currency)}
        />
        <MetricCard
          label={t('vendor.analytics.kpis.discounts')}
          value={overview.kpis.discount_amount}
          formatValue={(value) => formatMoney(value, locale, currency)}
        />
        <MetricCard
          label={t('vendor.analytics.kpis.couponUsage')}
          value={overview.kpis.coupon_usage}
        />
        <MetricCard
          label={t('vendor.analytics.kpis.paymentSuccessRate')}
          value={overview.kpis.payment_success_rate}
          formatValue={(value) => `${value}%`}
        />
      </div>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-diyar-dark">{t('vendor.analytics.salesChart')}</h2>
        {salesQuery.isError ? (
          <ErrorState
            className="mt-6"
            message={t('vendor.analytics.loadError')}
            onRetry={() => void salesQuery.refetch()}
          />
        ) : salesQuery.isLoading ? (
          <div className="mt-6 h-72 animate-pulse rounded-xl bg-gray-100" />
        ) : hasSales ? (
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
                      ? t('vendor.analytics.revenue')
                      : t('vendor.analytics.orders'),
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
            title={t('vendor.analytics.empty.title')}
            description={t('vendor.analytics.empty.description')}
            action={
              <Link
                to="/dashboard/vendor/products"
                className="inline-flex rounded-xl bg-diyar-brown px-4 py-2 text-sm font-bold text-white hover:bg-diyar-dark"
              >
                {t('vendor.analytics.empty.action')}
              </Link>
            }
          />
        )}
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-diyar-dark">{t('vendor.analytics.topProducts')}</h2>
        {productsQuery.isError ? (
          <ErrorState
            className="mt-4"
            message={t('vendor.analytics.loadError')}
            onRetry={() => void productsQuery.refetch()}
          />
        ) : productsQuery.isLoading ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : (productsQuery.data?.products.length ?? 0) === 0 ? (
          <AnalyticsEmptyState
            className="mt-4"
            title={t('vendor.analytics.productsEmpty.title')}
            description={t('vendor.analytics.productsEmpty.description')}
          />
        ) : (
          <>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500">
                    <th className="px-3 py-2 text-start font-semibold">
                      {t('vendor.analytics.table.product')}
                    </th>
                    <th className="px-3 py-2 text-start font-semibold">
                      {t('vendor.analytics.table.units')}
                    </th>
                    <th className="px-3 py-2 text-start font-semibold">
                      {t('vendor.analytics.table.orders')}
                    </th>
                    <th className="px-3 py-2 text-start font-semibold">
                      {t('vendor.analytics.table.revenue')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {productsQuery.data?.products.map((product) => (
                    <tr key={product.product_id} className="border-b border-gray-50">
                      <td className="px-3 py-3 font-medium text-diyar-dark">
                        {product.product_name}
                      </td>
                      <td className="px-3 py-3 tabular-nums" dir="ltr">
                        {product.units_sold}
                      </td>
                      <td className="px-3 py-3 tabular-nums" dir="ltr">
                        {product.orders_count}
                      </td>
                      <td className="px-3 py-3 tabular-nums" dir="ltr">
                        {formatMoney(product.revenue, locale, product.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {productsQuery.data && productsQuery.data.pagination.last_page > 1 ? (
              <PaginationBar
                className="mt-4"
                page={productsQuery.data.pagination.current_page}
                pagination={{
                  current_page: productsQuery.data.pagination.current_page,
                  last_page: productsQuery.data.pagination.last_page,
                  per_page: productsQuery.data.pagination.per_page,
                  total: productsQuery.data.pagination.total,
                }}
                onPageChange={setProductsPage}
              />
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
