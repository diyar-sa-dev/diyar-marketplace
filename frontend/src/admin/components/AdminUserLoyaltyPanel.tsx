import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Star, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  adjustAdminCustomerLoyalty,
  fetchAdminCustomerLoyalty,
} from '../../api/adminLoyalty.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { PermissionGate } from '../components/PermissionGate.tsx';
import { LoadingState } from '../../components/common/LoadingState.tsx';
import { ErrorState } from '../../components/common/ErrorState.tsx';
import { formatLocaleDateTime } from '../../lib/intlLocale.ts';
import { adminQueryKey } from '../../lib/auth/queryKeys.ts';

type Props = {
  userId: string;
};

export function AdminUserLoyaltyPanel({ userId }: Props) {
  const { t, locale } = useLocale();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const endpoint = `/admin/loyalty/customers/${userId}`;

  const [points, setPoints] = useState('');
  const [direction, setDirection] = useState<'credit' | 'debit'>('credit');
  const [reason, setReason] = useState('');

  const query = useQuery({
    queryKey: adminQueryKey('admin-user-loyalty', endpoint),
    queryFn: () => fetchAdminCustomerLoyalty(userId),
  });

  const adjustMutation = useMutation({
    mutationFn: () =>
      adjustAdminCustomerLoyalty(userId, {
        points: Number(points),
        direction,
        reason: reason.trim(),
      }),
    onSuccess: () => {
      showToast(t('admin.loyalty.adjustSuccess'), 'success');
      setPoints('');
      setReason('');
      void queryClient.invalidateQueries({ queryKey: adminQueryKey('admin-user-loyalty', endpoint) });
    },
    onError: () => {
      showToast(t('admin.loyalty.adjustError'), 'error');
    },
  });

  if (query.isLoading) {
    return <LoadingState message={t('common.loading')} />;
  }

  if (query.isError || !query.data) {
    return (
      <ErrorState message={t('admin.loyalty.loadError')} onRetry={() => void query.refetch()} />
    );
  }

  const { loyalty, recent_transactions: recentTransactions } = query.data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-[#f7f4f1]/60 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
            {t('admin.loyalty.balance')}
          </p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-extrabold text-diyar-dark">
            <Star size={20} className="text-amber-500 fill-amber-500" />
            {loyalty.balance.toLocaleString(locale)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
            {t('admin.loyalty.totalEarned')}
          </p>
          <p className="mt-2 text-xl font-bold text-emerald-700">{loyalty.total_earned}</p>
        </div>
        <div className="rounded-xl border border-gray-100 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
            {t('admin.loyalty.totalRedeemed')}
          </p>
          <p className="mt-2 text-xl font-bold text-red-600">{loyalty.total_redeemed}</p>
        </div>
        <div className="rounded-xl border border-gray-100 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
            {t('admin.loyalty.totalReversed')}
          </p>
          <p className="mt-2 text-xl font-bold text-amber-700">{loyalty.total_reversed}</p>
        </div>
      </div>

      <PermissionGate permission="loyalty.adjust">
        <form
          className="rounded-2xl border border-gray-100 bg-gray-50/80 p-5 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            adjustMutation.mutate();
          }}
        >
          <h3 className="font-bold text-diyar-dark">{t('admin.loyalty.adjustTitle')}</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-gray-600">
                {t('admin.loyalty.points')}
              </span>
              <input
                type="number"
                min={1}
                value={points}
                onChange={(event) => setPoints(event.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5"
                required
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-gray-600">
                {t('admin.loyalty.direction')}
              </span>
              <select
                value={direction}
                onChange={(event) => setDirection(event.target.value as 'credit' | 'debit')}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 cursor-pointer"
              >
                <option value="credit">{t('admin.loyalty.credit')}</option>
                <option value="debit">{t('admin.loyalty.debit')}</option>
              </select>
            </label>
            <label className="block md:col-span-1">
              <span className="mb-1 block text-sm font-semibold text-gray-600">
                {t('admin.loyalty.reason')}
              </span>
              <input
                type="text"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5"
                minLength={3}
                required
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={adjustMutation.isPending}
            className="rounded-xl bg-diyar-dark px-5 py-2.5 text-sm font-bold text-white cursor-pointer disabled:opacity-50"
          >
            {t('admin.loyalty.submitAdjust')}
          </button>
        </form>
      </PermissionGate>

      <div>
        <h3 className="mb-4 font-bold text-diyar-dark">{t('admin.loyalty.recentTransactions')}</h3>
        {recentTransactions.length === 0 ? (
          <p className="text-sm text-gray-500">{t('admin.loyalty.noTransactions')}</p>
        ) : (
          <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100">
            {recentTransactions.map((item) => {
              const positive = item.points >= 0;
              const Icon = positive ? ArrowUpRight : ArrowDownRight;
              return (
                <div key={item.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-diyar-dark truncate">
                      {item.description ?? item.type}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.created_at ? formatLocaleDateTime(item.created_at, locale) : '—'}
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-1 font-bold ${positive ? 'text-emerald-600' : 'text-red-600'}`}
                  >
                    <Icon size={16} />
                    {positive ? '+' : ''}
                    {item.points}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
