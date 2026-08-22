import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
  Wallet,
  CheckCircle,
  TrendingUp,
  X,
  Loader2,
  DollarSign,
  Filter,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartContainer } from '../../components/common/ChartContainer.tsx';
import { PaginationBar } from '../../components/catalog/PaginationBar.tsx';
import { TableSkeleton } from '../../components/common/TableSkeleton.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { PageLoadingOverlay } from '../../components/common/PageLoadingOverlay.tsx';
import { ErrorState } from '../../components/common/ErrorState.tsx';
import { LoadingState } from '../../components/common/LoadingState.tsx';
import {
  useDownloadProviderFinanceReport,
  useProviderFinanceAnalytics,
  useProviderFinanceSummary,
  useProviderFinanceTransactions,
  useProviderSettings,
  useRequestProviderPayout,
} from '../../hooks/provider/useProviderDashboard.ts';
import { formatFinanceDateTime } from '../../lib/formatFinanceDateTime.ts';
import type { ProviderFinanceTransaction } from '../../types/providerDashboard.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { usePaginationState } from '../../hooks/usePaginationState.ts';
import { useToast } from '../../hooks/useToast.ts';
import {
  formatFinanceAnalyticsLabel,
  formatProviderMoney,
  formatWesternNumber,
} from '../../lib/providerDashboardUi.ts';
import { parseApiError } from '../../utils/errors.ts';

const TYPE_FILTERS = ['all', 'revenue', 'commission', 'payout'] as const;
type TransactionTypeFilter = (typeof TYPE_FILTERS)[number];

function transactionVisual(type: string, direction: string) {
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

export default function ServiceFinance() {
  const { t, dir, locale } = useLocale();
  const { toast } = useToast();
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
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

  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
    error: summaryErr,
    refetch: refetchSummary,
  } = useProviderFinanceSummary();
  const {
    data: analytics = [],
    isLoading: analyticsLoading,
    isError: analyticsError,
    refetch: refetchAnalytics,
  } = useProviderFinanceAnalytics();
  const { data: settings } = useProviderSettings();
  const transactionsQuery = useProviderFinanceTransactions(
    transactionPage,
    typeFilter === 'all' ? undefined : typeFilter,
    transactionPerPage,
  );
  const requestPayout = useRequestProviderPayout();
  const downloadReport = useDownloadProviderFinanceReport();

  const bankAccount = settings?.bank_accounts[0];
  const payoutMinimum = summary?.payout_minimum ?? 100;
  const availableBalance = summary?.available_balance ?? 0;
  const withdrawValue = Number(payoutAmount);
  const withdrawBelowMinimum =
    payoutAmount !== '' && Number.isFinite(withdrawValue) && withdrawValue < payoutMinimum;
  const withdrawExceedsBalance =
    payoutAmount !== '' && Number.isFinite(withdrawValue) && withdrawValue > availableBalance;
  const withdrawAmountValid =
    payoutAmount !== '' &&
    Number.isFinite(withdrawValue) &&
    withdrawValue >= payoutMinimum &&
    withdrawValue <= availableBalance;

  const chartData = useMemo(
    () =>
      analytics.map((point) => ({
        ...point,
        name: formatFinanceAnalyticsLabel(point, locale),
      })),
    [analytics, locale],
  );

  const currency = t('providerDashboard.common.currency');
  const transactions = transactionsQuery.data?.items ?? [];
  const pagination = transactionsQuery.data?.pagination;

  const typeFilterLabel = (value: TransactionTypeFilter) => {
    const map: Record<TransactionTypeFilter, string> = {
      all: t('providerDashboard.finance.filterAll'),
      revenue: t('providerDashboard.finance.filterRevenue'),
      commission: t('providerDashboard.finance.filterCommission'),
      payout: t('providerDashboard.finance.filterPayout'),
    };
    return map[value];
  };

  const transactionTypeLabel = (type: string) => {
    const key = `providerDashboard.finance.types.${type}` as const;
    const translated = t(key);
    return translated === key ? type : translated;
  };

  const formatSignedAmount = (amount: string, direction: string, txCurrency: string) =>
    direction === 'credit'
      ? t('providerDashboard.finance.signedCredit', { amount, currency: txCurrency })
      : t('providerDashboard.finance.signedDebit', { amount, currency: txCurrency });

  const statusLabel = (status: ProviderFinanceTransaction['status']) => {
    if (status === 'scheduled') return t('providerDashboard.finance.transactionScheduled');
    if (status === 'cancelled') return t('providerDashboard.finance.transactionCancelled');
    return t('providerDashboard.finance.transactionCompleted');
  };

  const renderTransactionRow = (tx: ProviderFinanceTransaction) => {
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
            <div className="min-w-0">
              <span className="font-bold text-gray-700 block">
                {transactionTypeLabel(tx.transaction_type)}
              </span>
              <span className="text-xs text-gray-400 block truncate">{tx.description}</span>
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <span className={`font-bold tabular-nums ${visual.amountClass}`} dir="ltr">
            {formatSignedAmount(tx.amount, tx.direction, tx.currency)}
          </span>
        </td>
        <td className="px-6 py-4 text-gray-500 whitespace-nowrap text-xs">
          {tx.created_at ? formatFinanceDateTime(tx.created_at, locale) : '—'}
        </td>
        <td className="px-6 py-4">
          <span
            className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
              tx.status === 'scheduled'
                ? 'bg-amber-100 text-amber-800'
                : tx.status === 'cancelled'
                  ? 'bg-gray-100 text-gray-600'
                  : 'bg-green-100 text-green-700'
            }`}
          >
            {statusLabel(tx.status)}
          </span>
        </td>
      </tr>
    );
  };

  if (summaryLoading || analyticsLoading) {
    return <LoadingState className="min-h-96" />;
  }

  if (summaryError || !summary) {
    return (
      <ErrorState
        message={t('providerDashboard.finance.loadError')}
        error={summaryErr as Error}
        onRetry={() => {
          void refetchSummary();
          void refetchAnalytics();
        }}
      />
    );
  }

  const handleExport = async () => {
    try {
      const blob = await downloadReport.mutateAsync();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `provider-finance-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(parseApiError(error, locale).message);
    }
  };

  const handlePayout = async () => {
    if (withdrawBelowMinimum) {
      toast.error(
        t('providerDashboard.finance.withdrawalMinError', { amount: payoutMinimum, currency }),
      );
      return;
    }
    if (!withdrawAmountValid) {
      toast.error(t('providerDashboard.finance.withdrawalMaxError'));
      return;
    }

    try {
      await requestPayout.mutateAsync({
        amount: withdrawValue,
        bank_account_id: bankAccount?.id,
      });
      toast.success(t('providerDashboard.finance.toast.payoutSubmitted'));
      setIsPayoutModalOpen(false);
      setPayoutAmount('');
      void refetchSummary();
      void transactionsQuery.refetch();
    } catch (error) {
      toast.error(parseApiError(error, locale).message);
    }
  };

  return (
    <div className="relative space-y-6 animate-in fade-in duration-300" dir={dir}>
      {downloadReport.isPending && <PageLoadingOverlay />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-diyar-dark">
            {t('providerDashboard.finance.title')}
          </h2>
          <p className="text-gray-500 text-sm mt-1">{t('providerDashboard.finance.subtitle')}</p>
        </div>

        <button
          type="button"
          onClick={() => void handleExport()}
          disabled={downloadReport.isPending}
          className="border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition shadow-sm bg-white cursor-pointer disabled:opacity-60"
        >
          <Download size={18} />
          {downloadReport.isPending
            ? t('providerDashboard.finance.exporting')
            : t('providerDashboard.finance.export')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-diyar-dark text-white p-6 rounded-2xl shadow-sm relative overflow-hidden md:col-span-1">
          <div className="absolute top-0 inset-e-0 w-32 h-32 bg-white/5 rounded-full translate-x-16 -translate-y-16" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <h3 className="text-white/70 font-medium mb-1 flex items-center gap-2">
                <Wallet size={18} />
                {t('providerDashboard.finance.availableBalance')}
              </h3>
              <div className="flex items-end gap-2 mt-2" dir="ltr">
                <span className="text-4xl font-bold tabular-nums">
                  {formatProviderMoney(summary.available_balance, locale)}
                </span>
                <span className="text-lg text-white/70 mb-1">{currency}</span>
              </div>
              <p className="text-sm text-white/60 mt-3 flex items-center gap-1.5">
                <CheckCircle size={14} />
                {t('providerDashboard.finance.availableHint')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPayoutModalOpen(true)}
              className="w-full mt-6 bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-white/90 transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {t('providerDashboard.finance.requestPayout')}
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-500 font-medium">
                {t('providerDashboard.finance.monthlyGross')}
              </h3>
              <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="flex items-end gap-2" dir="ltr">
              <span className="text-3xl font-bold text-diyar-dark tabular-nums">
                {formatWesternNumber(summary.monthly_gross_earnings)}
              </span>
              <span className="text-sm text-gray-500 mb-1">{currency}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-500 font-medium">
                {t('providerDashboard.finance.monthlyCommission')}
              </h3>
              <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                <ArrowDownRight size={20} />
              </div>
            </div>
            <div className="flex items-end gap-2" dir="ltr">
              <span className="text-3xl font-bold text-red-600 tabular-nums">
                - {formatWesternNumber(summary.monthly_commission)}
              </span>
              <span className="text-sm text-gray-500 mb-1">{currency}</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {t('providerDashboard.finance.commissionHint', {
                percent: summary.commission_percent,
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm min-w-0">
          <h3 className="font-bold text-diyar-dark text-lg mb-4">
            {t('providerDashboard.finance.netChart')}
          </h3>
          {analyticsError ? (
            <ErrorState
              message={t('providerDashboard.finance.chartLoadError')}
              onRetry={() => void refetchAnalytics()}
            />
          ) : chartData.length === 0 ? (
            <div className="flex h-72 items-center justify-center text-sm text-gray-500">
              {t('providerDashboard.finance.chartEmpty')}
            </div>
          ) : (
            <ChartContainer fill minHeight={288}>
              <LineChart data={chartData} margin={{ top: 12, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
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
                  formatter={(value: number) => [
                    `${formatWesternNumber(value)} ${currency}`,
                    t('providerDashboard.finance.netChart'),
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          )}
        </div>

        <div className="bg-linear-to-br from-blue-50 to-sky-50 p-5 sm:p-6 rounded-2xl border border-blue-100 shadow-sm">
          <h3 className="font-bold text-blue-900 mb-2">
            {t('providerDashboard.finance.netEarnings')}
          </h3>
          <p className="text-sm text-blue-700/80 mb-4">
            {t('providerDashboard.finance.netEarningsHint')}
          </p>
          <div className="flex items-center justify-between gap-3 bg-white/60 p-4 rounded-xl">
            <span className="text-2xl font-bold text-blue-700 tabular-nums" dir="ltr">
              {formatWesternNumber(summary.monthly_net_earnings)} {currency}
            </span>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <ArrowUpRight size={20} />
            </div>
          </div>
          {settings?.payout_schedule && (
            <p className="text-xs text-blue-700/70 mt-4">
              {t('providerDashboard.finance.payoutSchedule', {
                min: settings.payout_schedule.min_days,
                max: settings.payout_schedule.max_days,
              })}
            </p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-bold text-diyar-dark">
            {t('providerDashboard.finance.transactionHistory')}
          </h3>
          <div className="relative">
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition cursor-pointer"
            >
              <Filter size={16} />
              {typeFilterLabel(typeFilter)}
            </button>
            {filtersOpen && (
              <div className="absolute top-full mt-2 min-w-45 rounded-xl border border-gray-100 bg-white shadow-lg z-20 p-2 inset-e-0">
                {TYPE_FILTERS.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => {
                      setTypeFilter(filter);
                      resetTransactionPage();
                      setFiltersOpen(false);
                    }}
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
            )}
          </div>
        </div>

        {transactionsQuery.isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={5} columns={4} />
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8">
            <EmptyState title={t('providerDashboard.finance.transactionEmpty')} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" dir={dir}>
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-100 text-xs font-bold">
                <tr>
                  <th className="px-6 py-4 text-start">
                    {t('providerDashboard.finance.tableTransaction')}
                  </th>
                  <th className="px-6 py-4 text-start">
                    {t('providerDashboard.finance.tableAmount')}
                  </th>
                  <th className="px-6 py-4 text-start">
                    {t('providerDashboard.finance.tableDate')}
                  </th>
                  <th className="px-6 py-4 text-start">
                    {t('providerDashboard.finance.tableStatus')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map(renderTransactionRow)}
              </tbody>
            </table>
          </div>
        )}

        {pagination && transactions.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <PaginationBar
              pagination={pagination}
              page={transactionPage}
              perPage={transactionPerPage}
              perPageOptions={[...transactionPerPageOptions]}
              onPageChange={onTransactionPageChange}
              onPerPageChange={onTransactionPerPageChange}
              alwaysShow={pagination.total > 0}
            />
          </div>
        )}
      </div>

      {isPayoutModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            setIsPayoutModalOpen(false);
            setPayoutAmount('');
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
                  {t('providerDashboard.finance.payoutModal.title')}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {t('providerDashboard.finance.availableHint')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPayoutModalOpen(false);
                  setPayoutAmount('');
                }}
                className="shrink-0 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
                aria-label={t('common.close')}
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-5 rounded-xl bg-blue-50 border border-blue-600/10 p-4">
                <p className="text-xs text-gray-500 mb-1">
                  {t('providerDashboard.finance.payoutModal.available')}
                </p>
                <p className="text-2xl font-bold text-diyar-dark tabular-nums" dir="ltr">
                  {formatProviderMoney(summary.available_balance, locale)} {currency}
                </p>
              </div>

              {bankAccount ? (
                <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm">
                  <p className="font-bold text-diyar-dark mb-1">
                    {t('providerDashboard.finance.payoutModal.bankAccount')}
                  </p>
                  <p className="text-gray-600" dir="ltr">
                    {t(`providerDashboard.settings.banks.${bankAccount.bank_code}`)} —{' '}
                    {bankAccount.iban_masked}
                  </p>
                  <Link
                    to="/dashboard/service/settings?tab=account"
                    className="mt-2 inline-block text-blue-600 text-sm font-bold hover:underline cursor-pointer"
                  >
                    {t('providerDashboard.finance.payoutModal.manageBank')}
                  </Link>
                </div>
              ) : (
                <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                  {t('providerDashboard.finance.payoutModal.noBankAccount')}{' '}
                  <Link
                    to="/dashboard/service/settings?tab=account"
                    className="font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    {t('providerDashboard.finance.payoutModal.manageBank')}
                  </Link>
                </div>
              )}

              <label className="block text-sm font-bold text-gray-700 mb-2 text-start">
                {t('providerDashboard.finance.payoutModal.amount')}
              </label>
              <div className="flex items-center rounded-xl border border-gray-200 mb-1 overflow-hidden focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600">
                <input
                  type="number"
                  min={payoutMinimum}
                  max={availableBalance}
                  step="0.01"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 min-w-0 border-0 px-4 py-3 focus:outline-none focus:ring-0 tabular-nums"
                  dir="ltr"
                />
                <span className="px-4 py-3 text-gray-400 text-sm border-s border-gray-200 shrink-0">
                  {currency}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-1">
                {t('providerDashboard.finance.withdrawalMinHint', {
                  amount: payoutMinimum,
                  currency,
                })}
              </p>
              <p className="text-xs text-gray-500 mb-4">
                {t('providerDashboard.finance.withdrawalMaxHint', {
                  amount: formatWesternNumber(availableBalance),
                  currency,
                })}
              </p>
              {withdrawBelowMinimum && (
                <p className="text-xs text-red-600 font-medium mb-4" role="alert">
                  {t('providerDashboard.finance.withdrawalMinError', {
                    amount: payoutMinimum,
                    currency,
                  })}
                </p>
              )}
              {withdrawExceedsBalance && (
                <p className="text-xs text-red-600 font-medium mb-4" role="alert">
                  {t('providerDashboard.finance.withdrawalMaxError')}
                </p>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsPayoutModalOpen(false);
                    setPayoutAmount('');
                  }}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  {t('providerDashboard.common.cancel')}
                </button>
                <button
                  type="button"
                  disabled={requestPayout.isPending || !withdrawAmountValid || !bankAccount}
                  onClick={() => void handlePayout()}
                  className="inline-flex items-center justify-center gap-2 min-w-32 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {requestPayout.isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {t('providerDashboard.finance.payoutModal.submitting')}
                    </>
                  ) : (
                    t('providerDashboard.finance.payoutModal.submit')
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
