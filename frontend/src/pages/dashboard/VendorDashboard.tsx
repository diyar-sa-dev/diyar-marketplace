import React from 'react';
import {
  ShoppingCart,
  DollarSign,
  Package,
  RotateCcw,
  Wallet,
  TrendingUp,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ChartContainer, CHART_HEIGHT } from '../../components/common/ChartContainer.tsx';
import { Link } from 'react-router-dom';
import { PageLoadingOverlay } from '../../components/common/PageLoadingOverlay.tsx';
import { ErrorState } from '../../components/common/ErrorState.tsx';
import { VendorOrderStatusBadge } from '../../components/dashboard/vendor/orders/VendorOrderStatusBadge.tsx';
import { useLocale } from '../../hooks/useLocale.ts';
import { formatFinanceDateTime } from '../../lib/formatFinanceDateTime.ts';
import { useVendorDashboardOverview } from '../../hooks/vendor/useVendorFinance.ts';

export default function VendorDashboard() {
  const { t, locale } = useLocale();
  const overviewQuery = useVendorDashboardOverview();

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
    sales: Number(point.sales),
  }));

  const formatOrderTime = (iso: string | null) => formatFinanceDateTime(iso ?? undefined, locale);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">{t('vendor.dashboard.periodSales')}</h3>
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-diyar-dark">{overview.period_sales}</span>
            <span className="text-sm font-bold text-diyar-dark mb-1">{currency}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">{t('vendor.dashboard.pendingOrders')}</h3>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <ShoppingCart size={20} />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-diyar-dark">{overview.orders.pending}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">{t('vendor.dashboard.completedOrders')}</h3>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-diyar-dark">{overview.orders.completed}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">{t('vendor.dashboard.openReturns')}</h3>
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <RotateCcw size={20} />
            </div>
          </div>
          <span className="text-3xl font-bold text-diyar-dark">{overview.returns.open}</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">{t('vendor.dashboard.activeProducts')}</h3>
            <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center">
              <Package size={20} />
            </div>
          </div>
          <span className="text-3xl font-bold text-diyar-dark">{overview.products.active}</span>
          <p className="text-sm text-amber-600 mt-2">
            {t('vendor.dashboard.lowStock')}: {overview.products.low_stock}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">{t('vendor.dashboard.availableBalance')}</h3>
            <div className="w-10 h-10 bg-diyar-brown/10 text-diyar-brown rounded-xl flex items-center justify-center">
              <Wallet size={20} />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-diyar-dark">{overview.available_balance}</span>
            <span className="text-sm font-bold text-gray-500 mb-1">{currency}</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {t('vendor.finance.pendingEscrow', {
              amount: overview.pending_escrow,
              currency,
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2 min-w-0">
          <h3 className="font-bold text-diyar-dark mb-6">{t('vendor.dashboard.salesChart')}</h3>
          {chartData.length === 0 ? (
            <div
              className="flex items-center justify-center text-gray-500 text-sm"
              style={{ height: CHART_HEIGHT }}
            >
              {t('vendor.dashboard.emptyRecentOrders')}
            </div>
          ) : (
            <ChartContainer>
              <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '16px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#A67B5B"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#A67B5B', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-diyar-dark">{t('vendor.dashboard.recentOrders')}</h3>
            <Link to="/dashboard/vendor/orders" className="text-sm text-diyar-brown hover:underline">
              {t('vendor.dashboard.viewAllOrders')}
            </Link>
          </div>

          {overview.recent_orders.length === 0 ? (
            <p className="text-sm text-gray-500">{t('vendor.dashboard.emptyRecentOrders')}</p>
          ) : (
            <div className="space-y-3">
              {overview.recent_orders.map((order) => (
                <Link
                  to="/dashboard/vendor/orders"
                  key={order.id}
                  className="group block rounded-2xl border border-gray-100 bg-linear-to-br from-white to-diyar-cream/20 p-4 transition-all hover:border-diyar-brown/25 hover:shadow-md hover:shadow-diyar-brown/5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-diyar-dark leading-snug truncate">
                        {order.product_name ?? '—'}
                      </h4>
                      <p className="mt-1 text-xs font-semibold text-diyar-brown/85 tabular-nums" dir="ltr">
                        {order.order_number ?? order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="mt-1.5 text-xs text-gray-400">{formatOrderTime(order.created_at)}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className="text-sm font-bold text-diyar-dark tabular-nums whitespace-nowrap" dir="ltr">
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

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-red-600 mb-6">{t('vendor.dashboard.inventoryAlerts')}</h3>
        {overview.low_stock_products.length === 0 ? (
          <p className="text-sm text-gray-500">{t('vendor.dashboard.emptyLowStock')}</p>
        ) : (
          <div className="space-y-4">
            {overview.low_stock_products.map((product) => (
              <div
                key={product.id ?? product.name}
                className="flex items-center justify-between p-3 border border-gray-100 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                    <Package size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-diyar-dark">{product.name ?? '—'}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {t('vendor.dashboard.remaining', { count: product.available_quantity })}
                    </p>
                  </div>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    product.status === 'out_of_stock'
                      ? 'text-red-600 bg-red-50'
                      : 'text-amber-600 bg-amber-50'
                  }`}
                >
                  {product.status === 'out_of_stock'
                    ? t('vendor.dashboard.outOfStock')
                    : t('vendor.dashboard.lowStockLabel')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
