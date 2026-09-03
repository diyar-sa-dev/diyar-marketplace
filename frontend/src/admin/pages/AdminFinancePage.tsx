import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownRight,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Eye,
  Loader2,
  TrendingUp,
  Wallet,
  XCircle,
} from 'lucide-react';
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import { adminApi } from '../../api/client.ts';
import { confirmRejectPayout } from '../../lib/confirmDialog.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { formatLocaleDateTime, intlLocaleTag } from '../../lib/intlLocale.ts';
import {
  analyticsAxisTickInterval,
  formatAnalyticsAxisLabel,
} from '../../lib/formatAnalyticsAxisLabel.ts';
import { useToast } from '../../hooks/useToast.ts';
import { ChartContainer } from '../../components/common/ChartContainer.tsx';
import { adminQueryKey } from '../../lib/auth/queryKeys.ts';
import {
  downloadAdminFinanceReport,
  fetchAdminFinanceReport,
  type AdminFinancePeriod,
} from '../api/adminFinance.ts';
import { AdminPayoutDetailModal } from '../components/AdminPayoutDetailModal.tsx';
import { TableLtrValue } from '../../components/common/TableLtrValue.tsx';
import { AdminResourceTable } from '../components/AdminResourceTable.tsx';
import { AdminStatusBadge } from '../components/AdminStatusBadge.tsx';
import { AdminTablePagination } from '../components/AdminTablePagination.tsx';
import { DetailTabs } from '../components/DetailTabs.tsx';
import { PermissionGate } from '../components/PermissionGate.tsx';
import { useAdminListQuery } from '../hooks/useAdminListQuery.ts';
import { useAdminAuth } from '../auth/AdminAuthContext.tsx';
import { invalidateAdminResource, syncAdminPayoutStatus } from '../utils/adminQueryCache.ts';
import {
  FINANCIAL_TRANSACTION_TYPES,
  ledgerAmountClass,
  ledgerRowAccentClass,
  ledgerTransactionTone,
  ledgerTypeBadgeClass,
  localizedTransactionType,
} from '../utils/localizedTransactionType.ts';
import type {
  AdminAffiliatePayout,
  AdminPayoutKind,
  AdminPayoutRow,
  AdminProviderPayout,
  AdminVendorPayout,
  PayoutAction,
} from '../types/payouts.ts';

type Transaction = {
  id: string;
  reference?: string | null;
  transaction_type: string;
  amount: string;
  currency?: string;
  direction?: 'credit' | 'debit' | string | null;
  created_at?: string;
};

const FILTER_SELECT =
  'rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition hover:border-diyar-brown focus:border-diyar-brown cursor-pointer';

function shortLedgerReference(row: Transaction): string {
  const raw = row.reference?.trim() || row.id || '';
  if (!raw) {
    return '—';
  }

  return raw.length > 12 ? `${raw.slice(0, 8)}…` : raw;
}

function formatLedgerAmount(amount: string, direction?: string | null): string {
  if (direction === 'debit') {
    return `− ${amount}`;
  }

  if (direction === 'credit') {
    return `+ ${amount}`;
  }

  return amount;
}

const PERIOD_OPTIONS: AdminFinancePeriod[] = ['day', 'week', 'month', '3m', '6m', '12m', 'year'];

function payoutStatusForAction(action: PayoutAction): string {
  switch (action) {
    case 'approve':
      return 'approved';
    case 'reject':
      return 'rejected';
    case 'mark-paid':
      return 'paid';
    case 'mark-processing':
      return 'processing';
    default:
      return 'pending';
  }
}

function payoutResourceKey(kind: AdminPayoutKind): string {
  if (kind === 'vendor') return 'admin-vendor-payouts';
  if (kind === 'provider') return 'admin-provider-payouts';
  return 'admin-affiliate-payouts';
}

function payoutRecipientName(payout: AdminPayoutRow, kind: AdminPayoutKind): string {
  if (kind === 'vendor') {
    return (payout as AdminVendorPayout).vendor?.business_name ?? '—';
  }
  if (kind === 'provider') {
    return (payout as AdminProviderPayout).provider?.business_name ?? '—';
  }
  const affiliate = (payout as AdminAffiliatePayout).affiliate;
  return affiliate?.display_name ?? affiliate?.owner?.name ?? '—';
}

function formatShortDate(value?: string | null, locale?: string): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(locale ? intlLocaleTag(locale) : undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AdminFinancePage() {
  const { t, locale } = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, hasPermission } = useAdminAuth();
  const canViewBalances = hasPermission('balances.view');
  const canViewPayouts = hasPermission('payouts.view');
  const [section, setSection] = useState<'vendor' | 'provider' | 'affiliate' | 'ledger'>('vendor');
  const [selectedPayout, setSelectedPayout] = useState<AdminPayoutRow | null>(null);
  const [period, setPeriod] = useState<AdminFinancePeriod>('month');

  const financeReportQuery = useQuery({
    queryKey: adminQueryKey('admin-finance-summary', period),
    queryFn: () => fetchAdminFinanceReport(period),
    enabled: isAuthenticated && canViewBalances,
    retry: false,
  });

  const downloadReport = useMutation({
    mutationFn: () => downloadAdminFinanceReport(period),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `platform-finance-${period}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    },
    onError: () => toast.error(t('admin.finance.loadError')),
  });

  const listConfig = useMemo(() => {
    if (section === 'ledger') {
      return {
        endpoint: '/admin/transactions',
        itemsKey: 'transactions',
        resourceKey: 'admin-ledger',
      };
    }
    if (section === 'affiliate') {
      return {
        endpoint: '/admin/affiliate/payouts',
        itemsKey: 'payouts',
        resourceKey: 'admin-affiliate-payouts',
      };
    }
    if (section === 'provider') {
      return {
        endpoint: '/admin/provider/payouts',
        itemsKey: 'payouts',
        resourceKey: 'admin-provider-payouts',
      };
    }
    return { endpoint: '/admin/payouts', itemsKey: 'payouts', resourceKey: 'admin-vendor-payouts' };
  }, [section]);

  const listQuery = useAdminListQuery<AdminPayoutRow | Transaction>({
    resourceKey: listConfig.resourceKey,
    endpoint: listConfig.endpoint,
    itemsKey: listConfig.itemsKey,
    paramFilterKey: section === 'ledger' ? 'transaction_type' : undefined,
    enabled: isAuthenticated && (section === 'ledger' ? canViewBalances : canViewPayouts),
  });

  const payoutKind: AdminPayoutKind =
    section === 'affiliate' ? 'affiliate' : section === 'provider' ? 'provider' : 'vendor';

  const payoutMutation = useMutation({
    mutationFn: async ({
      kind,
      payoutId,
      action,
      reason,
    }: {
      kind: AdminPayoutKind;
      payoutId: string;
      action: PayoutAction;
      reason?: string;
    }) => {
      const base =
        kind === 'vendor'
          ? `/admin/payouts/${payoutId}`
          : kind === 'provider'
            ? `/admin/provider/payouts/${payoutId}`
            : `/admin/affiliate/payouts/${payoutId}`;
      if (action === 'reject') {
        await adminApi.post(`${base}/reject`, { reason });
        return;
      }
      const actionPath = action === 'mark-processing' ? 'processing' : action;
      await adminApi.post(`${base}/${actionPath}`);
    },
    onSuccess: async (_data, variables) => {
      const status = payoutStatusForAction(variables.action);
      syncAdminPayoutStatus(queryClient, variables.kind, variables.payoutId, status);
      setSelectedPayout((current) =>
        current?.id === variables.payoutId ? { ...current, status } : current,
      );
      toast.success(t('admin.payouts.updated'));
      await invalidateAdminResource(queryClient, payoutResourceKey(variables.kind));
      await queryClient.invalidateQueries({ queryKey: adminQueryKey('admin-finance-summary') });
    },
    onError: () => toast.error(t('admin.payouts.updateError')),
  });

  const handlePayoutAction = async (action: PayoutAction) => {
    if (!selectedPayout) return;

    if (action === 'reject') {
      const reason = await confirmRejectPayout(t);
      if (!reason) return;
      payoutMutation.mutate({
        kind: payoutKind,
        payoutId: selectedPayout.id,
        action,
        reason,
      });
      return;
    }

    payoutMutation.mutate({
      kind: payoutKind,
      payoutId: selectedPayout.id,
      action,
    });
  };

  const items = listQuery.data?.items ?? [];
  const meta = listQuery.data?.meta;
  const isLedger = section === 'ledger';
  const showListSkeleton = listQuery.isLoading || (listQuery.isFetching && items.length === 0);
  const isSearching = listQuery.isFetching && listQuery.search.trim().length > 0;
  const report = financeReportQuery.data;
  const summary = report?.summary;
  const currency = summary?.currency ?? 'SAR';
  const chartGranularity = report?.period.granularity ?? 'day';
  const grossSeriesKey = t('admin.finance.seriesGross');
  const commissionSeriesKey = t('admin.finance.seriesCommission');
  const netSeriesKey = t('admin.finance.seriesNet');
  const chartData = useMemo(
    () =>
      (report?.series ?? []).map((point) => ({
        name: point.label,
        [grossSeriesKey]: Number(point.gross_sales),
        [commissionSeriesKey]: Number(point.platform_commission),
        [netSeriesKey]: Number(point.net_earnings),
      })),
    [report?.series, grossSeriesKey, commissionSeriesKey, netSeriesKey],
  );
  const hasChartValues = chartData.some(
    (point) =>
      Number(point[grossSeriesKey]) > 0 ||
      Number(point[commissionSeriesKey]) > 0 ||
      Number(point[netSeriesKey]) > 0,
  );

  const periodLabel = (value: AdminFinancePeriod) => {
    const map: Record<AdminFinancePeriod, string> = {
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

  const tabs = [
    { id: 'vendor', label: t('admin.finance.vendorPayouts') },
    { id: 'provider', label: t('admin.finance.providerPayouts') },
    { id: 'affiliate', label: t('admin.finance.affiliatePayouts') },
    { id: 'ledger', label: t('admin.finance.ledger') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-diyar-dark">{t('admin.nav.finance')}</h2>
          <p className="mt-1 text-sm text-gray-500">{t('admin.finance.subtitle')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm overflow-x-auto scrollbar-hide">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setPeriod(option)}
                className={`rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition cursor-pointer whitespace-nowrap ${
                  period === option
                    ? 'bg-gray-100 font-bold text-diyar-dark'
                    : 'text-gray-500 hover:text-diyar-dark'
                }`}
              >
                {periodLabel(option)}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => downloadReport.mutate()}
            disabled={downloadReport.isPending}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-600 shadow-sm transition hover:bg-gray-50 disabled:opacity-60 cursor-pointer"
          >
            <Download size={18} />
            {downloadReport.isPending
              ? t('admin.finance.exporting')
              : t('admin.finance.exportReport')}
          </button>
        </div>
      </div>

      {financeReportQuery.isError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {t('admin.finance.loadError')}
        </div>
      ) : null}

      {summary ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="relative overflow-hidden rounded-2xl bg-diyar-dark p-6 text-white shadow-sm md:col-span-2">
            <div className="absolute top-0 right-0 h-40 w-40 translate-x-16 -translate-y-16 rounded-full bg-white/5" />
            <div className="relative z-10">
              <h3 className="mb-1 flex items-center gap-2 font-medium text-white/70">
                <Wallet size={18} />
                {t('admin.finance.platformEarnings')}
              </h3>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-5xl font-bold tabular-nums">{summary.platform_earnings}</span>
                <span className="mb-1 text-xl text-white/70">{currency}</span>
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-sm text-white/60">
                <CheckCircle size={14} />
                {t('admin.finance.platformEarningsHint')}
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-medium text-gray-500">{t('admin.finance.grossSales')}</h3>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                  <TrendingUp size={20} />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-diyar-dark tabular-nums">
                  {summary.gross_sales}
                </span>
                <span className="mb-1 text-sm text-gray-400">{currency}</span>
              </div>
              <p className="mt-2 text-xs text-gray-400">{t('admin.finance.grossSalesHint')}</p>
            </div>
            <div className="mt-4 flex w-fit items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-sm font-medium text-amber-700">
              <Clock size={14} />
              <span>
                {t('admin.finance.pendingEscrow')}: {summary.pending_escrow} {currency}
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-medium text-gray-500">
                  {t('admin.finance.platformCommission')}
                </h3>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <ArrowDownRight size={20} />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-diyar-dark tabular-nums">
                  {summary.platform_commission}
                </span>
                <span className="mb-1 text-sm text-gray-400">{currency}</span>
              </div>
            </div>
            <div className="mt-4 space-y-1 text-sm text-gray-500">
              <p>
                {t('admin.finance.netEarnings')}:{' '}
                <span className="font-bold text-diyar-dark">{summary.net_earnings}</span> {currency}
              </p>
              <p className="text-xs text-gray-400">{t('admin.finance.netEarningsHint')}</p>
            </div>
          </div>
        </div>
      ) : financeReportQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className={`h-40 animate-pulse rounded-2xl bg-gray-100 ${index === 0 ? 'md:col-span-2' : ''}`}
            />
          ))}
        </div>
      ) : null}

      {summary ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs text-gray-500">{t('admin.finance.affiliateCommission')}</p>
            <p className="mt-1 text-xl font-bold text-diyar-dark tabular-nums" dir="ltr">
              {summary.affiliate_commission} {currency}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs text-gray-500">{t('admin.finance.pendingVendorPayouts')}</p>
            <p className="mt-1 text-xl font-bold text-diyar-dark tabular-nums" dir="ltr">
              {summary.pending_vendor_payouts} {currency}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs text-gray-500">{t('admin.finance.pendingProviderPayouts')}</p>
            <p className="mt-1 text-xl font-bold text-diyar-dark tabular-nums" dir="ltr">
              {summary.pending_provider_payouts} {currency}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs text-gray-500">{t('admin.finance.pendingAffiliatePayouts')}</p>
            <p className="mt-1 text-xl font-bold text-diyar-dark tabular-nums" dir="ltr">
              {summary.pending_affiliate_payouts} {currency}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs text-gray-500">{t('admin.finance.periodSummaryTitle')}</p>
            <p className="mt-1 text-sm font-semibold text-diyar-dark">
              {report?.orders.completed ?? 0} {t('vendor.finance.completedOrders')}
            </p>
          </div>
        </div>
      ) : null}

      {summary ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-diyar-dark">{t('admin.finance.chartTitle')}</h3>
              <p className="mt-1 text-xs text-gray-500">{periodLabel(period)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-diyar-dark" />
                {grossSeriesKey}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-diyar-brown" />
                {commissionSeriesKey}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                {netSeriesKey}
              </span>
            </div>
          </div>
          {financeReportQuery.isFetching && chartData.length === 0 ? (
            <div className="flex h-72 items-center justify-center">
              <Loader2 className="animate-spin text-diyar-brown" size={28} />
            </div>
          ) : !hasChartValues ? (
            <div className="flex h-72 items-center justify-center text-sm text-gray-500">
              {t('admin.finance.chartEmpty')}
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
                  interval={analyticsAxisTickInterval(chartData.length)}
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
                  labelFormatter={(label) =>
                    formatAnalyticsAxisLabel(String(label), locale, chartGranularity)
                  }
                  formatter={(value: number, name: string) => [`${value} ${currency}`, name]}
                />
                <Line
                  name={grossSeriesKey}
                  type="monotone"
                  dataKey={grossSeriesKey}
                  stroke="#1f3d3a"
                  strokeWidth={3}
                  dot={{ r: 3, fill: '#1f3d3a', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  name={commissionSeriesKey}
                  type="monotone"
                  dataKey={commissionSeriesKey}
                  stroke="#947961"
                  strokeWidth={3}
                  dot={{ r: 3, fill: '#947961', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  name={netSeriesKey}
                  type="monotone"
                  dataKey={netSeriesKey}
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ChartContainer>
          )}
        </div>
      ) : null}

      <DetailTabs
        tabs={tabs}
        activeTab={section}
        onChange={(id) => {
          setSection(id as typeof section);
          setSelectedPayout(null);
          listQuery.setPage(1);
        }}
      />

      <AdminResourceTable
        title={
          isLedger
            ? t('admin.finance.ledger')
            : section === 'vendor'
              ? t('admin.finance.vendorPayouts')
              : section === 'provider'
                ? t('admin.finance.providerPayouts')
                : t('admin.finance.affiliatePayouts')
        }
        subtitle={isLedger ? t('admin.transactions.subtitle') : t('admin.payouts.subtitle')}
        searchValue={listQuery.search}
        onSearchChange={listQuery.setSearch}
        searchPlaceholder={
          isLedger ? t('admin.tables.searchTransactions') : t('admin.tables.searchPayouts')
        }
        filters={
          isLedger ? (
            <select
              value={listQuery.paramFilter}
              onChange={(event) => listQuery.setParamFilter(event.target.value)}
              className={FILTER_SELECT}
            >
              <option value="">{t('admin.finance.allTypes')}</option>
              {FINANCIAL_TRANSACTION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {localizedTransactionType(type, t)}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={listQuery.statusFilter}
              onChange={(event) => listQuery.setStatusFilter(event.target.value)}
              className={FILTER_SELECT}
            >
              <option value="">{t('admin.tables.allStatuses')}</option>
              <option value="pending">{t('admin.tables.pending')}</option>
              <option value="approved">{t('admin.tables.approved')}</option>
              <option value="processing">{t('admin.status.processing')}</option>
              <option value="paid">{t('admin.tables.paid')}</option>
              <option value="rejected">{t('admin.tables.rejected')}</option>
            </select>
          )
        }
        actions={
          isSearching ? (
            <span className="inline-flex items-center gap-2 text-xs text-gray-500">
              <Loader2 size={14} className="animate-spin" />
              {t('admin.tables.searching')}
            </span>
          ) : null
        }
        isLoading={showListSkeleton}
        isError={listQuery.isError}
        isEmpty={!showListSkeleton && items.length === 0}
        emptyTitle={isLedger ? t('admin.finance.ledgerEmpty') : t('admin.payouts.empty')}
        columns={
          isLedger ? (
            <tr>
              <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                {t('admin.tables.reference')}
              </th>
              <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                {t('admin.tables.type')}
              </th>
              <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                {t('admin.tables.amount')}
              </th>
              <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                {t('admin.tables.createdAt')}
              </th>
            </tr>
          ) : (
            <tr>
              <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                {t('admin.payouts.reference')}
              </th>
              <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                {t('admin.payouts.recipient')}
              </th>
              <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                {t('admin.tables.amount')}
              </th>
              <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                {t('admin.payouts.requestedAt')}
              </th>
              <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                {t('admin.tables.status')}
              </th>
              <th className="px-4 py-3 text-end text-xs font-bold uppercase tracking-wide text-gray-500">
                {t('admin.tables.actions')}
              </th>
            </tr>
          )
        }
        footer={
          <AdminTablePagination
            meta={meta}
            page={listQuery.page}
            onPageChange={listQuery.setPage}
            perPage={listQuery.perPage}
            onPerPageChange={listQuery.setPerPage}
            isLoading={listQuery.isFetching}
          />
        }
      >
        {isLedger
          ? items.map((tx) => {
              const row = tx as Transaction;
              const tone = ledgerTransactionTone(row.transaction_type, row.direction);
              const amountTone =
                row.direction === 'debit' ? 'debit' : row.direction === 'credit' ? 'credit' : tone;
              return (
                <tr key={row.id} className="hover:bg-[#f7f4f1]/50 transition-colors">
                  <td
                    className={`px-4 py-3 text-start ${ledgerRowAccentClass(amountTone)}`}
                    title={row.reference ?? row.id}
                  >
                    <TableLtrValue className="font-mono text-xs font-semibold text-gray-600">
                      {shortLedgerReference(row)}
                    </TableLtrValue>
                  </td>
                  <td className="px-4 py-3 text-start">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${ledgerTypeBadgeClass(tone)}`}
                    >
                      {localizedTransactionType(row.transaction_type, t)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-start">
                    <TableLtrValue
                      className={`text-sm font-extrabold tabular-nums ${ledgerAmountClass(amountTone)}`}
                    >
                      {formatLedgerAmount(row.amount, row.direction)} {row.currency ?? 'SAR'}
                    </TableLtrValue>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {row.created_at ? formatLocaleDateTime(row.created_at, locale) : '—'}
                  </td>
                </tr>
              );
            })
          : items.map((payout) => {
              const row = payout as AdminPayoutRow;
              const kind = section as AdminPayoutKind;
              return (
                <tr
                  key={row.id}
                  className="hover:bg-[#f7f4f1]/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedPayout(row)}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-semibold text-diyar-dark" dir="ltr">
                      {row.reference}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-diyar-dark">
                      {payoutRecipientName(row, kind)}
                    </p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5" dir="ltr">
                      {row.id.slice(0, 8)}…
                    </p>
                  </td>
                  <td className="px-4 py-3 text-start font-extrabold text-diyar-brown">
                    <TableLtrValue>
                      {row.amount} {row.currency ?? 'SAR'}
                    </TableLtrValue>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatShortDate(row.requested_at, locale)}
                  </td>
                  <td className="px-4 py-3">
                    <AdminStatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className="flex justify-end gap-1"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedPayout(row)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:border-diyar-brown hover:text-diyar-brown cursor-pointer"
                      >
                        <Eye size={14} />
                        <span className="hidden sm:inline">{t('admin.tables.view')}</span>
                      </button>

                      {row.status === 'pending' ? (
                        <PermissionGate permission="payouts.approve">
                          <button
                            type="button"
                            disabled={payoutMutation.isPending}
                            onClick={() =>
                              payoutMutation.mutate({
                                kind,
                                payoutId: row.id,
                                action: 'approve',
                              })
                            }
                            className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 cursor-pointer"
                            aria-label={t('admin.payouts.approve')}
                          >
                            <CheckCircle size={14} />
                          </button>
                          <button
                            type="button"
                            disabled={payoutMutation.isPending}
                            onClick={async () => {
                              const reason = await confirmRejectPayout(t);
                              if (!reason) return;
                              payoutMutation.mutate({
                                kind,
                                payoutId: row.id,
                                action: 'reject',
                                reason,
                              });
                            }}
                            className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-red-700 hover:bg-red-100 disabled:opacity-50 cursor-pointer"
                            aria-label={t('admin.payouts.reject')}
                          >
                            <XCircle size={14} />
                          </button>
                        </PermissionGate>
                      ) : null}

                      {row.status === 'approved' ? (
                        <PermissionGate permission="payouts.process">
                          <button
                            type="button"
                            disabled={payoutMutation.isPending}
                            onClick={() =>
                              payoutMutation.mutate({
                                kind,
                                payoutId: row.id,
                                action: kind === 'affiliate' ? 'mark-processing' : 'mark-paid',
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-diyar-brown/30 bg-diyar-brown/10 px-2 py-1.5 text-xs font-semibold text-diyar-brown hover:bg-diyar-brown/20 disabled:opacity-50 cursor-pointer"
                          >
                            <DollarSign size={14} />
                          </button>
                        </PermissionGate>
                      ) : null}

                      {row.status === 'processing' && kind === 'affiliate' ? (
                        <PermissionGate permission="affiliate.payouts.process">
                          <button
                            type="button"
                            disabled={payoutMutation.isPending}
                            onClick={() =>
                              payoutMutation.mutate({
                                kind: 'affiliate',
                                payoutId: row.id,
                                action: 'mark-paid',
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-diyar-brown/30 bg-diyar-brown/10 px-2 py-1.5 text-xs font-semibold text-diyar-brown hover:bg-diyar-brown/20 disabled:opacity-50 cursor-pointer"
                          >
                            <DollarSign size={14} />
                          </button>
                        </PermissionGate>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
      </AdminResourceTable>

      <AdminPayoutDetailModal
        open={Boolean(selectedPayout) && !isLedger}
        kind={payoutKind}
        payout={selectedPayout}
        isActionPending={payoutMutation.isPending}
        onClose={() => setSelectedPayout(null)}
        onAction={(action) => void handlePayoutAction(action)}
      />
    </div>
  );
}
