import { useMemo, useState } from 'react';
import { Eye, ExternalLink, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PaginationBar } from '../catalog/PaginationBar.tsx';
import { EmptyState } from '../common/EmptyState.tsx';
import { ErrorState } from '../common/ErrorState.tsx';
import { LoadingState } from '../common/LoadingState.tsx';
import { useCustomerB2bLead, useCustomerB2bLeads } from '../../hooks/b2b/useCustomerB2bLeads.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { usePaginationState } from '../../hooks/usePaginationState.ts';
import { formatFinanceDateTime } from '../../lib/formatFinanceDateTime.ts';
import type { B2bLeadBudgetRange, B2bLeadStatus, CustomerB2bLead } from '../../types/b2b.ts';

const STATUS_FILTERS: Array<B2bLeadStatus | 'all'> = ['all', 'new', 'accepted', 'rejected'];

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

function LeadDetailModal({
  leadId,
  onClose,
}: {
  leadId: string;
  onClose: () => void;
}) {
  const { t, locale } = useLocale();
  const detailQuery = useCustomerB2bLead(leadId);
  const lead = detailQuery.data;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label={t('common.close')}
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-bold text-lg text-diyar-dark">{t('b2b.customerLeads.detailTitle')}</h3>
          <p className="text-xs text-gray-500 mt-1">{t('b2b.customerLeads.detailSubtitle')}</p>
        </div>

        {detailQuery.isLoading ? (
          <LoadingState className="min-h-40" />
        ) : detailQuery.isError || !lead ? (
          <ErrorState
            message={t('b2b.customerLeads.loadError')}
            onRetry={() => void detailQuery.refetch()}
          />
        ) : (
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              {lead.company?.logo ? (
                <img
                  src={lead.company.logo}
                  alt=""
                  className="w-12 h-12 rounded-xl object-cover border border-gray-100 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-diyar-brown/10 text-diyar-brown flex items-center justify-center font-bold shrink-0">
                  {(lead.company?.name ?? '?').slice(0, 1)}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-bold text-diyar-dark">{lead.company?.name ?? '—'}</p>
                {lead.company?.location ? (
                  <p className="text-xs text-gray-500">{lead.company.location}</p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-1">{t('orders.status')}</p>
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${statusBadgeClass(lead.status)}`}>
                  {t(`b2b.partner.leads.status.${lead.status}`)}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">{t('b2b.customerLeads.submittedAt')}</p>
                <p className="font-medium text-gray-800">
                  {lead.created_at ? formatFinanceDateTime(lead.created_at, locale) : '—'}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">{t('b2b.company.projectType')}</p>
              <p className="font-medium text-gray-800">{lead.project_type}</p>
            </div>

            {lead.estimated_quantity ? (
              <div>
                <p className="text-xs text-gray-500 mb-1">{t('b2b.company.estimatedQuantity')}</p>
                <p className="font-medium text-gray-800">{lead.estimated_quantity}</p>
              </div>
            ) : null}

            <div>
              <p className="text-xs text-gray-500 mb-1">{t('b2b.company.budget')}</p>
              <p className="font-medium text-gray-800">{t(budgetLabelKey(lead.budget_range))}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">{t('b2b.company.details')}</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{lead.details}</p>
            </div>

            {lead.company?.slug ? (
              <Link
                to={`/b2b/${lead.company.slug}`}
                className="inline-flex items-center gap-2 text-sm font-bold text-diyar-brown hover:text-diyar-dark"
              >
                <ExternalLink size={16} />
                {t('b2b.customerLeads.viewCompany')}
              </Link>
            ) : null}

            {lead.status === 'accepted' ? (
              <Link
                to="/profile/reviews"
                className="inline-flex items-center gap-2 text-sm font-bold text-diyar-dark bg-diyar-cream/40 hover:bg-diyar-cream px-4 py-2 rounded-xl"
              >
                <Star size={16} />
                {t('b2b.customerLeads.rateCompany')}
              </Link>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function LeadCard({
  lead,
  highlighted,
  onOpen,
}: {
  lead: CustomerB2bLead;
  highlighted: boolean;
  onOpen: () => void;
}) {
  const { t, locale } = useLocale();

  return (
    <article
      id={`b2b-lead-${lead.id}`}
      className={`bg-white rounded-2xl border p-5 transition-shadow ${
        highlighted ? 'border-diyar-brown shadow-md ring-2 ring-diyar-brown/20' : 'border-gray-100 shadow-sm'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {lead.company?.logo ? (
            <img
              src={lead.company.logo}
              alt=""
              className="w-11 h-11 rounded-xl object-cover border border-gray-100 shrink-0"
            />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-diyar-brown/10 text-diyar-brown flex items-center justify-center font-bold shrink-0">
              {(lead.company?.name ?? '?').slice(0, 1)}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-bold text-diyar-dark truncate">{lead.company?.name ?? '—'}</h3>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${statusBadgeClass(lead.status)}`}>
                {t(`b2b.partner.leads.status.${lead.status}`)}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-800 mb-1">{lead.project_type}</p>
            <p className="text-xs text-gray-500 line-clamp-2">{lead.details}</p>
            {lead.created_at ? (
              <p className="text-[11px] text-gray-400 mt-2">{formatFinanceDateTime(lead.created_at, locale)}</p>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-diyar-dark hover:bg-gray-50 transition cursor-pointer shrink-0"
        >
          <Eye size={16} />
          {t('b2b.partner.leads.viewDetail')}
        </button>
      </div>
    </article>
  );
}

type CustomerB2bLeadsPanelProps = {
  highlightId?: string | null;
};

export function CustomerB2bLeadsPanel({ highlightId = null }: CustomerB2bLeadsPanelProps) {
  const { t, locale } = useLocale();
  const [activeFilter, setActiveFilter] = useState<B2bLeadStatus | 'all'>('all');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const { page, perPage, perPageOptions, onPageChange, onPerPageChange } = usePaginationState();
  const listQuery = useCustomerB2bLeads(page, perPage);

  const filteredItems = useMemo(() => {
    const items = listQuery.data?.items ?? [];
    if (activeFilter === 'all') {
      return items;
    }
    return items.filter((item) => item.status === activeFilter);
  }, [activeFilter, listQuery.data?.items]);

  if (listQuery.isLoading) {
    return <LoadingState message={t('b2b.customerLeads.loading')} className="min-h-48" />;
  }

  if (listQuery.isError) {
    return (
      <ErrorState
        message={t('b2b.customerLeads.loadError')}
        onRetry={() => void listQuery.refetch()}
      />
    );
  }

  const items = listQuery.data?.items ?? [];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveFilter(filter)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
              activeFilter === filter
                ? 'bg-diyar-dark text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-diyar-brown/30'
            }`}
          >
            {t(`b2b.partner.leads.filters.${filter}`)}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title={t('b2b.customerLeads.emptyTitle')}
          description={t('b2b.customerLeads.emptyDescription')}
          action={
            <Link to="/b2b" className="text-diyar-brown font-bold hover:text-diyar-dark">
              {t('b2b.customerLeads.browseDirectory')}
            </Link>
          }
        />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          title={t('b2b.customerLeads.filteredEmptyTitle')}
          description={t('b2b.customerLeads.filteredEmptyDescription')}
        />
      ) : (
        <>
          <div className={`space-y-3 ${listQuery.isFetching ? 'opacity-70' : ''}`}>
            {filteredItems.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                highlighted={highlightId === lead.id}
                onOpen={() => setSelectedLeadId(lead.id)}
              />
            ))}
          </div>

          {listQuery.data?.pagination ? (
            <PaginationBar
              pagination={listQuery.data.pagination}
              page={page}
              perPage={perPage}
              perPageOptions={[...perPageOptions]}
              onPageChange={onPageChange}
              onPerPageChange={onPerPageChange}
              alwaysShow={listQuery.data.pagination.total > 0}
            />
          ) : null}
        </>
      )}

      {selectedLeadId ? (
        <LeadDetailModal leadId={selectedLeadId} onClose={() => setSelectedLeadId(null)} />
      ) : null}
    </section>
  );
}
