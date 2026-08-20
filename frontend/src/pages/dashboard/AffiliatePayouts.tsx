import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, History, Building2, CheckCircle2, Loader2 } from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { ErrorState } from '../../components/common/ErrorState.tsx';
import { LoadingState } from '../../components/common/LoadingState.tsx';
import { PaginationBar } from '../../components/catalog/PaginationBar.tsx';
import {
  useAffiliatePayouts,
  useAffiliateSettings,
  useRequestAffiliatePayout,
} from '../../hooks/affiliate/useAffiliate.ts';
import { usePaginationState, paginationBarProps } from '../../hooks/usePaginationState.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { formatFinanceDateTime } from '../../lib/formatFinanceDateTime.ts';
import { useToast } from '../../hooks/useToast.ts';
import { parseApiError } from '../../utils/errors.ts';
import type { AffiliatePayoutStatus } from '../../types/affiliate.ts';

export default function AffiliatePayouts() {
  const { t, locale } = useLocale();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requestedAmount, setRequestedAmount] = useState('0');

  const { page, perPage, perPageOptions, onPageChange, onPerPageChange } = usePaginationState({
    initialPerPage: 10,
  });

  const payoutsQuery = useAffiliatePayouts(page, perPage);
  const settingsQuery = useAffiliateSettings();
  const requestPayout = useRequestAffiliatePayout();

  const balance = payoutsQuery.data?.balance;
  const payouts = payoutsQuery.data?.payouts ?? [];
  const pagination = payoutsQuery.data?.pagination;
  const minimumPayout = balance?.payout_minimum ?? '100.00';
  const currency = balance?.currency ?? t('common.currency');

  const payoutStatusLabel = useMemo(
    () => (status: AffiliatePayoutStatus) =>
      t(`affiliate.payoutStatus.${status}` as 'affiliate.payoutStatus.pending'),
    [t],
  );

  const handleRequestPayout = async () => {
    if (!balance?.available || Number(balance.available) <= 0) {
      toast.error(t('affiliate.payoutError'));
      return;
    }

    if (Number(balance.available) < Number(minimumPayout)) {
      toast.error(t('affiliate.payouts.belowMinimum', { minimum: minimumPayout }));
      return;
    }

    try {
      await requestPayout.mutateAsync({
        amount: balance.available,
        idempotencyKey: crypto.randomUUID(),
      });
      setRequestedAmount(balance.available);
      setIsModalOpen(true);
      toast.success(t('affiliate.payoutRequested'));
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-diyar-dark">سحب الأرباح</h2>
          <p className="text-gray-500 text-sm mt-1">إدارة رصيدك المتاح وسجل مسحوبات الأرباح.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-green-600 text-white p-6 rounded-2xl shadow-sm relative overflow-hidden lg:col-span-1">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full translate-x-20 -translate-y-20"></div>
          <div className="relative z-10 space-y-6">
            <div>
              <h3 className="text-white/80 font-medium mb-1">
                {t('affiliate.payouts.availableBalance')}
              </h3>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold">{balance?.available ?? '0.00'}</span>
                <span className="text-lg text-white/80 pb-1">{currency}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/20">
              <h3 className="text-white/80 text-sm mb-1">
                {t('affiliate.payouts.pendingBalance')}
              </h3>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold">{balance?.pending ?? '0.00'}</span>
                <span className="text-sm text-white/80 pb-1">{currency}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleRequestPayout()}
              disabled={
                requestPayout.isPending || Number(balance?.available ?? 0) < Number(minimumPayout)
              }
              className="w-full bg-white text-green-600 py-3 rounded-xl font-bold hover:bg-gray-50 transition shadow-sm flex items-center justify-center gap-2 mt-4 disabled:opacity-60"
            >
              {requestPayout.isPending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Wallet size={18} />
              )}
              {t('affiliate.payouts.requestButton')}
            </button>
            <p className="text-xs text-white/70 mt-3">
              {t('affiliate.payouts.minimumNotice', { minimum: minimumPayout, currency })}
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500 border border-gray-100">
                <Building2 size={24} />
              </div>
              <div>
                <h4 className="font-bold text-diyar-dark">
                  {profile?.payout_account_holder ?? '—'}
                </h4>
                <p className="text-sm text-gray-500 mt-1" dir="ltr">
                  {profile?.payout_iban ?? '—'}
                </p>
                {profile?.payout_bank_name ? (
                  <p className="text-xs text-gray-400 mt-1">{profile.payout_bank_name}</p>
                ) : null}
              </div>
            </div>
            <Link
              to="/dashboard/affiliate/settings"
              className="text-sm font-bold text-blue-600 hover:text-blue-700 transition"
            >
              تغيير الحساب
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-diyar-dark flex items-center gap-2">
                <History size={18} className="text-gray-400" />
                سجل المسحوبات السابقة
              </h3>
            </div>
            {payouts.length === 0 ? (
              <div className="p-6">
                <EmptyState title={t('affiliate.emptyPayouts')} />
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {payouts.map((payout) => (
                  <div
                    key={payout.id}
                    className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">
                          {payoutStatusLabel(payout.status)}
                        </h4>
                        {payout.rejection_reason ? (
                          <p className="text-xs text-red-500 mt-1">{payout.rejection_reason}</p>
                        ) : null}
                        <div className="text-sm text-gray-500 mt-1 flex gap-3">
                          <span>
                            {formatFinanceDateTime(payout.requested_at ?? undefined, locale)}
                          </span>
                          <span className="text-gray-300">|</span>
                          <span>{payout.reference}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-diyar-dark text-lg">
                        {payout.amount} {payout.currency}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {pagination && pagination.last_page > 1 ? (
              <div className="p-4 border-t border-gray-100">
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
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-300 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-xl text-diyar-dark">طلب سحب جديد</h3>
            </div>
            <div className="p-6 space-y-4 text-center pb-8">
              <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={40} />
              </div>
              <h4 className="font-bold text-xl text-gray-900">تم استلام طلبك بنجاح</h4>
              <p className="text-gray-500 text-sm">
                سيتم تحويل مبلغ{' '}
                <span className="font-bold text-diyar-dark">
                  {requestedAmount} {currency}
                </span>{' '}
                إلى حسابك البنكي خلال 1-3 أيام عمل.
              </p>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full px-5 py-3 rounded-xl font-bold bg-diyar-dark text-white hover:bg-black transition"
              >
                حسناً، إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
