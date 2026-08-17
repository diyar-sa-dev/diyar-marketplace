import React, { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  Wallet,
  Download,
  Clock,
  CheckCircle,
  TrendingUp,
  Lock,
  DollarSign,
  RefreshCcw,
  Filter,
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
import { PaginationBar } from '../../components/catalog/PaginationBar.tsx';
import { PageLoadingOverlay } from '../../components/common/PageLoadingOverlay.tsx';
import { ErrorState } from '../../components/common/ErrorState.tsx';
import { TableSkeleton } from '../../components/common/TableSkeleton.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { formatFinanceDateTime } from '../../lib/formatFinanceDateTime.ts';
import { formatOrderDate } from '../../lib/formatOrderDate.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import {
  useDownloadVendorFinanceReport,
  useVendorFinanceAnalytics,
  useVendorFinanceReport,
  useVendorTransactions,
} from '../../hooks/vendor/useVendorFinance.ts';
import type { FinancePeriod, FinancialTransaction, TransactionTypeFilter } from '../../api/vendorFinance.ts';

const PERIOD_OPTIONS: FinancePeriod[] = ['week', 'month', 'year'];

const ORDER_LINKED_TYPES = new Set([
  'escrow',
  'escrow_release',
  'platform_commission',
  'refund',
  'sale',
]);

const TYPE_FILTERS: TransactionTypeFilter[] = [
  'all',
  'revenue',
  'commission',
  'refund',
  'payout',
  'adjustment',
];

type TransactionVisual = {
  icon: typeof DollarSign;
  iconClass: string;
  bgClass: string;
  amountClass: string;
};

function transactionVisual(type: string, direction: string): TransactionVisual {
  if (type === 'refund') {
    return {
      icon: RefreshCcw,
      iconClass: 'text-orange-600',
      bgClass: 'bg-orange-50',
      amountClass: 'text-diyar-dark',
    };
  }

  if (type === 'payout') {
    return {
      icon: Wallet,
      iconClass: 'text-diyar-dark',
      bgClass: 'bg-gray-100',
      amountClass: 'text-diyar-dark',
    };
  }

  if (type === 'platform_commission') {
    return {
      icon: ArrowDownRight,
      iconClass: 'text-red-600',
      bgClass: 'bg-red-50',
      amountClass: 'text-red-600',
    };
  }

  if (direction === 'credit') {
    return {
      icon: DollarSign,
      iconClass: 'text-green-600',
      bgClass: 'bg-green-50',
      amountClass: 'text-green-600',
    };
  }

  return {
    icon: ArrowDownRight,
    iconClass: 'text-red-600',
    bgClass: 'bg-red-50',
    amountClass: 'text-red-600',
  };
}

export default function VendorFinance() {
  const { t, locale, dir } = useLocale();
  const [period, setPeriod] = useState<FinancePeriod>('month');
  const [transactionPage, setTransactionPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const reportQuery = useVendorFinanceReport(period);
  const analyticsQuery = useVendorFinanceAnalytics(period);
  const transactionsQuery = useVendorTransactions(transactionPage, typeFilter);
  const downloadReport = useDownloadVendorFinanceReport();

  const report = reportQuery.data;
  const summary = report?.summary;
  const currency = summary?.currency ?? t('common.currency');

  const chartData = useMemo(
    () =>
      (analyticsQuery.data?.analytics ?? []).map((point) => ({
        name: point.label,
        net: Number(point.net_earnings),
        fee: Number(point.commission),
      })),
    [analyticsQuery.data?.analytics],
  );

  const periodLabel = (value: FinancePeriod) => {
    const map: Record<FinancePeriod, string> = {
      day: t('vendor.finance.periodDay'),
      week: t('vendor.finance.periodWeek'),
      month: t('vendor.finance.periodMonth'),
      year: t('vendor.finance.periodYear'),
    };
    return map[value];
  };

  const typeFilterLabel = (value: TransactionTypeFilter) => {
    const map: Record<TransactionTypeFilter, string> = {
      all: t('vendor.finance.filterAll'),
      revenue: t('vendor.finance.filterRevenue'),
      commission: t('vendor.finance.filterCommission'),
      refund: t('vendor.finance.filterRefund'),
      payout: t('vendor.finance.filterPayout'),
      adjustment: t('vendor.finance.filterAdjustment'),
    };
    return map[value];
  };

  const transactionTypeLabel = (type: string) => {
    const key = `vendor.finance.types.${type}` as const;
    const translated = t(key);
    return translated === key ? type : translated;
  };

  const formatSignedAmount = (amount: string, direction: string, txCurrency: string) => {
    if (direction === 'credit') {
      return t('vendor.finance.signedCredit', { amount, currency: txCurrency });
    }
    return t('vendor.finance.signedDebit', { amount, currency: txCurrency });
  };

  const commissionRateHint = useMemo(() => {
    const rate = summary?.commission_rate_percent;
    const base = summary?.commission_base;
    if (!rate || Number(rate) <= 0 || !base) {
      return null;
    }
    return t('vendor.finance.commissionRateHint', { rate, base, currency });
  }, [summary?.commission_rate_percent, summary?.commission_base, currency, t]);

  const handleExport = async () => {
    try {
      const blob = await downloadReport.mutateAsync({ period, type: typeFilter });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `vendor-finance-${period}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      // surfaced by global handler
    }
  };

  const handlePeriodChange = (next: FinancePeriod) => {
    setPeriod(next);
    setTransactionPage(1);
  };

  const handleFilterChange = (next: TransactionTypeFilter) => {
    setTypeFilter(next);
    setTransactionPage(1);
    setFiltersOpen(false);
  };

  if (reportQuery.isLoading) {
    return <PageLoadingOverlay />;
  }

  if (reportQuery.isError || !report || !summary) {
    return (
      <ErrorState message={t('vendor.finance.loadError')} onRetry={() => void reportQuery.refetch()} />
    );
  }

  const transactions = transactionsQuery.data?.transactions ?? [];
  const pagination = transactionsQuery.data?.pagination;

  const renderTransactionRow = (tx: FinancialTransaction) => {
    const visual = transactionVisual(tx.transaction_type, tx.direction);
    const Icon = visual.icon;

    return (
      <tr key={tx.id} className="hover:bg-gray-50/50 transition">
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${visual.bgClass} ${visual.iconClass}`}
            >
              <Icon size={18} />
            </div>
            <div>
              <span className="font-bold text-gray-700">{transactionTypeLabel(tx.transaction_type)}</span>
              {ORDER_LINKED_TYPES.has(tx.transaction_type) && tx.order_number ? (
                <span className="block text-xs text-gray-400 font-normal mt-0.5">
                  {t('vendor.finance.orderReference', { number: tx.order_number })}
                </span>
              ) : null}
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <span className={`font-bold inline-block whitespace-nowrap ${visual.amountClass}`} dir="ltr">
            {formatSignedAmount(tx.amount, tx.direction, tx.currency)}
          </span>
        </td>
        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
          {formatFinanceDateTime(tx.created_at ?? undefined, locale)}
        </td>
        <td className="px-6 py-4">
          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-green-100 text-green-700">
            {t('vendor.finance.transactionCompleted')}
          </span>
        </td>
      </tr>
    );
  };

  return (
    <div className="relative space-y-6 animate-in fade-in duration-300">
      {(analyticsQuery.isFetching || downloadReport.isPending) && <PageLoadingOverlay />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-diyar-dark">{t('vendor.finance.title')}</h2>
          <p className="text-gray-500 text-sm mt-1">{t('vendor.finance.subtitle')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handlePeriodChange(option)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer ${
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
            disabled={downloadReport.isPending}
            className="border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition shadow-sm bg-white cursor-pointer disabled:opacity-60"
          >
            <Download size={18} />
            {downloadReport.isPending ? t('vendor.finance.exporting') : t('vendor.finance.exportReport')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-diyar-dark text-white p-6 rounded-2xl shadow-sm relative overflow-hidden md:col-span-2">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full translate-x-16 -translate-y-16" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -translate-x-10 translate-y-10" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <h3 className="text-white/70 font-medium mb-1 flex items-center gap-2">
                <Wallet size={18} />
                {t('vendor.finance.availableBalance')}
              </h3>
              <div className="flex items-end gap-2 mt-2">
                <span className="text-5xl font-bold">{summary.available_balance}</span>
                <span className="text-xl text-white/70 mb-1">{currency}</span>
              </div>
              <p className="text-sm text-white/60 mt-3 flex items-center gap-1.5">
                <CheckCircle size={14} />
                {t('vendor.finance.availableHint')}
              </p>
            </div>
            <button
              type="button"
              disabled
              title={t('vendor.finance.withdrawalDisabled')}
              className="w-full sm:w-auto mt-6 bg-white/20 text-white/80 px-6 py-3 rounded-xl font-bold cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Lock size={18} />
              {t('vendor.finance.withdrawalButton')}
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-500 font-medium">{t('vendor.finance.grossSales')}</h3>
              <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-diyar-dark">{summary.gross_sales}</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">{t('vendor.finance.grossSalesHint')}</p>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-amber-700 mt-4 bg-amber-50 px-2.5 py-1.5 rounded-lg w-fit">
            <Clock size={14} />
            <span>{t('vendor.finance.pendingEscrow', { amount: summary.pending_escrow, currency })}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-500 font-medium">{t('vendor.finance.platformCommission')}</h3>
              <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                <ArrowDownRight size={20} />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-diyar-dark">{summary.commission}</span>
            </div>
          </div>
          {commissionRateHint ? (
            <div className="flex items-center gap-1 text-sm font-medium text-gray-500 mt-4">
              <span className="bg-gray-100 px-2 py-1 rounded-md text-xs">{commissionRateHint}</span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm min-w-0">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-diyar-dark">{t('vendor.finance.analyticsTitle')}</h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-gray-600">{t('vendor.finance.netEarningsSeries')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="text-gray-600">{t('vendor.finance.commissionSeries')}</span>
              </div>
            </div>
          </div>
          {analyticsQuery.isLoading ? (
            <div className="flex items-center justify-center" style={{ height: CHART_HEIGHT }}>
              <TableSkeleton rows={1} columns={1} />
            </div>
          ) : chartData.length === 0 ? (
            <div
              className="flex items-center justify-center text-sm text-gray-500"
              style={{ height: CHART_HEIGHT }}
            >
              {t('vendor.finance.transactionEmpty')}
            </div>
          ) : (
            <ChartContainer>
              <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '16px',
                      border: 'none',
                      boxShadow: '0 4px 20px -2px rgb(0 0 0 / 0.1)',
                    }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Line
                    name={t('vendor.finance.netEarningsSeries')}
                    type="monotone"
                    dataKey="net"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    name={t('vendor.finance.commissionSeries')}
                    type="monotone"
                    dataKey="fee"
                    stroke="#fbbf24"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#fbbf24', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-diyar-dark mb-4">{t('vendor.finance.periodSummaryTitle')}</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600 text-sm">{t('vendor.finance.productSales')}</span>
                <span className="font-bold text-diyar-dark" dir="ltr">
                  {summary.commission_base ?? '0.00'} {currency}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600 text-sm">{t('vendor.finance.platformCommission')}</span>
                <span className="font-bold text-red-600" dir="ltr">
                  {summary.commission} {currency}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50/60 rounded-xl">
                <span className="text-gray-600 text-sm">{t('vendor.finance.netEarnings')}</span>
                <span className="font-bold text-green-700" dir="ltr">
                  {summary.net_earnings} {currency}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600 text-sm">{t('vendor.finance.completedOrders')}</span>
                <span className="font-bold text-diyar-dark">
                  {report.orders.completed} {t('vendor.finance.ordersUnit')}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600 text-sm">{t('vendor.finance.averageOrderValue')}</span>
                <span className="font-bold text-diyar-dark" dir="ltr">
                  {report.orders.average_order_value} {currency}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50/50 rounded-xl">
                <span className="text-gray-600 text-sm">{t('vendor.finance.periodRefunds')}</span>
                <span className="font-bold text-red-600" dir="ltr">
                  {summary.refunds} {currency}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-linear-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-100 shadow-sm">
            <h3 className="font-bold text-amber-800 mb-2">{t('vendor.finance.upcomingPayouts')}</h3>
            {report.upcoming_payout.amount ? (
              <>
                <p className="text-sm text-amber-700/80 mb-4">
                  {report.upcoming_payout.note ?? t('vendor.finance.upcomingPayoutHint')}
                </p>
                <div className="flex items-center justify-between bg-white/60 p-4 rounded-xl">
                  <div>
                    <span className="text-xl font-bold text-amber-700 block" dir="ltr">
                      {report.upcoming_payout.amount} {currency}
                    </span>
                    {report.upcoming_payout.due_at ? (
                      <span className="text-xs text-amber-600 font-medium">
                        {t('vendor.finance.dueOn', {
                          date: formatOrderDate(report.upcoming_payout.due_at, locale),
                        })}
                      </span>
                    ) : null}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                    <Clock size={20} />
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-amber-700/80">
                {report.upcoming_payout.note ?? t('vendor.finance.noUpcomingPayout')}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-bold text-diyar-dark">{t('vendor.finance.transactionHistory')}</h3>
          <div className="relative">
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition cursor-pointer"
            >
              <Filter size={16} />
              {typeFilterLabel(typeFilter)}
            </button>
            {filtersOpen ? (
              <div className="absolute top-full mt-2 min-w-45 rounded-xl border border-gray-100 bg-white shadow-lg z-20 p-2 inset-e-0">
                {TYPE_FILTERS.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => handleFilterChange(filter)}
                    className={`w-full text-start px-3 py-2 rounded-lg text-sm font-bold cursor-pointer ${
                      typeFilter === filter ? 'bg-diyar-dark text-white' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {typeFilterLabel(filter)}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {transactionsQuery.isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={5} columns={4} />
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8">
            <EmptyState title={t('vendor.finance.transactionEmpty')} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" dir={dir}>
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-100 text-xs font-bold">
                <tr>
                  <th className="px-6 py-4 text-start">{t('vendor.finance.tableTransaction')}</th>
                  <th className="px-6 py-4 text-start">{t('vendor.finance.tableAmount')}</th>
                  <th className="px-6 py-4 text-start">{t('vendor.finance.tableDate')}</th>
                  <th className="px-6 py-4 text-start">{t('vendor.finance.tableStatus')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">{transactions.map(renderTransactionRow)}</tbody>
            </table>
          </div>
        )}

        {pagination && transactions.length > 0 ? (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
            <p className="text-xs text-gray-500">
              {t('vendor.finance.paginationTotal', { total: pagination.total })}
            </p>
            <PaginationBar
              pagination={{
                current_page: pagination.current_page,
                last_page: pagination.last_page,
                per_page: 20,
                total: pagination.total,
              }}
              page={transactionPage}
              onPageChange={setTransactionPage}
              alwaysShow
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
