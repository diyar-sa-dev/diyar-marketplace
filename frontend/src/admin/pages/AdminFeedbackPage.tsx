import { Loader2, Megaphone, PanelTop, RotateCcw, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { AdminResourceTable } from '../components/AdminResourceTable.tsx';
import { AdminTablePagination } from '../components/AdminTablePagination.tsx';
import { AdminBroadcastModal } from '../components/AdminBroadcastModal.tsx';
import { AdminAnnouncementModal } from '../components/AdminAnnouncementModal.tsx';
import {
  AdminFeedbackRatingFilter,
  FeedbackRatingStars,
} from '../components/AdminFeedbackRatingFilter.tsx';
import { useAdminListQuery } from '../hooks/useAdminListQuery.ts';
import { deleteAdminFeedback } from '../api/adminEngagement.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { formatLocaleDateTime } from '../../lib/intlLocale.ts';
import { TableLtrValue } from '../../components/common/TableLtrValue.tsx';
import { confirmDeleteFeedback } from '../../lib/confirmDialog.ts';
import { adminQueryKey } from '../../lib/auth/queryKeys.ts';
import type { WebsiteFeedbackType } from '../../lib/websiteFeedbackStorage.ts';

type FeedbackRow = {
  id: string;
  rating: number;
  type: WebsiteFeedbackType;
  message: string;
  created_at?: string;
  user?: { name?: string; email?: string | null } | null;
};

type FeedbackListData = {
  items: FeedbackRow[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

const FEEDBACK_QUERY_KEY = adminQueryKey('admin-feedback');

const FILTER_SELECT =
  'rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition hover:border-diyar-brown focus:border-diyar-brown cursor-pointer';

const FEEDBACK_TYPES: WebsiteFeedbackType[] = ['general', 'search', 'checkout', 'design', 'bug'];

function ratingBadgeClass(rating: number): string {
  if (rating >= 4) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (rating === 3) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-red-50 text-red-700 border-red-200';
}

function typeBadgeClass(type: WebsiteFeedbackType): string {
  const map: Record<WebsiteFeedbackType, string> = {
    general: 'bg-slate-50 text-slate-700 border-slate-200',
    search: 'bg-sky-50 text-sky-700 border-sky-200',
    checkout: 'bg-violet-50 text-violet-700 border-violet-200',
    design: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
    bug: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  return map[type];
}

export default function AdminFeedbackPage() {
  const { t, locale } = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [ratingFilter, setRatingFilter] = useState('');
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    search,
    setSearch,
    paramFilter: typeFilter,
    setParamFilter: setTypeFilter,
    page,
    setPage,
    perPage,
    setPerPage,
  } = useAdminListQuery<FeedbackRow>({
    resourceKey: 'admin-feedback',
    endpoint: '/admin/feedback',
    itemsKey: 'feedback',
    paramFilterKey: 'type',
    extraParams: { rating: ratingFilter || undefined },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminFeedback,
    onMutate: async (deletedId) => {
      setDeletingId(deletedId);
      await queryClient.cancelQueries({ queryKey: FEEDBACK_QUERY_KEY });

      const previousEntries = queryClient.getQueriesData<FeedbackListData>({
        queryKey: FEEDBACK_QUERY_KEY,
      });

      queryClient.setQueriesData<FeedbackListData>({ queryKey: FEEDBACK_QUERY_KEY }, (current) => {
        if (!current) {
          return current;
        }

        const nextItems = current.items.filter((item) => item.id !== deletedId);
        if (nextItems.length === current.items.length) {
          return current;
        }

        return {
          items: nextItems,
          meta: {
            ...current.meta,
            total: Math.max(0, current.meta.total - 1),
          },
        };
      });

      return { previousEntries };
    },
    onSuccess: async () => {
      toast.success(t('admin.feedback.deleted'));
      await queryClient.invalidateQueries({ queryKey: FEEDBACK_QUERY_KEY });
    },
    onError: (_error, _deletedId, context) => {
      context?.previousEntries.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      toast.error(t('admin.feedback.deleteError'));
    },
    onSettled: () => setDeletingId(null),
  });

  const rows = data?.items ?? [];
  const meta = data?.meta;
  const showListSkeleton = isLoading || (isFetching && rows.length === 0);
  const isSearching = isFetching && search.trim().length > 0;

  const typeOptions = useMemo(
    () =>
      FEEDBACK_TYPES.map((value) => ({
        value,
        label: t(`admin.feedback.types.${value}` as never),
      })),
    [t],
  );

  const hasActiveFilters = Boolean(typeFilter || ratingFilter || search.trim());

  const resetFilters = () => {
    setTypeFilter('');
    setRatingFilter('');
    setSearch('');
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmDeleteFeedback(t);
    if (!confirmed) {
      return;
    }
    deleteMutation.mutate(id);
  };

  return (
    <>
      <AdminResourceTable
        title={t('admin.feedback.title')}
        subtitle={t('admin.feedback.subtitle')}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('admin.feedback.searchPlaceholder')}
        filters={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className={`${FILTER_SELECT} w-full sm:w-auto sm:min-w-[10rem]`}
            >
              <option value="">{t('admin.feedback.allTypes')}</option>
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <AdminFeedbackRatingFilter
              value={ratingFilter}
              onChange={(next) => {
                setRatingFilter(next);
                setPage(1);
              }}
              compact
            />
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-bold text-gray-600 transition hover:border-diyar-brown hover:text-diyar-dark sm:w-auto"
              >
                <RotateCcw size={14} />
                {t('admin.feedback.resetFilters')}
              </button>
            ) : null}
          </div>
        }
        actions={
          <>
            {isSearching ? (
              <span className="inline-flex items-center gap-2 text-xs text-gray-500">
                <Loader2 size={14} className="animate-spin" />
                {t('admin.tables.searching')}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => setBroadcastOpen(true)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#1f3d3a] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-black"
            >
              <Megaphone size={16} />
              {t('admin.feedback.broadcastCta')}
            </button>
            <button
              type="button"
              onClick={() => setAnnouncementOpen(true)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-diyar-brown/30 bg-diyar-cream/40 px-4 py-2.5 text-sm font-bold text-diyar-dark transition hover:bg-diyar-cream"
            >
              <PanelTop size={16} />
              {t('admin.feedback.bannerCta')}
            </button>
          </>
        }
        isLoading={showListSkeleton}
        isError={isError}
        isEmpty={!showListSkeleton && rows.length === 0}
        emptyTitle={t('admin.feedback.empty')}
        emptyDescription={t('admin.feedback.emptyDescription')}
        columns={
          <tr>
            <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
              {t('admin.feedback.columns.rating')}
            </th>
            <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
              {t('admin.feedback.columns.type')}
            </th>
            <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
              {t('admin.feedback.columns.message')}
            </th>
            <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
              {t('admin.feedback.columns.user')}
            </th>
            <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
              {t('admin.tables.createdAt')}
            </th>
            <th className="px-4 py-3 text-end text-xs font-bold uppercase tracking-wide text-gray-500">
              {t('admin.tables.actions')}
            </th>
          </tr>
        }
        footer={
          <AdminTablePagination
            meta={meta}
            page={page}
            onPageChange={setPage}
            perPage={perPage}
            onPerPageChange={setPerPage}
            isLoading={isFetching}
          />
        }
      >
        {rows.map((row) => (
          <tr
            key={row.id}
            className={`border-t border-gray-50 transition-all hover:bg-[#f7f4f1]/50 ${
              deletingId === row.id ? 'pointer-events-none opacity-40' : ''
            }`}
          >
            <td className="px-4 py-3">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 ${ratingBadgeClass(row.rating)}`}
              >
                <FeedbackRatingStars rating={row.rating} size={13} />
              </span>
            </td>
            <td className="px-4 py-3">
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${typeBadgeClass(row.type)}`}
              >
                {t(`admin.feedback.types.${row.type}` as never)}
              </span>
            </td>
            <td className="max-w-md px-4 py-3 text-sm text-gray-700">
              <p className="line-clamp-3 whitespace-pre-wrap">{row.message}</p>
            </td>
            <td className="px-4 py-3 text-sm">
              {row.user?.name ? (
                <div>
                  <p className="font-semibold text-diyar-dark">{row.user.name}</p>
                  {row.user.email ? (
                    <TableLtrValue className="text-xs text-gray-500">{row.user.email}</TableLtrValue>
                  ) : null}
                </div>
              ) : (
                <span className="text-gray-400">{t('admin.feedback.guest')}</span>
              )}
            </td>
            <td className="px-4 py-3 text-sm text-gray-500">
              {row.created_at ? formatLocaleDateTime(row.created_at, locale) : '—'}
            </td>
            <td className="px-4 py-3 text-end">
              <button
                type="button"
                onClick={() => void handleDelete(row.id)}
                disabled={deletingId === row.id}
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-red-100 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingId === row.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                {t('common.delete')}
              </button>
            </td>
          </tr>
        ))}
      </AdminResourceTable>

      <AdminBroadcastModal open={broadcastOpen} onClose={() => setBroadcastOpen(false)} />
      <AdminAnnouncementModal open={announcementOpen} onClose={() => setAnnouncementOpen(false)} />
    </>
  );
}
