import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownRight,
  Wallet,
  Download,
  Clock,
  CheckCircle,
  TrendingUp,
  DollarSign,
  RefreshCcw,
  Filter,
  X,
  Loader2,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartContainer } from '../../components/common/ChartContainer.tsx';
import { PaginationBar } from '../../components/catalog/PaginationBar.tsx';
import { PageLoadingOverlay } from '../../components/common/PageLoadingOverlay.tsx';
import { ErrorState } from '../../components/common/ErrorState.tsx';
import { TableSkeleton } from '../../components/common/TableSkeleton.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { formatFinanceDateTime } from '../../lib/formatFinanceDateTime.ts';
import { formatOrderDate } from '../../lib/formatOrderDate.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { usePaginationState } from '../../hooks/usePaginationState.ts';
import {
  useDownloadVendorFinanceReport,
  useRequestVendorPayout,
  useVendorFinanceAnalytics,
  useVendorFinanceReport,
  useVendorTransactions,
} from '../../hooks/vendor/useVendorFinance.ts';
import { useVendorAccess } from '../../hooks/vendor/useVendorTeam.ts';
import { useVendorSettings } from '../../hooks/vendor/useVendorSettings.ts';
import { useToast } from '../../hooks/useToast.ts';
import { parseApiError } from '../../utils/errors.ts';
import type {
  FinancePeriod,
  FinancialTransaction,
  TransactionTypeFilter,
} from '../../api/vendorFinance.ts';

const PERIOD_OPTIONS: FinancePeriod[] = ['day', 'week', 'month', '3m', '6m', '12m', 'year'];

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
  const { toast } = useToast();
  const [period, setPeriod] = useState<FinancePeriod>('month');
  const {
    page: transactionPage,
    perPage: transactionPerPage,
    perPageOptions: transactionPerPageOptions,
    onPageChange: onTransactionPageChange,
    onPerPageChange: onTransactionPerPageChange,
    resetPage: resetTransactionPage,
  } = usePaginationState({ initialPerPage: 20 });
  const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const reportQuery = useVendorFinanceReport(period);
  const analyticsQuery = useVendorFinanceAnalytics(period);
  const transactionsQuery = useVendorTransactions(
    transactionPage,
    typeFilter,
    transactionPerPage,
    period,
  );
  const downloadReport = useDownloadVendorFinanceReport();
  const requestPayout = useRequestVendorPayout();
  const settingsQuery = useVendorSettings();
  const { data: vendorAccess } = useVendorAccess();
  const canWithdraw = vendorAccess?.permissions.finance_withdraw === true;

  const report = reportQuery.data;
  const summary = report?.summary;
  const currency = summary?.currency ?? t('common.currency');
  const availableBalance = Number(summary?.available_balance ?? 0);
  const payoutMinimum = Number(settingsQuery.data?.payout_minimum ?? 100);
  const withdrawValue = Number(withdrawAmount);
  const withdrawBelowMinimum =
    withdrawAmount !== '' && Number.isFinite(withdrawValue) && withdrawValue < payoutMinimum;
  const withdrawExceedsBalance =
    withdrawAmount !== '' && Number.isFinite(withdrawValue) && withdrawValue > availableBalance;
  const withdrawAmountValid =
    withdrawAmount !== '' &&
    Number.isFinite(withdrawValue) &&
    withdrawValue >= payoutMinimum &&
    withdrawValue <= availableBalance;

  const netSeriesKey = t('vendor.finance.netEarningsSeries');
  const feeSeriesKey = t('vendor.finance.commissionSeries');

  const chartData = useMemo(
    () =>
      (analyticsQuery.data?.analytics ?? []).map((point) => ({
        name: point.label,
        [netSeriesKey]: Number(point.net_earnings),
        [feeSeriesKey]: Number(point.commission),
      })),
    [analyticsQuery.data?.analytics, netSeriesKey, feeSeriesKey],
  );

  const periodLabel = (value: FinancePeriod) => {
    const map: Record<FinancePeriod, string> = {
      day: t('vendor.finance.periodDay'),
      week: t('vendor.finance.periodWeek'),
      month: t('vendor.finance.periodMonth'),
      '3m': t('vendor.finance.period3m'),
      '6m': t('vendor.finance.period6m'),
      '12m': t('vendor.finance.period12m'),
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
    resetTransactionPage();
  };

  const handleFilterChange = (next: TransactionTypeFilter) => {
    setTypeFilter(next);
    resetTransactionPage();
    setFiltersOpen(false);
  };

  if (reportQuery.isLoading) {
    return <PageLoadingOverlay />;
  }

  if (reportQuery.isError || !report || !summary) {
    return (
      <ErrorState
        message={t('vendor.finance.loadError')}
        onRetry={() => void reportQuery.refetch()}
      />
    );
  }

  const transactions = transactionsQuery.data?.transactions ?? [];
  const pagination = transactionsQuery.data?.pagination;

  const renderTransactionRow = (tx: FinancialTransaction) => {
    const visual = transactionVisual(tx.transaction_type, tx.direction);
    const Icon = visual.icon;

    return (
      <tr key={tx.id} className="hover:bg-gray-50/50 transition">
        <td className="px-6 py-4 text-start">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${visual.bgClass} ${visual.iconClass}`}
            >
              <Icon size={18} />
            </div>
            <div>
              <span className="font-bold text-gray-700">
                {transactionTypeLabel(tx.transaction_type)}
              </span>
              {ORDER_LINKED_TYPES.has(tx.transaction_type) && tx.order_number ? (
                <span className="block text-xs text-gray-400 font-normal mt-0.5">
                  {t('vendor.finance.orderReference', { number: tx.order_number })}
                </span>
              ) : null}
            </div>
          </div>
        </td>
        <td className="px-6 py-4 text-start">
          <span
            className={`font-bold inline-block whitespace-nowrap tabular-nums [unicode-bidi:isolate] ${visual.amountClass}`}
            dir="ltr"
          >
            {formatSignedAmount(tx.amount, tx.direction, tx.currency)}
          </span>
        </td>
        <td className="px-6 py-4 text-start text-gray-500 whitespace-nowrap">
          {formatFinanceDateTime(tx.created_at ?? undefined, locale)}
        </td>
        <td className="px-6 py-4 text-start">
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
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm overflow-x-auto scrollbar-hide">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handlePeriodChange(option)}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition cursor-pointer whitespace-nowrap ${
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
            {downloadReport.isPending
              ? t('vendor.finance.exporting')
              : t('vendor.finance.exportReport')}
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
            {canWithdraw && (
              <button
                type="button"
                onClick={() => setWithdrawOpen(true)}
                className="w-full sm:w-auto mt-6 bg-white text-diyar-brown px-6 py-3 rounded-xl font-bold hover:bg-white/90 transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {t('vendor.finance.withdrawalButton')}
              </button>
            )}
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
            <span>
              {t('vendor.finance.pendingEscrow', { amount: summary.pending_escrow, currency })}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-500 font-medium">
                {t('vendor.finance.platformCommission')}
              </h3>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm min-w-0 flex flex-col min-h-80 sm:min-h-96 lg:min-h-112 xl:min-h-128">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 shrink-0">
            <h3 className="font-bold text-diyar-dark text-lg">
              {t('vendor.finance.analyticsTitle')}
            </h3>
            <div className="flex flex-wrap items-center gap-4 text-sm">
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
          <div className="flex-1 min-h-72 sm:min-h-80 lg:min-h-0 w-full">
            {analyticsQuery.isLoading ? (
              <div className="flex h-full min-h-72 items-center justify-center">
                <TableSkeleton rows={1} columns={1} />
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex h-full min-h-72 items-center justify-center text-sm text-gray-500">
                {t('vendor.finance.transactionEmpty')}
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
                      boxShadow: '0 4px 20px -2px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value: number, name: string) => [`${value} ${currency}`, name]}
                  />
                  <Line
                    name={netSeriesKey}
                    type="monotone"
                    dataKey={netSeriesKey}
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    name={feeSeriesKey}
                    type="monotone"
                    dataKey={feeSeriesKey}
                    stroke="#fbbf24"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#fbbf24', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-4 min-h-64 lg:min-h-112 xl:min-h-128">
          <div className="flex-1 min-h-0 bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm overflow-y-auto">
            <h3 className="font-bold text-diyar-dark mb-4 sticky top-0 bg-white pb-2">
              {t('vendor.finance.periodSummaryTitle')}
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600 text-sm">{t('vendor.finance.productSales')}</span>
                <span className="font-bold text-diyar-dark" dir="ltr">
                  {summary.commission_base ?? '0.00'} {currency}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600 text-sm">
                  {t('vendor.finance.platformCommission')}
                </span>
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
                <span className="text-gray-600 text-sm">
                  {t('vendor.finance.averageOrderValue')}
                </span>
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

          <div className="shrink-0 bg-linear-to-br from-amber-50 to-orange-50 p-5 sm:p-6 rounded-2xl border border-amber-100 shadow-sm">
            <h3 className="font-bold text-amber-800 mb-2">{t('vendor.finance.upcomingPayouts')}</h3>
            {report.upcoming_payout.amount ? (
              <>
                <p className="text-sm text-amber-700/80 mb-3 line-clamp-2">
                  {report.upcoming_payout.note ?? t('vendor.finance.upcomingPayoutHint')}
                </p>
                <div className="flex items-center justify-between gap-3 bg-white/60 p-3 sm:p-4 rounded-xl">
                  <div className="min-w-0">
                    <span
                      className="text-lg sm:text-xl font-bold text-amber-700 block tabular-nums"
                      dir="ltr"
                    >
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
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                    <Clock size={20} />
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-amber-700/80">{t('vendor.finance.noUpcomingPayout')}</p>
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
                      typeFilter === filter
                        ? 'bg-diyar-dark text-white'
                        : 'text-gray-600 hover:bg-gray-50'
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
              <tbody className="divide-y divide-gray-100">
                {transactionPage === 1 && typeFilter === 'all' && report.upcoming_payout.amount ? (
                  <tr className="bg-amber-50/40">
                    <td className="px-6 py-4 text-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-amber-100 text-amber-700">
                          <Clock size={18} />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-gray-700 block">
                            {t('vendor.finance.upcomingPayoutRowTitle')}
                          </span>
                          <span className="text-xs text-gray-500 leading-relaxed">
                            {report.upcoming_payout.note ?? t('vendor.finance.upcomingPayoutHint')}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-start">
                      <span
                        className="font-bold text-amber-700 tabular-nums inline-block"
                        dir="ltr"
                        style={{ unicodeBidi: 'isolate' }}
                      >
                        {report.upcoming_payout.amount} {currency}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-start text-gray-600 text-xs">
                      {report.upcoming_payout.due_at
                        ? t('vendor.finance.dueOn', {
                            date: formatOrderDate(report.upcoming_payout.due_at, locale),
                          })
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-start">
                      <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-100 text-amber-800">
                        {t('vendor.finance.upcomingPayoutScheduled')}
                      </span>
                    </td>
                  </tr>
                ) : null}
                {transactions.map(renderTransactionRow)}
              </tbody>
            </table>
          </div>
        )}

        {pagination && transactions.length > 0 ? (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <PaginationBar
              pagination={{
                current_page: pagination.current_page,
                last_page: pagination.last_page,
                per_page: pagination.per_page ?? transactionPerPage,
                total: pagination.total,
              }}
              page={transactionPage}
              perPage={transactionPerPage}
              perPageOptions={[...transactionPerPageOptions]}
              onPageChange={onTransactionPageChange}
              onPerPageChange={onTransactionPerPageChange}
              alwaysShow={pagination.total > 0}
            />
          </div>
        ) : null}
      </div>

      {withdrawOpen && summary && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            setWithdrawOpen(false);
            setWithdrawAmount('');
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-3 p-6 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-diyar-dark">
                  {t('vendor.finance.withdrawalTitle')}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{t('vendor.finance.availableHint')}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setWithdrawOpen(false);
                  setWithdrawAmount('');
                }}
                className="shrink-0 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
                aria-label={t('common.close')}
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-5 rounded-xl bg-diyar-cream/40 border border-diyar-brown/10 p-4">
                <p className="text-xs text-gray-500 mb-1">{t('vendor.finance.availableBalance')}</p>
                <p className="text-2xl font-bold text-diyar-dark tabular-nums" dir="ltr">
                  {summary.available_balance} {currency}
                </p>
              </div>

              {settingsQuery.data?.bank_account ? (
                <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm">
                  <p className="font-bold text-diyar-dark mb-1">
                    {t('vendor.finance.withdrawalBankAccount')}
                  </p>
                  <p className="text-gray-600">
                    {settingsQuery.data.bank_account.bank_label} —{' '}
                    {settingsQuery.data.bank_account.iban_masked}
                  </p>
                  <Link
                    to="/dashboard/vendor/settings?tab=business"
                    className="mt-2 inline-block text-diyar-brown text-sm font-bold hover:underline"
                  >
                    {t('vendor.finance.withdrawalManageAccounts')}
                  </Link>
                </div>
              ) : (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  {t('vendor.finance.withdrawalMissingBank')}{' '}
                  <Link
                    to="/dashboard/vendor/settings?tab=business"
                    className="font-bold text-diyar-brown hover:underline"
                  >
                    {t('vendor.finance.withdrawalManageAccounts')}
                  </Link>
                </div>
              )}

              <label className="block text-sm font-bold text-gray-700 mb-2 text-start">
                {t('vendor.finance.withdrawalAmount')}
              </label>
              <div className="flex items-center rounded-xl border border-gray-200 mb-1 overflow-hidden focus-within:border-diyar-brown focus-within:ring-1 focus-within:ring-diyar-brown">
                <input
                  type="number"
                  min={payoutMinimum}
                  max={summary.available_balance}
                  step="0.01"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 min-w-0 border-0 px-4 py-3 focus:outline-none focus:ring-0 tabular-nums"
                  dir="ltr"
                />
                <span className="px-4 py-3 text-gray-400 text-sm border-s border-gray-200 shrink-0">
                  {currency}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-1">
                {t('vendor.finance.withdrawalMinHint', {
                  amount: payoutMinimum,
                  currency,
                })}
              </p>
              <p className="text-xs text-gray-500 mb-4">
                {t('vendor.finance.withdrawalMaxHint', {
                  amount: summary.available_balance,
                  currency,
                })}
              </p>
              {withdrawBelowMinimum ? (
                <p className="text-xs text-red-600 font-medium mb-4" role="alert">
                  {t('vendor.finance.withdrawalMinError', {
                    amount: payoutMinimum,
                    currency,
                  })}
                </p>
              ) : null}
              {withdrawExceedsBalance ? (
                <p className="text-xs text-red-600 font-medium mb-4" role="alert">
                  {t('vendor.finance.withdrawalMaxError')}
                </p>
              ) : null}

              {settingsQuery.data?.payout_schedule && (
                <p className="text-xs text-gray-500 mb-6">
                  {t('vendor.finance.withdrawalSchedule', {
                    min: settingsQuery.data.payout_schedule.min_days,
                    max: settingsQuery.data.payout_schedule.max_days,
                  })}
                </p>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setWithdrawOpen(false);
                    setWithdrawAmount('');
                  }}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  {t('vendor.finance.withdrawalCancel')}
                </button>
                <button
                  type="button"
                  disabled={
                    requestPayout.isPending ||
                    !withdrawAmountValid ||
                    !settingsQuery.data?.bank_account
                  }
                  onClick={() => {
                    if (withdrawBelowMinimum) {
                      toast.error(
                        t('vendor.finance.withdrawalMinError', {
                          amount: payoutMinimum,
                          currency,
                        }),
                      );
                      return;
                    }
                    if (withdrawExceedsBalance || !withdrawAmountValid) {
                      toast.error(t('vendor.finance.withdrawalMaxError'));
                      return;
                    }
                    void requestPayout
                      .mutateAsync(withdrawAmount)
                      .then(() => {
                        toast.success(t('vendor.finance.withdrawalSuccess'));
                        setWithdrawOpen(false);
                        setWithdrawAmount('');
                        void reportQuery.refetch();
                      })
                      .catch((error) => toast.error(parseApiError(error, locale).message));
                  }}
                  className="inline-flex items-center justify-center gap-2 min-w-32 px-5 py-2.5 rounded-xl bg-diyar-brown text-white font-bold hover:bg-[#856b54] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {requestPayout.isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {t('vendor.finance.withdrawalSubmitting')}
                    </>
                  ) : (
                    t('vendor.finance.withdrawalConfirm')
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
