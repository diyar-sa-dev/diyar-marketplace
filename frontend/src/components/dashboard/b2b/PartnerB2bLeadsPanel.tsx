import { useEffect, useMemo, useState } from 'react';
import { Check, Eye, Loader2, Search, X } from 'lucide-react';
import { PaginationBar } from '../../catalog/PaginationBar.tsx';
import { EmptyState } from '../../common/EmptyState.tsx';
import { ErrorState } from '../../common/ErrorState.tsx';
import { UserAvatar } from '../../profile/UserAvatar.tsx';
import {
  usePartnerB2bLead,
  usePartnerB2bLeads,
  useUpdatePartnerB2bLeadStatus,
} from '../../../hooks/b2b/usePartnerB2bLeads.ts';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue.ts';
import { useLocale } from '../../../hooks/useLocale.ts';
import { usePaginationState } from '../../../hooks/usePaginationState.ts';
import { useToast } from '../../../hooks/useToast.ts';
import { formatFinanceDateTime } from '../../../lib/formatFinanceDateTime.ts';
import { toSaudiPhoneNationalInput } from '../../../lib/auth/validation.ts';
import { vendorButtonClass } from '../../../lib/vendorProductValidation.ts';
import { parseApiError } from '../../../utils/errors.ts';
import type {
  B2bLeadBudgetRange,
  B2bLeadStatus,
  PartnerB2bLead,
  PartnerB2bPortal,
} from '../../../types/b2b.ts';

const STATUS_FILTERS: Array<B2bLeadStatus | 'all'> = ['all', 'new', 'accepted', 'rejected'];

type PartnerB2bLeadsPanelProps = {
  portal: PartnerB2bPortal;
};

function budgetLabelKey(range: B2bLeadBudgetRange): string {
  switch (range) {
    case 'under_10k':
      return 'b2b.company.budgetUnder10k';
    case '10k_50k':
      return 'b2b.company.budget10k50k';
    case '50k_200k':
      return 'b2b.company.budget50k200k';
    case 'over_200k':
      return 'b2b.company.budgetOver200k';
    default:
      return 'b2b.company.budgetUnspecified';
  }
}

function statusBadgeClass(status: B2bLeadStatus): string {
  switch (status) {
    case 'accepted':
      return 'bg-green-50 text-green-700';
    case 'rejected':
      return 'bg-red-50 text-red-700';
    default:
      return 'bg-amber-50 text-amber-700';
  }
}

function LeadRowSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
      <div className="flex gap-4">
        <div className="w-12 h-12 rounded-full bg-gray-100 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-100 rounded w-1/3" />
          <div className="h-3 bg-gray-100 rounded w-2/3" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}

function LeadDetailModal({
  portal,
  leadId,
  onClose,
}: {
  portal: PartnerB2bPortal;
  leadId: string;
  onClose: () => void;
}) {
  const { t, locale, dir } = useLocale();
  const { toast } = useToast();
  const { data: lead, isLoading, isError, error } = usePartnerB2bLead(portal, leadId);
  const updateStatus = useUpdatePartnerB2bLeadStatus(portal);

  const handleStatus = async (status: 'accepted' | 'rejected') => {
    try {
      await updateStatus.mutateAsync({ leadId, status });
      toast.success(t('b2b.partner.leads.statusUpdated'));
      onClose();
    } catch (mutationError) {
      toast.error(parseApiError(mutationError, locale).message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
      <div
        role="dialog"
        aria-modal="true"
        dir={dir}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl border border-gray-100"
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-lg text-diyar-dark">{t('b2b.partner.leads.detailTitle')}</h3>
            <p className="text-sm text-gray-500">{t('b2b.partner.leads.detailSubtitle')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-diyar-brown" />
          </div>
        ) : isError || !lead ? (
          <div className="p-5">
            <ErrorState error={error as Error} message={t('b2b.partner.leads.loadError')} />
          </div>
        ) : (
          <div className="p-5 space-y-5">
            <div className="flex items-start gap-4">
              <UserAvatar
                name={lead.requester?.name}
                avatarUrl={lead.requester?.avatar_url}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-diyar-dark">{lead.requester?.name ?? '—'}</p>
                {lead.requester?.phone ? (
                  <p className="text-sm text-gray-500 mt-1" dir="ltr">
                    {toSaudiPhoneNationalInput(lead.requester.phone)}
                  </p>
                ) : null}
                {lead.requester?.email ? (
                  <p className="text-sm text-gray-500 mt-1 break-all">{lead.requester.email}</p>
                ) : null}
              </div>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${statusBadgeClass(lead.status)}`}
              >
                {t(`b2b.partner.leads.status.${lead.status}`)}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                <p className="text-xs text-gray-400 mb-1">{t('b2b.company.projectType')}</p>
                <p className="font-bold text-sm text-diyar-dark">{lead.project_type}</p>
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                <p className="text-xs text-gray-400 mb-1">{t('b2b.company.estimatedQuantity')}</p>
                <p className="font-bold text-sm text-diyar-dark">
                  {lead.estimated_quantity || '—'}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 sm:col-span-2">
                <p className="text-xs text-gray-400 mb-1">{t('b2b.company.budget')}</p>
                <p className="font-bold text-sm text-diyar-dark">
                  {t(budgetLabelKey(lead.budget_range))}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-2">{t('b2b.company.details')}</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-xl border border-gray-100 p-4">
                {lead.details}
              </p>
            </div>

            {lead.created_at ? (
              <p className="text-xs text-gray-400" dir="ltr">
                {formatFinanceDateTime(lead.created_at, locale)}
              </p>
            ) : null}

            {lead.status === 'new' ? (
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  disabled={updateStatus.isPending}
                  onClick={() => void handleStatus('accepted')}
                  className={`${vendorButtonClass} inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 disabled:opacity-60 cursor-pointer`}
                >
                  <Check size={16} />
                  {t('b2b.partner.leads.accept')}
                </button>
                <button
                  type="button"
                  disabled={updateStatus.isPending}
                  onClick={() => void handleStatus('rejected')}
                  className={`${vendorButtonClass} inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50 disabled:opacity-60 cursor-pointer`}
                >
                  <X size={16} />
                  {t('b2b.partner.leads.reject')}
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export function PartnerB2bLeadsPanel({ portal }: PartnerB2bLeadsPanelProps) {
  const { t, locale } = useLocale();
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<B2bLeadStatus | 'all'>('all');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const { page, perPage, perPageOptions, onPageChange, onPerPageChange, resetPage } =
    usePaginationState({ initialPerPage: 10 });

  useEffect(() => {
    resetPage();
  }, [debouncedSearch, statusFilter, resetPage]);

  const filters = useMemo(
    () => ({
      page,
      per_page: perPage,
      status: statusFilter,
      q: debouncedSearch.trim() || undefined,
    }),
    [page, perPage, statusFilter, debouncedSearch],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = usePartnerB2bLeads(
    portal,
    filters,
    true,
  );

  const items = data?.items ?? [];
  const summary = data?.summary;
  const filterClass = (active: boolean) =>
    `shrink-0 px-3 py-2 text-xs sm:text-sm font-bold rounded-xl border transition-colors cursor-pointer whitespace-nowrap ${
      active
        ? 'bg-diyar-brown text-white border-diyar-brown'
        : 'bg-white text-gray-600 border-gray-200 hover:border-diyar-brown/40'
    }`;

  const countForFilter = (status: B2bLeadStatus | 'all') => {
    if (!summary) return 0;
    if (status === 'all') return summary.total;
    return summary[status];
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-diyar-dark">{t('b2b.partner.leads.title')}</h2>
        <p className="text-sm text-gray-500 mt-1">{t('b2b.partner.leads.subtitle')}</p>
      </div>

      <div className="relative">
        <Search
          size={18}
          className="absolute top-1/2 -translate-y-1/2 inset-s-4 text-gray-400 pointer-events-none"
        />
        <input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder={t('b2b.partner.leads.searchPlaceholder')}
          className="w-full rounded-xl border border-gray-200 bg-white py-3 ps-11 pe-4 text-sm outline-none focus:ring-2 focus:ring-diyar-brown/20"
        />
      </div>

      <div className="inline-flex w-fit max-w-full overflow-x-auto gap-2 pb-1">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={filterClass(statusFilter === status)}
          >
            {t(`b2b.partner.leads.filters.${status}`)} ({countForFilter(status)})
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <LeadRowSkeleton key={index} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState error={error as Error} message={t('b2b.partner.leads.loadError')} onRetry={() => void refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          title={t('b2b.partner.leads.emptyTitle')}
          description={t('b2b.partner.leads.emptyDescription')}
        />
      ) : (
        <div className={`space-y-3 ${isFetching ? 'opacity-70' : ''}`}>
          {items.map((lead: PartnerB2bLead) => (
            <article
              key={lead.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row gap-4 lg:items-start">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <UserAvatar
                    name={lead.requester?.name}
                    avatarUrl={lead.requester?.avatar_url}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-bold text-diyar-dark truncate">{lead.project_type}</h3>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusBadgeClass(lead.status)}`}
                      >
                        {t(`b2b.partner.leads.status.${lead.status}`)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {lead.requester?.name ?? '—'}
                      {lead.estimated_quantity ? ` • ${lead.estimated_quantity}` : ''}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2 mt-2">{lead.details}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedLeadId(lead.id)}
                    className={`${vendorButtonClass} inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer`}
                  >
                    <Eye size={15} />
                    {t('b2b.partner.leads.viewDetail')}
                  </button>
                </div>
              </div>
            </article>
          ))}

          {data?.pagination && (
            <PaginationBar
              pagination={data.pagination}
              page={page}
              perPage={perPage}
              perPageOptions={[...perPageOptions]}
              onPageChange={onPageChange}
              onPerPageChange={onPerPageChange}
              alwaysShow={data.pagination.total > 0}
              isLoading={isFetching && !isLoading}
              className="pt-2"
            />
          )}
        </div>
      )}

      {selectedLeadId ? (
        <LeadDetailModal
          portal={portal}
          leadId={selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
        />
      ) : null}
    </div>
  );
}
