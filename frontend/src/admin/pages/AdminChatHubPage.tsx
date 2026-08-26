import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, ShieldAlert } from 'lucide-react';
import { adminApi } from '../../api/client.ts';
import { useAdminAuth } from '../auth/AdminAuthContext.tsx';
import { useLocale } from '../../hooks/useLocale.ts';
import { intlLocaleTag } from '../../lib/intlLocale.ts';
import type { ApiSuccessResponse } from '../../types/api.ts';
import { AdminResourceTable } from '../components/AdminResourceTable.tsx';
import { AdminStatusBadge } from '../components/AdminStatusBadge.tsx';
import { AdminTablePagination } from '../components/AdminTablePagination.tsx';
import { useAdminListQuery } from '../hooks/useAdminListQuery.ts';
import {
  localizedChatReportAction,
  localizedChatReportReason,
  localizedChatReportStatus,
} from '../utils/localizedChatReport.ts';
import { parseApiError } from '../../utils/errors.ts';
import { useToast } from '../../hooks/useToast.ts';
import { AdminChatReportDetailSkeleton } from '../components/chat/AdminChatReportDetailSkeleton.tsx';
import {
  AdminChatReportActionPanel,
  type ModerationActionType,
  type ReportDecision,
} from '../components/chat/AdminChatReportActionPanel.tsx';

type ReportRow = {
  id: string;
  reason?: string;
  status?: string;
  reporter_name?: string | null;
  conversation_id?: string;
  created_at?: string;
  details?: string | null;
  resolution_note?: string | null;
  action_taken?: string | null;
  reviewed_at?: string | null;
  message?: MessageRow | null;
};

type MessageRow = {
  id: string;
  sender_name?: string | null;
  body?: string | null;
  created_at?: string;
  is_deleted?: boolean;
};

type ConversationRow = {
  id: string;
  subject?: string | null;
  participants?: Array<{ name?: string | null }>;
};

type ReportDetail = {
  report: ReportRow;
  conversation: ConversationRow;
  messages: MessageRow[];
};

const REPORT_REASONS = [
  'spam',
  'harassment',
  'inappropriate',
  'scam',
  'hate_speech',
  'impersonation',
  'other',
] as const;

function formatMessageTime(iso: string | undefined, locale: string): string {
  if (!iso) {
    return '';
  }

  return new Date(iso).toLocaleString(intlLocaleTag(locale), {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export default function AdminChatHubPage() {
  const { t, locale } = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasPermission, refreshSession } = useAdminAuth();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    paramFilter: reasonFilter,
    setParamFilter: setReasonFilter,
    page,
    setPage,
    refetch,
  } = useAdminListQuery<ReportRow>({
    resourceKey: 'admin-chat-reports',
    endpoint: '/admin/chat/reports',
    itemsKey: 'reports',
    paramFilterKey: 'reason',
    enabled: hasPermission('chat.view'),
  });

  const reportDetailQuery = useQuery({
    queryKey: ['admin-chat-report-detail', selectedReportId],
    enabled: selectedReportId !== null && hasPermission('chat.view'),
    queryFn: async () => {
      const response = await adminApi.get<ApiSuccessResponse<ReportDetail>>(
        `/admin/chat/reports/${selectedReportId}`,
      );

      return response.data.data;
    },
  });

  const resolveReportMutation = useMutation({
    mutationFn: async ({
      reportId,
      status,
      note,
      actionTaken,
    }: {
      reportId: string;
      status: ReportDecision;
      note: string;
      actionTaken: string;
    }) => {
      const response = await adminApi.patch<ApiSuccessResponse<{ report: ReportRow }>>(
        `/admin/chat/reports/${reportId}`,
        {
          status,
          resolution_note: note.trim() || null,
          action_taken: actionTaken,
        },
      );

      return response.data.data.report;
    },
    onSuccess: (report, variables) => {
      const isTerminal = !['pending', 'under_review'].includes(variables.status);
      toast.success(
        variables.status === 'under_review'
          ? t('admin.chat.actions.markValidSuccess')
          : t('admin.chat.actions.success'),
      );
      queryClient.setQueryData<ReportDetail>(
        ['admin-chat-report-detail', variables.reportId],
        (current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            report: {
              ...current.report,
              ...report,
            },
          };
        },
      );
      void queryClient.invalidateQueries({ queryKey: ['admin-chat-reports'] });
      void queryClient.invalidateQueries({
        queryKey: ['admin-chat-report-detail', variables.reportId],
      });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard', 'activity'] });
      void refetch();
      if (isTerminal) {
        setSelectedReportId(null);
      }
    },
    onError: (error) => {
      toast.error(parseApiError(error, locale).message || t('admin.chat.actions.error'));
    },
  });

  const submitDecision = (status: ReportDecision, note: string, actionTaken: string) => {
    if (!selectedReportId) {
      return;
    }

    resolveReportMutation.mutate({
      reportId: selectedReportId,
      status,
      note,
      actionTaken,
    });
  };

  const items = data?.items ?? [];
  const meta = data?.meta;
  const showListSkeleton = isLoading || (isFetching && items.length === 0);
  const isSearching = isFetching && search.trim().length > 0;
  const selectedReport = reportDetailQuery.data?.report;
  const reportedMessageId = selectedReport?.message?.id ?? null;
  const reportStatus = selectedReport?.status;
  const showInitialPanel = reportStatus === 'pending';
  const showContinuationPanel = reportStatus === 'under_review';
  const showFinalSummary =
    reportStatus !== undefined && ['dismissed', 'actioned', 'resolved'].includes(reportStatus);
  const panelRevision = `${reportStatus ?? 'none'}-${selectedReport?.reviewed_at ?? ''}-${selectedReport?.resolution_note ?? ''}`;
  const contextMessages = reportDetailQuery.data?.messages ?? [];

  if (!hasPermission('chat.view')) {
    return (
      <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-6 text-sm text-amber-900">
        <p className="font-bold">{t('admin.chat.accessDeniedTitle')}</p>
        <p className="mt-2">{t('admin.chat.accessDeniedHint')}</p>
        <button
          type="button"
          className="mt-4 rounded-xl bg-diyar-dark px-4 py-2 text-white font-semibold cursor-pointer"
          onClick={() => void refreshSession({ silent: true })}
        >
          {t('admin.chat.refreshPermissions')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-diyar-dark">{t('admin.chat.title')}</h2>
          <p className="mt-1 text-sm text-gray-500">{t('admin.chat.reportsSubtitle')}</p>
        </div>
        {meta ? (
          <p className="rounded-full bg-[#f7f4f1] px-3 py-1 text-xs font-semibold text-gray-600">
            {meta.total} {t('admin.chat.reports').toLowerCase()}
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <AdminResourceTable
          title={t('admin.chat.reports')}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder={t('admin.chat.searchReports')}
          filters={
            <div className="flex flex-wrap gap-2">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
              >
                <option value="">{t('admin.chat.filters.allStatuses')}</option>
                <option value="pending">{t('admin.chat.filters.pending')}</option>
                <option value="under_review">{t('admin.chat.filters.underReview')}</option>
                <option value="dismissed">{t('admin.chat.filters.dismissed')}</option>
                <option value="actioned">{t('admin.chat.filters.actioned')}</option>
                <option value="resolved">{t('admin.chat.filters.resolved')}</option>
              </select>
              <select
                value={reasonFilter}
                onChange={(event) => setReasonFilter(event.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
              >
                <option value="">{t('admin.chat.filters.allReasons')}</option>
                {REPORT_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {localizedChatReportReason(reason, t)}
                  </option>
                ))}
              </select>
            </div>
          }
          actions={
            isSearching ? (
              <span className="inline-flex items-center gap-2 text-xs text-gray-500">
                <Loader2 size={14} className="animate-spin" />
                {t('admin.chat.searching')}
              </span>
            ) : null
          }
          isLoading={showListSkeleton}
          isError={isError}
          isEmpty={!showListSkeleton && items.length === 0}
          emptyTitle={t('admin.chat.emptyReports')}
          columns={
            <tr>
              <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.reference')}</th>
              <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.name')}</th>
              <th className="px-4 py-3 text-start font-semibold">
                {t('admin.chat.table.submittedAt')}
              </th>
              <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.status')}</th>
            </tr>
          }
          footer={
            <AdminTablePagination
              meta={meta}
              page={page}
              onPageChange={setPage}
              isLoading={showListSkeleton}
            />
          }
        >
          {items.map((report) => (
            <tr
              key={report.id}
              className={`cursor-pointer transition hover:bg-[#f7f4f1]/50 ${
                selectedReportId === report.id ? 'bg-[#f7f4f1]' : ''
              }`}
              onClick={() => setSelectedReportId(report.id)}
            >
              <td className="px-4 py-3 font-mono text-xs text-gray-600">{report.id.slice(0, 8)}</td>
              <td className="px-4 py-3 text-sm text-gray-700">
                <div className="font-medium text-diyar-dark">
                  {localizedChatReportReason(report.reason, t)}
                </div>
                <div className="text-xs text-gray-500">{report.reporter_name ?? '—'}</div>
              </td>
              <td className="px-4 py-3 text-xs text-gray-500">
                {formatMessageTime(report.created_at, locale)}
              </td>
              <td className="px-4 py-3">
                {report.status ? (
                  <AdminStatusBadge
                    status={report.status}
                    label={localizedChatReportStatus(report.status, t)}
                  />
                ) : (
                  '—'
                )}
              </td>
            </tr>
          ))}
        </AdminResourceTable>

        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm min-h-128">
          {!selectedReportId ? (
            <div className="flex min-h-72 flex-col items-center justify-center text-center text-gray-500">
              <ShieldAlert className="mb-3 h-10 w-10 text-gray-300" />
              <p className="font-semibold text-diyar-dark">{t('admin.chat.selectReport')}</p>
              <p className="mt-1 max-w-sm text-sm">{t('admin.chat.selectReportHint')}</p>
            </div>
          ) : reportDetailQuery.isLoading ? (
            <AdminChatReportDetailSkeleton />
          ) : reportDetailQuery.isError ? (
            <div className="flex min-h-72 flex-col items-center justify-center text-center text-red-500">
              <ShieldAlert className="mb-3 h-10 w-10" />
              <p>{t('admin.chat.loadError')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-diyar-dark">
                    {localizedChatReportReason(selectedReport?.reason, t)}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {t('admin.chat.reportedBy', {
                      name: selectedReport?.reporter_name ?? t('admin.chat.unknownSender'),
                    })}
                  </p>
                  {selectedReport?.created_at ? (
                    <p className="mt-1 text-xs text-gray-400">
                      {formatMessageTime(selectedReport.created_at, locale)}
                    </p>
                  ) : null}
                </div>
                {selectedReport?.status ? (
                  <AdminStatusBadge
                    status={selectedReport.status}
                    label={localizedChatReportStatus(selectedReport.status, t)}
                  />
                ) : null}
              </div>

              {selectedReport?.details ? (
                <blockquote className="rounded-xl border-s-4 border-amber-300 bg-[#faf9f7] p-3 text-sm text-gray-700">
                  {selectedReport.details}
                </blockquote>
              ) : null}

              <div>
                <h4 className="mb-2 text-sm font-semibold text-diyar-dark">
                  {t('admin.chat.reportedMessage')}
                </h4>
                <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/60 p-4 text-sm text-gray-700 whitespace-pre-wrap">
                  {selectedReport?.message?.is_deleted
                    ? t('admin.chat.messageDeleted')
                    : (selectedReport?.message?.body ?? '—')}
                </div>
              </div>

              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-diyar-dark">
                    {t('admin.chat.conversationContext')}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {t('admin.chat.contextHint', { count: contextMessages.length })}
                  </p>
                </div>
                <p className="mb-3 text-xs text-gray-500">
                  {reportDetailQuery.data?.conversation.participants
                    ?.map((participant) => participant.name)
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                <div className="max-h-56 space-y-2 overflow-y-auto rounded-2xl bg-[#faf9f7] p-3">
                  {contextMessages.length === 0 ? (
                    <p className="text-sm text-gray-500">—</p>
                  ) : (
                    contextMessages.map((message) => {
                      const isReported = message.id === reportedMessageId;

                      return (
                        <div
                          key={message.id}
                          className={`rounded-xl px-3 py-2 text-sm shadow-sm ${
                            isReported ? 'border-2 border-amber-300 bg-amber-50' : 'bg-white'
                          }`}
                        >
                          <div className="mb-1 flex justify-between gap-3 text-xs text-gray-500">
                            <span>{message.sender_name ?? t('admin.chat.unknownSender')}</span>
                            <span>{formatMessageTime(message.created_at, locale)}</span>
                          </div>
                          {isReported ? (
                            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                              {t('admin.chat.reportedMessageHighlight')}
                            </p>
                          ) : null}
                          <p className="whitespace-pre-wrap text-gray-700">
                            {message.is_deleted
                              ? t('admin.chat.messageDeleted')
                              : (message.body ?? '—')}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {showContinuationPanel && selectedReport?.resolution_note?.trim() ? (
                <div className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-blue-950">
                  <p className="font-semibold">{t('admin.chat.actions.underReviewBanner')}</p>
                  <blockquote className="mt-2 rounded-xl border border-blue-100 bg-white px-3 py-2 text-gray-700">
                    {selectedReport.resolution_note}
                  </blockquote>
                </div>
              ) : null}

              {showInitialPanel || showContinuationPanel ? (
                <AdminChatReportActionPanel
                  key={`${selectedReportId}-${panelRevision}`}
                  mode={showInitialPanel ? 'initial' : 'continuation'}
                  isSubmitting={resolveReportMutation.isPending}
                  onDismiss={(note) => submitDecision('dismissed', note, 'none')}
                  onMarkValid={(note) => submitDecision('under_review', note, 'none')}
                  onResolve={(note) => submitDecision('resolved', note, 'closed')}
                  onTakeAction={(action: ModerationActionType, note) =>
                    submitDecision('actioned', note, action)
                  }
                />
              ) : showFinalSummary ? (
                <div className="space-y-3 rounded-2xl border border-gray-100 bg-[#faf9f7] px-4 py-4 text-sm text-gray-600">
                  <p className="font-semibold text-diyar-dark">
                    {t('admin.chat.actions.resolutionSummary')}
                  </p>
                  {selectedReport?.reviewed_at ? (
                    <p className="text-xs text-gray-500">
                      {t('admin.chat.actions.reviewedAt', {
                        date: formatMessageTime(selectedReport.reviewed_at, locale),
                      })}
                    </p>
                  ) : null}
                  {selectedReport?.action_taken && selectedReport.action_taken !== 'none' ? (
                    <p>
                      <span className="font-medium text-diyar-dark">
                        {t('admin.chat.actions.actionTakenLabel')}:
                      </span>{' '}
                      {localizedChatReportAction(selectedReport.action_taken, t)}
                    </p>
                  ) : null}
                  <blockquote className="rounded-xl border border-gray-100 bg-white px-3 py-2 text-gray-700">
                    {selectedReport?.resolution_note?.trim()
                      ? selectedReport.resolution_note
                      : t('admin.chat.actions.noResolutionNote')}
                  </blockquote>
                  <p className="text-xs text-gray-400">{t('admin.chat.actions.alreadyResolved')}</p>
                </div>
              ) : null}

              <p className="text-xs text-gray-400">{t('admin.chat.readOnlyNotice')}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
