import { useEffect, useState } from 'react';
import { Loader2, ShieldAlert, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchChatReportReasons } from '../../api/chat.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { vendorButtonClass } from '../../lib/vendorProductValidation.ts';
import type { ChatMessage } from '../../types/chat.ts';

type ChatReportMessageDialogProps = {
  open: boolean;
  message: ChatMessage | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: { reason: string; details?: string }) => void;
};

export function ChatReportMessageDialog({
  open,
  message,
  isSubmitting = false,
  onClose,
  onSubmit,
}: ChatReportMessageDialogProps) {
  const { t, dir } = useLocale();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');

  const reasonsQuery = useQuery({
    queryKey: ['chat', 'report-reasons'],
    queryFn: fetchChatReportReasons,
    staleTime: 300_000,
    enabled: open,
  });

  useEffect(() => {
    if (!open) {
      setReason('');
      setDetails('');
    }
  }, [open, message?.id]);

  useEffect(() => {
    if (!reason && reasonsQuery.data?.length) {
      setReason(reasonsQuery.data[0].value);
    }
  }, [reason, reasonsQuery.data]);

  if (!open || !message) {
    return null;
  }

  const preview = message.body?.trim() || t('chat.reportDialog.attachmentOnly');
  const requiresDetails = reason === 'other';
  const canSubmit = Boolean(reason) && (!requiresDetails || details.trim().length >= 10);

  return (
    <div
      className="fixed inset-0 z-300 bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      dir={dir}
      data-testid="chat-report-dialog"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className={`${vendorButtonClass} absolute top-4 inset-s-4 text-gray-400 hover:text-diyar-dark p-2 disabled:opacity-50`}
          aria-label={t('chat.reportDialog.cancel')}
        >
          <X size={18} />
        </button>

        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
          <ShieldAlert size={22} />
        </div>

        <h3 className="text-lg font-bold text-diyar-dark mb-1">{t('chat.reportDialog.title')}</h3>
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">{t('chat.reportDialog.subtitle')}</p>

        <blockquote className="rounded-xl border border-gray-100 bg-[#f7f4f1]/70 px-4 py-3 text-sm text-diyar-dark mb-5 line-clamp-3">
          {preview}
        </blockquote>

        {reasonsQuery.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500 py-6">
            <Loader2 size={16} className="animate-spin" />
            {t('chat.reportDialog.loadingReasons')}
          </div>
        ) : reasonsQuery.isError ? (
          <p className="text-sm text-red-600 mb-4">{t('chat.reportDialog.reasonsError')}</p>
        ) : (
          <fieldset className="space-y-2 mb-4">
            <legend className="text-sm font-semibold text-diyar-dark mb-2">
              {t('chat.reportDialog.chooseReason')}
            </legend>
            {(reasonsQuery.data ?? []).map((option) => (
              <label
                key={option.value}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition ${
                  reason === option.value
                    ? 'border-diyar-brown bg-diyar-brown/5'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name="chat-report-reason"
                  value={option.value}
                  checked={reason === option.value}
                  onChange={() => setReason(option.value)}
                  className="accent-diyar-brown"
                />
                <span className="text-sm font-medium text-diyar-dark">{option.label}</span>
              </label>
            ))}
          </fieldset>
        )}

        <label className="block mb-5">
          <span className="text-sm font-semibold text-diyar-dark">
            {requiresDetails
              ? t('chat.reportDialog.detailsRequired')
              : t('chat.reportDialog.detailsOptional')}
          </span>
          <textarea
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            rows={3}
            maxLength={1000}
            placeholder={t('chat.reportDialog.detailsPlaceholder')}
            className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-diyar-brown/30"
          />
        </label>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className={`${vendorButtonClass} px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50 rounded-xl disabled:opacity-50`}
          >
            {t('chat.reportDialog.cancel')}
          </button>
          <button
            type="button"
            disabled={!canSubmit || isSubmitting || reasonsQuery.isLoading}
            onClick={() => onSubmit({ reason, details: details.trim() || undefined })}
            className={`${vendorButtonClass} px-5 py-2.5 text-sm bg-diyar-brown text-white rounded-xl hover:bg-[#A67B5B]/90 disabled:opacity-50 inline-flex items-center gap-2`}
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
            {t('chat.reportDialog.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
