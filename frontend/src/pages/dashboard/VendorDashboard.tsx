import React, { useMemo, useState } from 'react';
import {
  ShoppingCart,
  DollarSign,
  Package,
  RotateCcw,
  Wallet,
  TrendingUp,
  Star,
  Clock,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartContainer } from '../../components/common/ChartContainer.tsx';
import { Link } from 'react-router-dom';
import { PageLoadingOverlay } from '../../components/common/PageLoadingOverlay.tsx';
import { ErrorState } from '../../components/common/ErrorState.tsx';
import { VendorOrderStatusBadge } from '../../components/dashboard/vendor/orders/VendorOrderStatusBadge.tsx';
import { StarRating } from '../../components/product/StarRating.tsx';
import { useLocale } from '../../hooks/useLocale.ts';
import { formatFinanceDateTime } from '../../lib/formatFinanceDateTime.ts';
import { useVendorDashboardOverview } from '../../hooks/vendor/useVendorFinance.ts';
import { resolveMediaUrl } from '../../lib/media.ts';
import { PLACEHOLDER_STORE_LOGO } from '../../lib/storeMediaDefaults.ts';

type StatCardProps = {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  iconClass: string;
  footer?: React.ReactNode;
  className?: string;
};

function StatCard({ label, value, icon, iconClass, footer, className = '' }: StatCardProps) {
  return (
    <div
      className={`h-full flex flex-col bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-sm font-medium text-gray-500 leading-snug">{label}</h3>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}
        >
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-2 flex-wrap flex-1">{value}</div>
      {footer ? <div className="mt-auto pt-2">{footer}</div> : null}
    </div>
  );
}

type ProductInsight = {
  id: string | null;
  name: string | null;
  image_url?: string | null;
  orders_count?: number;
  available_quantity: number;
  revenue?: string;
  status?: 'out_of_stock' | 'low_stock';
};

function ProductInsightRow({
  product,
  currency,
  t,
  variant,
}: {
  product: ProductInsight;
  currency: string;
  t: (key: string, params?: Record<string, string | number>) => string;
  variant: 'top' | 'alert';
}) {
  const imageSrc = resolveMediaUrl(product.image_url) ?? PLACEHOLDER_STORE_LOGO;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-linear-to-br from-white to-gray-50/80 hover:border-diyar-brown/20 transition-colors">
      <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-xl overflow-hidden border border-gray-100 bg-white">
        <img src={imageSrc} alt={product.name ?? ''} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-sm text-diyar-dark truncate">{product.name ?? '—'}</h4>
        <p className="text-xs text-gray-500 mt-1">
          {variant === 'top'
            ? t('vendor.dashboard.topSellingMeta', {
                orders: product.orders_count ?? 0,
                remaining: product.available_quantity,
              })
            : t('vendor.dashboard.remaining', { count: product.available_quantity })}
        </p>
      </div>
      {variant === 'top' ? (
        <span className="text-sm font-bold text-diyar-dark tabular-nums shrink-0" dir="ltr">
          {product.revenue} {currency}
        </span>
      ) : (
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
            product.status === 'out_of_stock'
              ? 'text-red-600 bg-red-50'
              : 'text-amber-600 bg-amber-50'
          }`}
        >
          {product.status === 'out_of_stock'
            ? t('vendor.dashboard.outOfStock')
            : t('vendor.dashboard.lowStockLabel')}
        </span>
      )}
    </div>
  );
}

export default function VendorDashboard() {
  const { t, locale } = useLocale();
  const [stockFilter, setStockFilter] = useState<'all' | 'limited' | 'out_of_stock'>('all');
  const overviewQuery = useVendorDashboardOverview();

  const filteredLowStockProducts = useMemo(() => {
    const products = (overviewQuery.data?.low_stock_products ?? []).slice(0, 5);
    if (stockFilter === 'all') {
      return products;
    }
    return products.filter((product) =>
      stockFilter === 'out_of_stock'
        ? product.status === 'out_of_stock'
        : product.status === 'low_stock',
    );
  }, [overviewQuery.data?.low_stock_products, stockFilter]);

  const topSellingProducts = useMemo(
    () => (overviewQuery.data?.top_selling_products ?? []).slice(0, 5),
    [overviewQuery.data?.top_selling_products],
  );

  if (overviewQuery.isLoading) {
    return <PageLoadingOverlay />;
  }

  if (overviewQuery.isError || !overviewQuery.data) {
    return (
      <ErrorState
        message={t('vendor.dashboard.loadError')}
        onRetry={() => void overviewQuery.refetch()}
      />
    );
  }

  const overview = overviewQuery.data;
  const currency = overview.currency ?? t('common.currency');

  const chartData = overview.sales_chart.map((point) => ({
    name: point.label,
    [t('vendor.dashboard.chartSales')]: Number(point.sales),
  }));
  const salesSeriesKey = t('vendor.dashboard.chartSales');

  const formatOrderTime = (iso: string | null) => formatFinanceDateTime(iso ?? undefined, locale);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        <StatCard
          label={t('vendor.dashboard.periodSales')}
          icon={<DollarSign size={20} />}
          iconClass="bg-green-50 text-green-600"
          value={
            <>
              <span className="text-2xl sm:text-3xl font-bold text-diyar-dark tabular-nums">
                {overview.period_sales}
              </span>
              <span className="text-sm font-bold text-gray-500 mb-1">{currency}</span>
            </>
          }
        />
        <StatCard
          label={t('vendor.dashboard.pendingOrders')}
          icon={<ShoppingCart size={20} />}
          iconClass="bg-blue-50 text-blue-600"
          value={
            <span className="text-2xl sm:text-3xl font-bold text-diyar-dark tabular-nums">
              {overview.orders.pending}
            </span>
          }
        />
        <StatCard
          label={t('vendor.dashboard.pendingPreorders')}
          icon={<Clock size={20} />}
          iconClass="bg-purple-50 text-purple-600"
          value={
            <Link
              to="/dashboard/vendor/orders?tab=preorders"
              className="text-2xl sm:text-3xl font-bold text-diyar-dark tabular-nums hover:text-diyar-brown transition-colors"
            >
              {overview.preorders?.pending ?? 0}
            </Link>
          }
        />
        <StatCard
          label={t('vendor.dashboard.completedOrders')}
          icon={<TrendingUp size={20} />}
          iconClass="bg-emerald-50 text-emerald-600"
          value={
            <span className="text-2xl sm:text-3xl font-bold text-diyar-dark tabular-nums">
              {overview.orders.completed}
            </span>
          }
        />
        <StatCard
          label={t('vendor.dashboard.availableBalance')}
          icon={<Wallet size={20} />}
          iconClass="bg-diyar-brown/10 text-diyar-brown"
          value={
            <>
              <span className="text-2xl sm:text-3xl font-bold text-diyar-dark tabular-nums">
                {overview.available_balance}
              </span>
              <span className="text-sm font-bold text-gray-500 mb-1">{currency}</span>
            </>
          }
          footer={
            <p className="text-xs text-gray-500">
              {t('vendor.finance.pendingEscrow', {
                amount: overview.pending_escrow,
                currency,
              })}
            </p>
          }
        />

        <StatCard
          label={t('vendor.dashboard.openReturns')}
          icon={<RotateCcw size={20} />}
          iconClass="bg-amber-50 text-amber-600"
          value={
            <span className="text-2xl sm:text-3xl font-bold text-diyar-dark tabular-nums">
              {overview.returns.open}
            </span>
          }
        />
        <StatCard
          label={t('vendor.dashboard.activeProducts')}
          icon={<Package size={20} />}
          iconClass="bg-violet-50 text-violet-600"
          value={
            <span className="text-2xl sm:text-3xl font-bold text-diyar-dark tabular-nums">
              {overview.products.active}
            </span>
          }
          footer={
            <p className="text-sm text-amber-600">
              {t('vendor.dashboard.lowStock')}: {overview.products.low_stock}
            </p>
          }
        />
        <StatCard
          label={t('vendor.dashboard.storeRating')}
          icon={<Star size={20} />}
          iconClass="bg-amber-50 text-amber-500"
          value={
            overview.store_reviews.review_count > 0 &&
            overview.store_reviews.average_rating != null ? (
              <>
                <span className="text-2xl sm:text-3xl font-bold text-diyar-dark tabular-nums">
                  {overview.store_reviews.average_rating.toFixed(1)}
                </span>
                <StarRating value={overview.store_reviews.average_rating} readOnly size={16} />
              </>
            ) : (
              <span className="text-sm text-gray-500">{t('vendor.dashboard.noStoreReviews')}</span>
            )
          }
          footer={
            overview.store_reviews.review_count > 0 ? (
              <p className="text-sm text-gray-500">
                {t('vendor.dashboard.storeRatingCount', {
                  count: overview.store_reviews.review_count,
                })}
              </p>
            ) : undefined
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm min-w-0 flex flex-col min-h-80 sm:min-h-96 lg:min-h-112 xl:min-h-128">
          <h3 className="font-bold text-diyar-dark mb-4 shrink-0">
            {t('vendor.dashboard.salesChart')}
          </h3>
          <div className="flex-1 min-h-72 sm:min-h-80 lg:min-h-0 w-full">
            {chartData.length === 0 ? (
              <div className="flex h-full min-h-72 items-center justify-center text-gray-500 text-sm">
                {t('vendor.dashboard.emptyRecentOrders')}
              </div>
            ) : (
              <ChartContainer fill minHeight={320}>
                <LineChart data={chartData} margin={{ top: 12, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    width={48}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '16px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value: number) => [`${value} ${currency}`, salesSeriesKey]}
                  />
                  <Line
                    type="monotone"
                    dataKey={salesSeriesKey}
                    name={salesSeriesKey}
                    stroke="#A67B5B"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#A67B5B', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col min-h-64 lg:min-h-112 xl:min-h-128 max-h-128 lg:max-h-none">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h3 className="font-bold text-diyar-dark">{t('vendor.dashboard.recentOrders')}</h3>
            <Link
              to="/dashboard/vendor/orders"
              className="text-sm text-diyar-brown hover:underline font-bold"
            >
              {t('vendor.dashboard.viewAllOrders')}
            </Link>
          </div>

          {overview.recent_orders.length === 0 ? (
            <p className="text-sm text-gray-500">{t('vendor.dashboard.emptyRecentOrders')}</p>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto">
              {overview.recent_orders.map((order) => (
                <Link
                  to="/dashboard/vendor/orders"
                  key={order.id}
                  className="group block rounded-2xl border border-gray-100 bg-linear-to-br from-white to-diyar-cream/20 p-4 transition-all hover:border-diyar-brown/25 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-diyar-dark leading-snug truncate">
                        {order.product_name ?? '—'}
                      </h4>
                      <p
                        className="mt-1 text-xs font-semibold text-diyar-brown/85 tabular-nums"
                        dir="ltr"
                      >
                        {order.order_number ?? order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="mt-1.5 text-xs text-gray-400">
                        {formatOrderTime(order.created_at)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span
                        className="text-sm font-bold text-diyar-dark tabular-nums whitespace-nowrap"
                        dir="ltr"
                      >
                        {order.vendor_total} {currency}
                      </span>
                      <VendorOrderStatusBadge status={order.status} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-diyar-dark mb-4">{t('vendor.dashboard.topSelling')}</h3>
          {(topSellingProducts.length ?? 0) === 0 ? (
            <p className="text-sm text-gray-500">{t('vendor.dashboard.emptyRecentOrders')}</p>
          ) : (
            <div className="space-y-3">
              {topSellingProducts.map((product) => (
                <ProductInsightRow
                  key={product.id ?? product.name}
                  product={product}
                  currency={currency}
                  t={t}
                  variant="top"
                />
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h3 className="font-bold text-red-600">{t('vendor.dashboard.inventoryAlerts')}</h3>
            <div className="flex bg-gray-50 border border-gray-200 rounded-lg p-0.5">
              {(['all', 'limited', 'out_of_stock'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setStockFilter(filter)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                    stockFilter === filter
                      ? 'bg-white text-diyar-dark shadow-sm'
                      : 'text-gray-500 hover:text-diyar-dark'
                  }`}
                >
                  {t(`vendor.dashboard.stockFilters.${filter}`)}
                </button>
              ))}
            </div>
          </div>
          {filteredLowStockProducts.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              {t('vendor.dashboard.emptyLowStock')}
            </p>
          ) : (
            <div className="space-y-3">
              {filteredLowStockProducts.map((product) => (
                <ProductInsightRow
                  key={product.id ?? product.name}
                  product={product}
                  currency={currency}
                  t={t}
                  variant="alert"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
