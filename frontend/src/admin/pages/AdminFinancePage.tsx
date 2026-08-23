import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownRight,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Eye,
  TrendingUp,
  Wallet,
  XCircle,
} from 'lucide-react';
import { adminApi } from '../../api/client.ts';
import { confirmRejectPayout } from '../../lib/confirmDialog.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { adminQueryKey } from '../../lib/auth/queryKeys.ts';
import {
  downloadAdminFinanceReport,
  fetchAdminFinanceReport,
  type AdminFinancePeriod,
} from '../api/adminFinance.ts';
import { AdminPayoutDetailModal } from '../components/AdminPayoutDetailModal.tsx';
import { AdminResourceTable } from '../components/AdminResourceTable.tsx';
import { AdminStatusBadge } from '../components/AdminStatusBadge.tsx';
import { AdminTablePagination } from '../components/AdminTablePagination.tsx';
import { DetailTabs } from '../components/DetailTabs.tsx';
import { PermissionGate } from '../components/PermissionGate.tsx';
import { useAdminListQuery } from '../hooks/useAdminListQuery.ts';
import {
  invalidateAdminResource,
  syncAdminPayoutStatus,
} from '../utils/adminQueryCache.ts';
import {
  FINANCIAL_TRANSACTION_TYPES,
  localizedTransactionType,
} from '../utils/localizedTransactionType.ts';
import type {
  AdminAffiliatePayout,
  AdminPayoutKind,
  AdminPayoutRow,
  AdminVendorPayout,
  PayoutAction,
} from '../types/payouts.ts';

type Transaction = {
  id: string;
  transaction_type: string;
  amount: string;
  currency?: string;
  created_at?: string;
};

const PERIOD_OPTIONS: AdminFinancePeriod[] = ['day', 'week', 'month', 'year'];

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
  return kind === 'vendor' ? 'admin-vendor-payouts' : 'admin-affiliate-payouts';
}

function payoutRecipientName(payout: AdminPayoutRow, kind: AdminPayoutKind): string {
  if (kind === 'vendor') {
    return (payout as AdminVendorPayout).vendor?.business_name ?? '—';
  }
  const affiliate = (payout as AdminAffiliatePayout).affiliate;
  return affiliate?.display_name ?? affiliate?.owner?.name ?? '—';
}

function formatShortDate(value?: string | null, locale?: string): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AdminFinancePage() {
  const { t, locale } = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [section, setSection] = useState<'vendor' | 'affiliate' | 'ledger'>('vendor');
  const [selectedPayout, setSelectedPayout] = useState<AdminPayoutRow | null>(null);
  const [period, setPeriod] = useState<AdminFinancePeriod>('month');

  const financeReportQuery = useQuery({
    queryKey: adminQueryKey('admin-finance-summary', period),
    queryFn: () => fetchAdminFinanceReport(period),
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
    return { endpoint: '/admin/payouts', itemsKey: 'payouts', resourceKey: 'admin-vendor-payouts' };
  }, [section]);

  const listQuery = useAdminListQuery<AdminPayoutRow | Transaction>({
    resourceKey: listConfig.resourceKey,
    endpoint: listConfig.endpoint,
    itemsKey: listConfig.itemsKey,
    paramFilterKey: section === 'ledger' ? 'transaction_type' : undefined,
  });

  const payoutKind: AdminPayoutKind = section === 'affiliate' ? 'affiliate' : 'vendor';

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
        kind === 'vendor' ? `/admin/payouts/${payoutId}` : `/admin/affiliate/payouts/${payoutId}`;
      if (action === 'reject') {
        await adminApi.post(`${base}/reject`, { reason });
        return;
      }
      await adminApi.post(`${base}/${action}`);
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
  const report = financeReportQuery.data;
  const summary = report?.summary;
  const currency = summary?.currency ?? 'SAR';

  const periodLabel = (value: AdminFinancePeriod) => {
    const map: Record<AdminFinancePeriod, string> = {
      day: t('vendor.finance.periodDay'),
      week: t('vendor.finance.periodWeek'),
      month: t('vendor.finance.periodMonth'),
      year: t('vendor.finance.periodYear'),
    };
    return map[value];
  };

  const tabs = [
    { id: 'vendor', label: t('admin.finance.vendorPayouts') },
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
          <div className="flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setPeriod(option)}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition cursor-pointer ${
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
            {downloadReport.isPending ? t('admin.finance.exporting') : t('admin.finance.exportReport')}
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
                <h3 className="font-medium text-gray-500">{t('admin.finance.platformCommission')}</h3>
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

      <DetailTabs
        tabs={tabs}
        activeTab={section}
        onChange={(id) => {
          setSection(id as typeof section);
          setSelectedPayout(null);
        }}
      />

      <AdminResourceTable
        title={
          isLedger
            ? t('admin.finance.ledger')
            : section === 'vendor'
              ? t('admin.finance.vendorPayouts')
              : t('admin.finance.affiliatePayouts')
        }
        subtitle={!isLedger ? t('admin.payouts.subtitle') : undefined}
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
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-diyar-brown cursor-pointer"
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
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-diyar-brown cursor-pointer"
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
        isLoading={listQuery.isLoading}
        isError={listQuery.isError}
        isEmpty={items.length === 0}
        emptyTitle={isLedger ? t('admin.finance.ledgerEmpty') : t('admin.payouts.empty')}
        columns={
          isLedger ? (
            <tr>
              <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.reference')}</th>
              <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.type')}</th>
              <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.amount')}</th>
              <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.createdAt')}</th>
            </tr>
          ) : (
            <tr>
              <th className="px-4 py-3 text-start font-semibold">{t('admin.payouts.reference')}</th>
              <th className="px-4 py-3 text-start font-semibold">{t('admin.payouts.recipient')}</th>
              <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.amount')}</th>
              <th className="px-4 py-3 text-start font-semibold">{t('admin.payouts.requestedAt')}</th>
              <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.status')}</th>
              <th className="px-4 py-3 text-end font-semibold">{t('admin.tables.actions')}</th>
            </tr>
          )
        }
        footer={
          <AdminTablePagination
            meta={meta}
            page={listQuery.page}
            onPageChange={listQuery.setPage}
            isLoading={listQuery.isLoading}
          />
        }
      >
        {isLedger
          ? items.map((tx) => {
              const row = tx as Transaction;
              return (
                <tr key={row.id} className="hover:bg-[#f7f4f1]/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500" dir="ltr">
                    {row.id.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {localizedTransactionType(row.transaction_type, t)}
                  </td>
                  <td className="px-4 py-3 font-bold text-diyar-dark tabular-nums" dir="ltr">
                    {row.amount} {row.currency ?? 'SAR'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {row.created_at ? new Date(row.created_at).toLocaleString(locale) : '—'}
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
                    <p className="font-semibold text-diyar-dark">{payoutRecipientName(row, kind)}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5" dir="ltr">
                      {row.id.slice(0, 8)}…
                    </p>
                  </td>
                  <td className="px-4 py-3 font-extrabold text-diyar-brown tabular-nums" dir="ltr">
                    {row.amount} {row.currency ?? 'SAR'}
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
