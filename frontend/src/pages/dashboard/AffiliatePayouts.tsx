import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  History,
  Building2,
  Loader2,
  X,
  Clock,
  Filter,
  ArrowDownRight,
  DollarSign,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartContainer } from '../../components/common/ChartContainer.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { ErrorState } from '../../components/common/ErrorState.tsx';
import { LoadingState } from '../../components/common/LoadingState.tsx';
import { PaginationBar } from '../../components/catalog/PaginationBar.tsx';
import { TableSkeleton } from '../../components/common/TableSkeleton.tsx';
import {
  useAffiliateFinanceTransactions,
  useAffiliatePayouts,
  useAffiliatePlatformConfig,
  useAffiliateReports,
  useAffiliateSettings,
  useRequestAffiliatePayout,
} from '../../hooks/affiliate/useAffiliate.ts';
import { usePaginationState, paginationBarProps } from '../../hooks/usePaginationState.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { formatFinanceDateTime } from '../../lib/formatFinanceDateTime.ts';
import {
  analyticsAxisTickInterval,
  formatAnalyticsAxisLabel,
} from '../../lib/formatAnalyticsAxisLabel.ts';
import { useToast } from '../../hooks/useToast.ts';
import { parseApiError } from '../../utils/errors.ts';
import { AffiliatePlatformHints } from '../../components/affiliate/AffiliatePlatformHints.tsx';
import type { AffiliateFinanceTransaction, AffiliateReportPeriod } from '../../types/affiliate.ts';

const PERIOD_OPTIONS: AffiliateReportPeriod[] = ['day', 'week', 'month', '3m', '6m', '12m', 'year'];
const TYPE_FILTERS = ['all', 'commission', 'payout'] as const;
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

  if (
    type === 'platform_commission' ||
    type === 'affiliate_commission_reversal' ||
    direction === 'debit'
  ) {
    return {
      icon: ArrowDownRight,
      iconClass: 'text-red-600',
      bgClass: 'bg-red-50',
      amountClass: 'text-red-600',
    };
  }

  return {
    icon: DollarSign,
    iconClass: 'text-green-600',
    bgClass: 'bg-green-50',
    amountClass: 'text-green-600',
  };
}

export default function AffiliatePayouts() {
  const { t, locale, dir } = useLocale();
  const { toast } = useToast();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [period, setPeriod] = useState<AffiliateReportPeriod>('month');
  const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { page, perPage, perPageOptions, onPageChange, onPerPageChange, resetPage } =
    usePaginationState({
      initialPerPage: 10,
    });

  const payoutsQuery = useAffiliatePayouts(1, 1, period);
  const transactionsQuery = useAffiliateFinanceTransactions(page, perPage, typeFilter, period);
  const reportsQuery = useAffiliateReports(period);
  const platformQuery = useAffiliatePlatformConfig();
  const settingsQuery = useAffiliateSettings();
  const requestPayout = useRequestAffiliatePayout();

  const balance = payoutsQuery.data?.balance;
  const transactions = transactionsQuery.data?.transactions ?? [];
  const pagination = transactionsQuery.data?.pagination;
  const minimumPayout = Number(balance?.payout_minimum ?? 100);
  const currency = balance?.currency ?? t('common.currency');
  const availableBalance = Number(balance?.available ?? 0);
  const withdrawValue = Number(withdrawAmount);
  const hasBank = Boolean(settingsQuery.data?.payout_iban);
  const payoutSchedule = platformQuery.data?.payout_schedule;
  const withdrawBelowMinimum =
    withdrawAmount !== '' && Number.isFinite(withdrawValue) && withdrawValue < minimumPayout;
  const withdrawExceedsBalance =
    withdrawAmount !== '' && Number.isFinite(withdrawValue) && withdrawValue > availableBalance;
  const withdrawAmountValid =
    withdrawAmount !== '' &&
    Number.isFinite(withdrawValue) &&
    withdrawValue >= minimumPayout &&
    withdrawValue <= availableBalance;

  const earningsLabel = t('affiliate.payouts.earningsChart');
  const chartGranularity =
    period === 'week' ? 'weekday' : (reportsQuery.data?.period?.granularity ?? 'day');

  const chartData = useMemo(
    () =>
      (reportsQuery.data?.daily ?? []).map((row) => ({
        name: row.date,
        [earningsLabel]: Number(row.earnings),
      })),
    [reportsQuery.data?.daily, earningsLabel],
  );

  const payoutStatusLabel = useMemo(
    () => (status: AffiliateFinanceTransaction['status']) => {
      if (status === 'scheduled') return t('affiliate.payouts.transactionScheduled');
      if (status === 'cancelled') return t('affiliate.payouts.transactionCancelled');
      return t('affiliate.payouts.transactionCompleted');
    },
    [t],
  );

  const typeFilterLabel = (filter: TransactionTypeFilter) => {
    const map: Record<TransactionTypeFilter, string> = {
      all: t('affiliate.payouts.filterAll'),
      commission: t('affiliate.payouts.filterCommission'),
      payout: t('affiliate.payouts.filterPayout'),
    };
    return map[filter];
  };

  const transactionTypeLabel = (type: string) => {
    if (type === 'affiliate_commission') return t('affiliate.payouts.types.affiliate_commission');
    if (type === 'affiliate_commission_reversal') {
      return t('affiliate.payouts.types.affiliate_commission_reversal');
    }
    if (type === 'platform_commission') return t('affiliate.payouts.types.platform_commission');
    if (type === 'payout') return t('affiliate.payouts.types.payout');
    return type;
  };

  const periodLabel = (value: AffiliateReportPeriod) => {
    const map: Record<AffiliateReportPeriod, string> = {
      day: t('affiliate.reports.periodDay'),
      week: t('affiliate.reports.periodWeek'),
      month: t('affiliate.reports.periodMonth'),
      '3m': t('affiliate.reports.period3m'),
      '6m': t('affiliate.reports.period6m'),
      '12m': t('affiliate.reports.period12m'),
      year: t('affiliate.reports.periodYear'),
    };
    return map[value];
  };

  const closeWithdrawModal = () => {
    setWithdrawOpen(false);
    setWithdrawAmount('');
  };

  const handleRequestPayout = async () => {
    if (withdrawBelowMinimum) {
      toast.error(t('affiliate.payouts.withdrawalMinError', { amount: minimumPayout, currency }));
      return;
    }

    if (!withdrawAmountValid) {
      toast.error(t('affiliate.payouts.withdrawalMaxError'));
      return;
    }

    if (!hasBank) {
      toast.error(t('affiliate.payouts.noBankAccount'));
      return;
    }

    try {
      await requestPayout.mutateAsync({
        amount: withdrawValue.toFixed(2),
        idempotencyKey: crypto.randomUUID(),
      });
      toast.success(t('affiliate.payoutRequested'));
      closeWithdrawModal();
    } catch (error) {
      toast.error(parseApiError(error, locale).message);
    }
  };

  if (payoutsQuery.isLoading || settingsQuery.isLoading) {
    return <LoadingState className="min-h-60" />;
  }

  if (payoutsQuery.isError || !payoutsQuery.data) {
    return (
      <ErrorState
        message={t('affiliate.payouts.loadError')}
        onRetry={() => void payoutsQuery.refetch()}
      />
    );
  }

  const profile = settingsQuery.data;
  const platformCommissionActive = Boolean(balance?.platform_commission_active);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-diyar-dark">{t('affiliate.payouts.title')}</h2>
          <p className="text-gray-500 text-sm mt-1">{t('affiliate.payouts.subtitle')}</p>
        </div>
        <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm overflow-x-auto scrollbar-hide">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setPeriod(option);
                resetPage();
              }}
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
      </div>

      {platformQuery.data ? (
        <AffiliatePlatformHints platform={platformQuery.data} variant="payout" />
      ) : null}

      <div
        className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${platformCommissionActive ? 'xl:grid-cols-4' : 'xl:grid-cols-3'}`}
      >
        <div className="bg-green-600 text-white p-6 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full translate-x-20 -translate-y-20" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <h3 className="text-white/80 font-medium mb-1">
                {t('affiliate.payouts.availableBalance')}
              </h3>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold tabular-nums">
                  {balance?.available ?? '0.00'}
                </span>
                <span className="text-lg text-white/80 pb-1">{currency}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setWithdrawOpen(true)}
              disabled={requestPayout.isPending}
              className="w-full bg-white text-green-600 py-3 rounded-xl font-bold hover:bg-gray-50 transition shadow-sm flex items-center justify-center gap-2 mt-6 disabled:opacity-60 cursor-pointer"
            >
              <Wallet size={18} />
              {t('affiliate.payouts.requestButton')}
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-500 font-medium">{t('affiliate.payouts.pendingBalance')}</h3>
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <Clock size={20} />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-diyar-dark tabular-nums">
                {balance?.pending ?? '0.00'}
              </span>
              <span className="text-sm text-gray-500 pb-1">{currency}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4">{t('affiliate.payouts.pendingHint')}</p>
        </div>

        {platformCommissionActive ? (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-500 font-medium">
                  {t('affiliate.payouts.platformCommission')}
                </h3>
                <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                  <ArrowDownRight size={20} />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-red-600 tabular-nums">
                  - {balance?.platform_commission ?? '0.00'}
                </span>
                <span className="text-sm text-gray-500 pb-1">{currency}</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              {t('affiliate.payouts.platformCommissionHint', {
                percent: Number(balance?.platform_commission_rate_percent ?? 0).toFixed(0),
              })}
            </p>
          </div>
        ) : null}

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500 border border-gray-100 shrink-0">
              <Building2 size={24} />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-diyar-dark truncate">
                {profile?.payout_account_holder ?? '—'}
              </h4>
              <p className="text-sm text-gray-500 mt-1" dir="ltr">
                {profile?.payout_iban_masked ?? profile?.payout_iban ?? '—'}
              </p>
            </div>
          </div>
          <Link
            to="/dashboard/affiliate/settings?tab=bank"
            className="text-sm font-bold text-green-600 hover:text-green-700 transition cursor-pointer shrink-0"
          >
            {t('affiliate.payouts.changeAccount')}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm min-w-0">
          <div className="mb-4">
            <h3 className="font-bold text-diyar-dark text-lg">{earningsLabel}</h3>
          </div>
          {reportsQuery.isError ? (
            <ErrorState
              message={t('affiliate.reports.loadError')}
              onRetry={() => void reportsQuery.refetch()}
            />
          ) : reportsQuery.isLoading ? (
            <div className="h-72 flex items-center justify-center text-sm text-gray-400">
              {t('common.loading')}
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-sm text-gray-400">
              {t('affiliate.payouts.chartEmpty')}
            </div>
          ) : (
            <ChartContainer fill minHeight={288}>
              <LineChart data={chartData} margin={{ top: 12, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  interval={analyticsAxisTickInterval(chartData.length)}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  tickFormatter={(value: string) =>
                    formatAnalyticsAxisLabel(value, locale, chartGranularity)
                  }
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
                  formatter={(value: number) => [`${value} ${currency}`, earningsLabel]}
                />
                <Line
                  type="monotone"
                  dataKey={earningsLabel}
                  stroke="#16a34a"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#16a34a', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          )}
        </div>

        <div className="bg-linear-to-br from-amber-50 to-orange-50 p-5 sm:p-6 rounded-2xl border border-amber-100 shadow-sm">
          <h3 className="font-bold text-amber-800 mb-2">
            {t('affiliate.payouts.upcomingPending')}
          </h3>
          <p className="text-sm text-amber-700/80 mb-4">
            {t('affiliate.payouts.upcomingPendingHint')}
          </p>
          <div className="flex items-center justify-between gap-3 bg-white/60 p-4 rounded-xl">
            <span className="text-2xl font-bold text-amber-700 tabular-nums" dir="ltr">
              {balance?.pending ?? '0.00'} {currency}
            </span>
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <Clock size={20} />
            </div>
          </div>
          {payoutSchedule ? (
            <p className="text-xs text-amber-800/70 mt-4 flex items-start gap-2">
              <Clock size={14} className="mt-0.5 shrink-0" />
              {t('affiliate.payouts.payoutSchedule', {
                min: payoutSchedule.min_days,
                max: payoutSchedule.max_days,
              })}
            </p>
          ) : null}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-bold text-diyar-dark flex items-center gap-2">
            <History size={18} className="text-gray-400" />
            {t('affiliate.payouts.historyTitle')}
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
            {filtersOpen ? (
              <div className="absolute top-full mt-2 min-w-45 rounded-xl border border-gray-100 bg-white shadow-lg z-20 p-2 inset-e-0">
                {TYPE_FILTERS.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => {
                      setTypeFilter(filter);
                      onPageChange(1);
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
            ) : null}
          </div>
        </div>
        {transactionsQuery.isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={5} columns={4} />
          </div>
        ) : transactionsQuery.isError ? (
          <div className="p-6">
            <ErrorState
              message={t('affiliate.payouts.loadError')}
              onRetry={() => void transactionsQuery.refetch()}
            />
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title={t('affiliate.payouts.transactionEmpty')}
              description={t('affiliate.payouts.transactionEmptyHint')}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" dir={dir}>
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-100 text-xs font-bold">
                <tr>
                  <th className="px-6 py-4 text-start">
                    {t('affiliate.payouts.tableTransaction')}
                  </th>
                  <th className="px-6 py-4 text-start">{t('affiliate.payouts.tableAmount')}</th>
                  <th className="px-6 py-4 text-start">{t('affiliate.payouts.tableDate')}</th>
                  <th className="px-6 py-4 text-start">{t('affiliate.payouts.tableStatus')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((tx) => {
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
                          <div className="min-w-0">
                            <span className="font-bold text-gray-700 block">
                              {transactionTypeLabel(tx.transaction_type)}
                            </span>
                            <span className="text-xs text-gray-400 block truncate">
                              {tx.description}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-start">
                        <span
                          className={`font-bold tabular-nums inline-block [unicode-bidi:isolate] ${visual.amountClass}`}
                          dir="ltr"
                        >
                          {tx.direction === 'credit'
                            ? t('affiliate.payouts.signedCredit', {
                                amount: tx.amount,
                                currency: tx.currency,
                              })
                            : t('affiliate.payouts.signedDebit', {
                                amount: tx.amount,
                                currency: tx.currency,
                              })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-start text-gray-500 whitespace-nowrap text-xs">
                        {tx.created_at ? formatFinanceDateTime(tx.created_at, locale) : '—'}
                      </td>
                      <td className="px-6 py-4 text-start">
                        <span
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                            tx.status === 'scheduled'
                              ? 'bg-amber-100 text-amber-800'
                              : tx.status === 'cancelled'
                                ? 'bg-gray-100 text-gray-600'
                                : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {payoutStatusLabel(tx.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {pagination && transactions.length > 0 ? (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <PaginationBar
              {...paginationBarProps(pagination, {
                page,
                perPage,
                perPageOptions,
                onPageChange,
                onPerPageChange,
              })}
            />
          </div>
        ) : null}
      </div>

      {withdrawOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeWithdrawModal}
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
                  {t('affiliate.payouts.modalTitle')}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{t('affiliate.payouts.available')}</p>
              </div>
              <button
                type="button"
                onClick={closeWithdrawModal}
                className="shrink-0 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
                aria-label={t('common.close')}
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-5 rounded-xl bg-green-50 border border-green-600/10 p-4">
                <p className="text-xs text-gray-500 mb-1">{t('affiliate.payouts.available')}</p>
                <p className="text-2xl font-bold text-diyar-dark tabular-nums" dir="ltr">
                  {balance?.available ?? '0.00'} {currency}
                </p>
              </div>

              {hasBank ? (
                <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm">
                  <p className="font-bold text-diyar-dark mb-1">
                    {t('affiliate.payouts.bankAccount')}
                  </p>
                  <p className="text-gray-600" dir="ltr">
                    {profile?.payout_iban_masked ?? profile?.payout_iban}
                  </p>
                  <Link
                    to="/dashboard/affiliate/settings?tab=bank"
                    className="mt-2 inline-block text-green-600 text-sm font-bold hover:underline cursor-pointer"
                  >
                    {t('affiliate.payouts.manageBank')}
                  </Link>
                </div>
              ) : (
                <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
                  {t('affiliate.payouts.noBankAccount')}{' '}
                  <Link
                    to="/dashboard/affiliate/settings?tab=bank"
                    className="font-bold text-green-700 hover:underline cursor-pointer"
                  >
                    {t('affiliate.payouts.manageBank')}
                  </Link>
                </div>
              )}

              <label className="block text-sm font-bold text-gray-700 mb-2 text-start">
                {t('affiliate.payouts.amount')}
              </label>
              <div className="flex items-center rounded-xl border border-gray-200 mb-1 overflow-hidden focus-within:border-green-600 focus-within:ring-1 focus-within:ring-green-600">
                <input
                  type="number"
                  min={minimumPayout}
                  max={availableBalance}
                  step="0.01"
                  value={withdrawAmount}
                  onChange={(event) => setWithdrawAmount(event.target.value)}
                  placeholder="0.00"
                  className="flex-1 min-w-0 border-0 px-4 py-3 focus:outline-none focus:ring-0 tabular-nums"
                  dir="ltr"
                />
                <span className="px-4 py-3 text-gray-400 text-sm border-s border-gray-200 shrink-0">
                  {currency}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-1">
                {t('affiliate.payouts.withdrawalMinHint', {
                  amount: minimumPayout,
                  currency,
                })}
              </p>
              <p className="text-xs text-gray-500 mb-4">
                {t('affiliate.payouts.withdrawalMaxHint', {
                  amount: availableBalance,
                  currency,
                })}
              </p>
              {withdrawBelowMinimum && (
                <p className="text-xs text-red-600 font-medium mb-4" role="alert">
                  {t('affiliate.payouts.withdrawalMinError', {
                    amount: minimumPayout,
                    currency,
                  })}
                </p>
              )}
              {withdrawExceedsBalance && (
                <p className="text-xs text-red-600 font-medium mb-4" role="alert">
                  {t('affiliate.payouts.withdrawalMaxError')}
                </p>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeWithdrawModal}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  disabled={requestPayout.isPending || !withdrawAmountValid || !hasBank}
                  onClick={() => void handleRequestPayout()}
                  className="inline-flex items-center justify-center gap-2 min-w-32 px-5 py-2.5 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {requestPayout.isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {t('affiliate.payouts.submitting')}
                    </>
                  ) : (
                    t('affiliate.payouts.submit')
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
