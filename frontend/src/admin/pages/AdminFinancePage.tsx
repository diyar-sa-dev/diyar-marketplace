import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, DollarSign, XCircle } from 'lucide-react';
import { adminApi } from '../../api/client.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { AdminResourceTable } from '../components/AdminResourceTable.tsx';
import { AdminStatusBadge } from '../components/AdminStatusBadge.tsx';
import { AdminTablePagination } from '../components/AdminTablePagination.tsx';
import { DetailTabs } from '../components/DetailTabs.tsx';
import { PermissionGate } from '../components/PermissionGate.tsx';
import { useAdminListQuery } from '../hooks/useAdminListQuery.ts';

type Payout = {
  id: string;
  status: string;
  amount?: number | string;
  currency?: string;
};

type Transaction = {
  id: string;
  transaction_type: string;
  amount: string;
  currency?: string;
  created_at?: string;
};

export default function AdminFinancePage() {
  const { t } = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [section, setSection] = useState<'vendor' | 'affiliate' | 'ledger'>('vendor');

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

  const listQuery = useAdminListQuery<Payout | Transaction>({
    resourceKey: listConfig.resourceKey,
    endpoint: listConfig.endpoint,
    itemsKey: listConfig.itemsKey,
  });

  const payoutMutation = useMutation({
    mutationFn: async ({
      kind,
      payoutId,
      action,
    }: {
      kind: 'vendor' | 'affiliate';
      payoutId: string;
      action: 'approve' | 'reject' | 'mark-paid' | 'mark-processing';
    }) => {
      const base =
        kind === 'vendor' ? `/admin/payouts/${payoutId}` : `/admin/affiliate/payouts/${payoutId}`;
      await adminApi.post(`${base}/${action}`);
    },
    onSuccess: async () => {
      toast.success(t('admin.payouts.updated'));
      await queryClient.invalidateQueries({ queryKey: ['admin-vendor-payouts'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-affiliate-payouts'] });
    },
    onError: () => toast.error(t('admin.payouts.updateError')),
  });

  const items = listQuery.data?.items ?? [];
  const meta = listQuery.data?.meta;
  const isLedger = section === 'ledger';

  const tabs = [
    { id: 'vendor', label: t('admin.finance.vendorPayouts') },
    { id: 'affiliate', label: t('admin.finance.affiliatePayouts') },
    { id: 'ledger', label: t('admin.finance.ledger') },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-diyar-dark">{t('admin.nav.finance')}</h2>
        <p className="mt-1 text-sm text-gray-500">{t('admin.finance.subtitle')}</p>
      </div>

      <DetailTabs
        tabs={tabs}
        activeTab={section}
        onChange={(id) => setSection(id as typeof section)}
      />

      <AdminResourceTable
        title={
          isLedger
            ? t('admin.finance.ledger')
            : section === 'vendor'
              ? t('admin.finance.vendorPayouts')
              : t('admin.finance.affiliatePayouts')
        }
        searchValue={listQuery.search}
        onSearchChange={listQuery.setSearch}
        searchPlaceholder={
          isLedger ? t('admin.tables.searchTransactions') : t('admin.tables.searchPayouts')
        }
        filters={
          !isLedger ? (
            <select
              value={listQuery.statusFilter}
              onChange={(event) => listQuery.setStatusFilter(event.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
            >
              <option value="">{t('admin.tables.allStatuses')}</option>
              <option value="pending">{t('admin.tables.pending')}</option>
              <option value="approved">{t('admin.tables.approved')}</option>
              <option value="paid">{t('admin.tables.paid')}</option>
              <option value="rejected">{t('admin.tables.rejected')}</option>
            </select>
          ) : undefined
        }
        isLoading={listQuery.isLoading}
        isError={listQuery.isError}
        isEmpty={items.length === 0}
        emptyTitle={isLedger ? t('admin.finance.ledgerEmpty') : t('admin.payouts.empty')}
        columns={
          isLedger ? (
            <tr>
              <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.type')}</th>
              <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.amount')}</th>
              <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.createdAt')}</th>
            </tr>
          ) : (
            <tr>
              <th className="px-4 py-3 text-start font-semibold">ID</th>
              <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.amount')}</th>
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
                <tr key={row.id} className="hover:bg-[#f7f4f1]/50">
                  <td className="px-4 py-3 text-sm text-gray-700">{row.transaction_type}</td>
                  <td className="px-4 py-3 font-semibold tabular-nums" dir="ltr">
                    {row.amount} {row.currency ?? ''}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {row.created_at ? new Date(row.created_at).toLocaleString() : '—'}
                  </td>
                </tr>
              );
            })
          : items.map((payout) => {
              const row = payout as Payout;
              return (
                <tr key={row.id} className="hover:bg-[#f7f4f1]/50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {row.id.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-3 font-semibold tabular-nums" dir="ltr">
                    {row.amount ?? '—'} {row.currency ?? ''}
                  </td>
                  <td className="px-4 py-3">
                    <AdminStatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {row.status === 'pending' ? (
                        <PermissionGate permission="payouts.approve">
                          <button
                            type="button"
                            disabled={payoutMutation.isPending}
                            onClick={() =>
                              payoutMutation.mutate({
                                kind: section as 'vendor' | 'affiliate',
                                payoutId: row.id,
                                action: 'approve',
                              })
                            }
                            className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-emerald-700 cursor-pointer"
                            aria-label={t('admin.payouts.approve')}
                          >
                            <CheckCircle size={14} />
                          </button>
                          <button
                            type="button"
                            disabled={payoutMutation.isPending}
                            onClick={() =>
                              payoutMutation.mutate({
                                kind: section as 'vendor' | 'affiliate',
                                payoutId: row.id,
                                action: 'reject',
                              })
                            }
                            className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-red-700 cursor-pointer"
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
                                kind: section as 'vendor' | 'affiliate',
                                payoutId: row.id,
                                action: section === 'affiliate' ? 'mark-processing' : 'mark-paid',
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-diyar-brown/30 bg-diyar-brown/10 px-2 py-1.5 text-xs font-semibold text-diyar-brown cursor-pointer"
                          >
                            <DollarSign size={14} />
                            <span className="hidden sm:inline">{t('admin.payouts.markPaid')}</span>
                          </button>
                        </PermissionGate>
                      ) : null}
                      {row.status === 'processing' && section === 'affiliate' ? (
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
                            className="inline-flex items-center gap-1 rounded-lg border border-diyar-brown/30 bg-diyar-brown/10 px-2 py-1.5 text-xs font-semibold text-diyar-brown cursor-pointer"
                          >
                            <DollarSign size={14} />
                            <span className="hidden sm:inline">{t('admin.payouts.markPaid')}</span>
                          </button>
                        </PermissionGate>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
      </AdminResourceTable>
    </div>
  );
}
