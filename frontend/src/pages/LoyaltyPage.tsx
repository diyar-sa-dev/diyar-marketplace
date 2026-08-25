import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Gift,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Star,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { PaginationBar } from '../components/catalog/PaginationBar.tsx';
import { LoadingState } from '../components/common/LoadingState.tsx';
import { ErrorState } from '../components/common/ErrorState.tsx';
import { EmptyState } from '../components/common/EmptyState.tsx';
import { useAuth } from '../hooks/auth/useAuth.ts';
import { useLocale } from '../hooks/useLocale.ts';
import { usePaginationState } from '../hooks/usePaginationState.ts';
import {
  useLoyaltyRewards,
  useLoyaltySummary,
  useLoyaltyTransactions,
} from '../hooks/loyalty/useLoyalty.ts';
import { formatLocaleDateTime } from '../lib/intlLocale.ts';
import type { LoyaltyTransactionFilter, LoyaltyTransactionType } from '../api/loyalty.ts';

const FILTERS: LoyaltyTransactionFilter[] = ['all', 'earn', 'redeem', 'adjust', 'reversal'];

function transactionIcon(type: LoyaltyTransactionType) {
  if (type === 'earn') return ArrowUpRight;
  if (type === 'reversal') return RotateCcw;
  if (type === 'adjust') return SlidersHorizontal;
  return ArrowDownRight;
}

function transactionTone(type: LoyaltyTransactionType, points: number): 'positive' | 'negative' | 'neutral' {
  if (points > 0) return 'positive';
  if (points < 0) return 'negative';
  return 'neutral';
}

export default function LoyaltyPage() {
  const { t, locale } = useLocale();
  const { isAuthenticated } = useAuth();
  const [activeFilter, setActiveFilter] = useState<LoyaltyTransactionFilter>('all');
  const { page, perPage, perPageOptions, onPageChange, onPerPageChange, resetPage } =
    usePaginationState({ initialPerPage: 20 });

  const summaryQuery = useLoyaltySummary(isAuthenticated);
  const transactionsQuery = useLoyaltyTransactions(activeFilter, page, perPage, isAuthenticated);
  const rewardsQuery = useLoyaltyRewards(isAuthenticated);

  const summary = summaryQuery.data;
  const equivalentValue = useMemo(() => {
    if (!summary) return 0;
    const unitValue = summary.sar_per_point / Math.max(summary.points_per_unit, 1);
    return summary.balance * unitValue;
  }, [summary]);

  const handleFilterChange = (filter: LoyaltyTransactionFilter) => {
    setActiveFilter(filter);
    resetPage();
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-gray-50 min-h-screen py-8 md:py-12">
        <div className="max-w-4xl mx-auto px-4">
          <EmptyState
            title={t('loyaltyPage.guestTitle')}
            description={t('loyaltyPage.guestDescription')}
            action={
              <Link
                to="/login?redirect=/loyalty"
                className="inline-flex items-center justify-center rounded-full bg-diyar-dark px-8 py-3 font-bold text-white transition-colors hover:bg-black cursor-pointer"
              >
                {t('loyaltyPage.guestCta')}
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const isInitialLoading = summaryQuery.isLoading || transactionsQuery.isLoading;

  return (
    <div className="bg-gray-50 min-h-screen py-8 md:py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-2xl md:text-4xl font-sans font-bold text-diyar-dark mb-4">
            {t('loyaltyPage.title')}
          </h1>
          <p className="text-gray-500 text-lg">{t('loyaltyPage.subtitle')}</p>
        </div>

        {summaryQuery.isError ? (
          <ErrorState
            message={t('loyaltyPage.loadError')}
            onRetry={() => void summaryQuery.refetch()}
          />
        ) : (
          <>
            <div className="bg-gradient-to-br from-diyar-dark to-black rounded-[2rem] p-8 md:p-12 text-white shadow-2xl mb-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-amber-400 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-diyar-brown rounded-full blur-3xl" />
              </div>

              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 shrink-0">
                    <Star size={40} className="text-amber-400 fill-amber-400" />
                  </div>
                  <div>
                    <span className="text-white/80 font-medium mb-1 block text-lg">
                      {t('loyaltyPage.balanceLabel')}
                    </span>
                    <div className="flex items-end gap-2">
                      {isInitialLoading ? (
                        <span className="text-5xl md:text-7xl font-sans font-bold text-amber-300 animate-pulse">
                          —
                        </span>
                      ) : (
                        <>
                          <span className="text-5xl md:text-7xl font-sans font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
                            {summary?.balance.toLocaleString(locale)}
                          </span>
                          <span className="text-xl md:text-2xl font-bold text-amber-500 mb-2">
                            {t('loyaltyPage.pointsUnit')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-md border border-white/20 text-center w-full md:w-auto">
                  <span className="text-white/80 text-sm mb-1 block">
                    {t('loyaltyPage.equivalentLabel')}
                  </span>
                  <span className="text-3xl font-bold font-sans">
                    {equivalentValue.toLocaleString(locale)}{' '}
                    <span className="text-lg font-normal">{t('common.currency')}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                  <ArrowUpRight size={24} />
                </div>
                <div>
                  <span className="text-gray-500 text-sm block">{t('loyaltyPage.totalEarned')}</span>
                  <span className="font-bold text-xl text-diyar-dark">
                    {(summary?.total_earned ?? 0).toLocaleString(locale)}{' '}
                    {t('loyaltyPage.pointsUnit')}
                  </span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <ArrowDownRight size={24} />
                </div>
                <div>
                  <span className="text-gray-500 text-sm block">{t('loyaltyPage.totalRedeemed')}</span>
                  <span className="font-bold text-xl text-diyar-dark">
                    {(summary?.total_redeemed ?? 0).toLocaleString(locale)}{' '}
                    {t('loyaltyPage.pointsUnit')}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-10">
          <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Gift className="text-diyar-brown" size={24} />
              <h3 className="text-xl font-bold text-diyar-dark">{t('loyaltyPage.rewardsTitle')}</h3>
            </div>
          </div>
          <div className="p-8">
            {rewardsQuery.isLoading ? (
              <LoadingState message={t('common.loading')} />
            ) : (
              <EmptyState
                title={t('loyaltyPage.rewardsEmptyTitle')}
                description={t('loyaltyPage.rewardsEmptyDescription')}
              />
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Clock className="text-diyar-brown" size={24} />
              <h3 className="text-xl font-bold text-diyar-dark">{t('loyaltyPage.historyTitle')}</h3>
            </div>
            <div className="flex flex-wrap items-center p-1 bg-gray-50 rounded-xl w-full md:w-auto gap-1">
              {FILTERS.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => handleFilterChange(filter)}
                  className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                    activeFilter === filter
                      ? 'bg-white shadow-sm text-diyar-dark'
                      : 'text-gray-500 hover:text-diyar-dark'
                  }`}
                >
                  {t(`loyaltyPage.filters.${filter}`)}
                </button>
              ))}
            </div>
          </div>

          {transactionsQuery.isLoading ? (
            <div className="p-8">
              <LoadingState message={t('common.loading')} />
            </div>
          ) : transactionsQuery.isError ? (
            <div className="p-8">
              <ErrorState
                message={t('loyaltyPage.transactionsError')}
                onRetry={() => void transactionsQuery.refetch()}
              />
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {(transactionsQuery.data?.items ?? []).map((item) => {
                  const Icon = transactionIcon(item.type);
                  const tone = transactionTone(item.type, item.points);
                  const toneClass =
                    tone === 'positive'
                      ? 'text-green-600 bg-green-50'
                      : tone === 'negative'
                        ? 'text-red-600 bg-red-50'
                        : 'text-gray-600 bg-gray-50';

                  return (
                    <div
                      key={item.id}
                      className="p-6 md:p-8 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${toneClass}`}
                        >
                          <Icon size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-diyar-dark mb-1">
                            {item.description ?? t(`loyaltyPage.transactionTypes.${item.type}`)}
                          </h4>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                            {item.created_at ? (
                              <span>{formatLocaleDateTime(item.created_at, locale)}</span>
                            ) : null}
                            {item.order_id ? (
                              <>
                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                <span>{t('loyaltyPage.orderReference')}</span>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`text-xl font-sans font-bold flex items-center gap-1 ${
                          item.points >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {item.points >= 0 ? '+' : ''}
                        {item.points.toLocaleString(locale)}
                        <span className="text-sm font-normal">
                          {t('loyaltyPage.pointsUnit')}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {(transactionsQuery.data?.items ?? []).length === 0 ? (
                  <div className="p-12 text-center text-gray-500">{t('loyaltyPage.noTransactions')}</div>
                ) : null}
              </div>

              {(transactionsQuery.data?.pagination.total ?? 0) > 0 ? (
                <div className="border-t border-gray-100 p-4">
                  <PaginationBar
                    pagination={transactionsQuery.data!.pagination}
                    page={page}
                    perPage={perPage}
                    perPageOptions={[...perPageOptions]}
                    onPageChange={onPageChange}
                    onPerPageChange={onPerPageChange}
                    alwaysShow
                    isLoading={transactionsQuery.isFetching && !transactionsQuery.isLoading}
                  />
                </div>
              ) : null}
            </>
          )}
        </div>

        {summary && !summary.enabled ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 text-sm flex items-start gap-3">
            <RefreshCw size={18} className="mt-0.5 shrink-0" />
            <p>{t('loyaltyPage.programDisabledNotice')}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
