import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserX,
} from 'lucide-react';
import { useLocale } from '../../../hooks/useLocale.ts';

export type ModerationActionType = 'delete_message' | 'warn_sender' | 'suspend_account';
export type ReportDecision = 'dismissed' | 'actioned' | 'resolved' | 'under_review';

type AdminChatReportActionPanelProps = {
  mode?: 'initial' | 'continuation';
  revisionKey?: string;
  isSubmitting: boolean;
  onDismiss: (note: string) => void;
  onResolve: (note: string) => void;
  onMarkValid: (note: string) => void;
  onTakeAction: (action: ModerationActionType, note: string) => void;
};

const ACTION_OPTIONS: Array<{
  id: ModerationActionType;
  icon: typeof Trash2;
  tone: 'danger' | 'warning' | 'neutral';
}> = [
  { id: 'delete_message', icon: Trash2, tone: 'danger' },
  { id: 'warn_sender', icon: ShieldAlert, tone: 'warning' },
  { id: 'suspend_account', icon: UserX, tone: 'neutral' },
];

export function AdminChatReportActionPanel({
  mode = 'initial',
  revisionKey = 'initial',
  isSubmitting,
  onDismiss,
  onResolve,
  onMarkValid,
  onTakeAction,
}: AdminChatReportActionPanelProps) {
  const { t } = useLocale();
  const [resolutionNote, setResolutionNote] = useState('');
  const [activeDecision, setActiveDecision] = useState<ReportDecision | null>(null);
  const [selectedAction, setSelectedAction] = useState<ModerationActionType>('delete_message');

  const resetDecision = () => {
    setActiveDecision(null);
    setResolutionNote('');
  };

  useEffect(() => {
    resetDecision();
  }, [revisionKey]);

  const actionPreview = useMemo(
    () => t(`admin.chat.actions.previews.${selectedAction}` as never),
    [selectedAction, t],
  );

  const noteTooShortForAction = activeDecision === 'actioned' && resolutionNote.trim().length < 10;

  const decisionButtons = [
    {
      decision: 'dismissed' as const,
      icon: ShieldCheck,
      tone: 'neutral' as const,
      title: t('admin.chat.actions.dismiss'),
      hint: t('admin.chat.actions.dismissHint'),
    },
    ...(mode === 'initial'
      ? [
          {
            decision: 'under_review' as const,
            icon: BadgeCheck,
            tone: 'info' as const,
            title: t('admin.chat.actions.markValid'),
            hint: t('admin.chat.actions.markValidHint'),
          },
        ]
      : []),
    {
      decision: 'actioned' as const,
      icon: AlertTriangle,
      tone: 'warning' as const,
      title: t('admin.chat.actions.actionTaken'),
      hint: t('admin.chat.actions.actionTakenHint'),
    },
    {
      decision: 'resolved' as const,
      icon: CheckCircle2,
      tone: 'success' as const,
      title: t('admin.chat.actions.resolve'),
      hint: t('admin.chat.actions.resolveHint'),
    },
  ];

  const toneClasses = {
    neutral: 'border-gray-200 bg-white hover:border-gray-300',
    info: 'border-blue-200 bg-blue-50/70 hover:border-blue-300',
    warning: 'border-amber-200 bg-amber-50/70 hover:border-amber-300',
    success: 'border-emerald-200 bg-emerald-50/70 hover:border-emerald-300',
  };

  const titleClasses = {
    neutral: 'text-diyar-dark',
    info: 'text-blue-900',
    warning: 'text-amber-900',
    success: 'text-emerald-900',
  };

  const hintClasses = {
    neutral: 'text-gray-500',
    info: 'text-blue-800/80',
    warning: 'text-amber-800/80',
    success: 'text-emerald-800/80',
  };

  return (
    <div className="space-y-4 rounded-2xl border border-gray-100 bg-[#faf9f7] p-4">
      <div>
        <h4 className="text-sm font-semibold text-diyar-dark">{t('admin.chat.actions.title')}</h4>
        <p className="mt-1 text-xs text-gray-500">
          {mode === 'continuation'
            ? t('admin.chat.actions.continuationSubtitle')
            : t('admin.chat.actions.subtitle')}
        </p>
      </div>

      {activeDecision === null ? (
        <div
          className={`grid gap-2 ${decisionButtons.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}
        >
          {decisionButtons.map(({ decision, icon: Icon, tone, title, hint }) => (
            <button
              key={decision}
              type="button"
              disabled={isSubmitting}
              onClick={() => setActiveDecision(decision)}
              className={`rounded-2xl border p-3 text-start transition disabled:opacity-60 cursor-pointer ${toneClasses[tone]}`}
            >
              <Icon
                size={18}
                className={
                  tone === 'info'
                    ? 'text-blue-700'
                    : tone === 'warning'
                      ? 'text-amber-700'
                      : tone === 'success'
                        ? 'text-emerald-700'
                        : 'text-gray-600'
                }
              />
              <p className={`mt-2 text-sm font-semibold ${titleClasses[tone]}`}>{title}</p>
              <p className={`mt-1 text-xs ${hintClasses[tone]}`}>{hint}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3 rounded-2xl border border-white bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-diyar-dark">
              {activeDecision === 'dismissed'
                ? t('admin.chat.actions.dismiss')
                : activeDecision === 'under_review'
                  ? t('admin.chat.actions.markValid')
                  : activeDecision === 'actioned'
                    ? t('admin.chat.actions.actionTaken')
                    : t('admin.chat.actions.resolve')}
            </p>
            <button
              type="button"
              onClick={resetDecision}
              className="text-xs font-medium text-gray-500 hover:text-diyar-dark cursor-pointer"
            >
              {t('admin.chat.actions.changeDecision')}
            </button>
          </div>

          {activeDecision === 'actioned' ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-600">
                {t('admin.chat.actions.chooseAction')}
              </p>
              <div className="grid gap-2">
                {ACTION_OPTIONS.map(({ id, icon: Icon, tone }) => {
                  const selected = selectedAction === id;
                  const toneClass =
                    tone === 'danger'
                      ? selected
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-200 bg-white hover:border-red-200'
                      : tone === 'warning'
                        ? selected
                          ? 'border-amber-300 bg-amber-50'
                          : 'border-gray-200 bg-white hover:border-amber-200'
                        : selected
                          ? 'border-gray-400 bg-gray-50'
                          : 'border-gray-200 bg-white hover:border-gray-300';

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedAction(id)}
                      className={`flex items-start gap-3 rounded-xl border p-3 text-start transition cursor-pointer ${toneClass}`}
                    >
                      <Icon size={18} className="mt-0.5 shrink-0" />
                      <span>
                        <span className="block text-sm font-semibold text-diyar-dark">
                          {t(`admin.chat.actions.types.${id}` as never)}
                        </span>
                        <span className="mt-0.5 block text-xs text-gray-500">
                          {t(`admin.chat.actions.typeHints.${id}` as never)}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="rounded-xl bg-[#faf9f7] px-3 py-2 text-xs text-gray-600">
                {actionPreview}
              </p>
            </div>
          ) : null}

          <label className="block text-xs font-medium text-gray-600">
            {activeDecision === 'actioned'
              ? t('admin.chat.actions.resolutionNoteRequired')
              : t('admin.chat.actions.resolutionNote')}
            <textarea
              value={resolutionNote}
              onChange={(event) => setResolutionNote(event.target.value)}
              rows={3}
              placeholder={
                activeDecision === 'actioned'
                  ? t('admin.chat.actions.resolutionNoteActionPlaceholder')
                  : t('admin.chat.actions.resolutionNotePlaceholder')
              }
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-diyar-dark outline-none focus:border-diyar-brown"
            />
          </label>

          {noteTooShortForAction ? (
            <p className="text-xs text-amber-700">{t('admin.chat.actions.noteTooShort')}</p>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              disabled={isSubmitting || noteTooShortForAction}
              onClick={() => {
                if (activeDecision === 'dismissed') {
                  onDismiss(resolutionNote);
                  return;
                }
                if (activeDecision === 'under_review') {
                  onMarkValid(resolutionNote);
                  return;
                }
                if (activeDecision === 'resolved') {
                  onResolve(resolutionNote);
                  return;
                }
                onTakeAction(selectedAction, resolutionNote);
              }}
              className="rounded-xl bg-diyar-dark px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? t('admin.chat.actions.submitting') : t('admin.chat.actions.confirm')}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={resetDecision}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 cursor-pointer"
            >
              {t('admin.chat.actions.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
