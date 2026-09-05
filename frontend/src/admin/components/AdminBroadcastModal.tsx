import { useEffect, useState } from 'react';
import { Loader2, Megaphone, X } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { createAdminBroadcast } from '../api/adminEngagement.ts';

type AdminBroadcastModalProps = {
  open: boolean;
  onClose: () => void;
};

export function AdminBroadcastModal({ open, onClose }: AdminBroadcastModalProps) {
  const { t } = useLocale();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      setTitle('');
      setBody('');
      setErrors({});
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: createAdminBroadcast,
    onSuccess: () => {
      toast.success(t('admin.feedback.broadcastSuccess'));
      onClose();
    },
    onError: () => toast.error(t('admin.feedback.broadcastError')),
  });

  if (!open) {
    return null;
  }

  const validate = () => {
    const next: Record<string, string> = {};
    if (!title.trim()) {
      next.title = t('admin.feedback.broadcastTitleRequired');
    }
    if (!body.trim()) {
      next.body = t('admin.feedback.broadcastBodyRequired');
    } else if (body.trim().length < 10) {
      next.body = t('admin.feedback.broadcastBodyMin');
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      return;
    }
    mutation.mutate({
      title: title.trim(),
      body: body.trim(),
      channels: ['in_app'],
      audience_type: 'all',
      category: 'system',
      priority: 'normal',
    });
  };

  return (
    <div className="fixed inset-0 z-100 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-lg animate-in fade-in zoom-in-95 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl duration-200"
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 bg-linear-to-r from-[#f7f4f1] to-white px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1f3d3a] text-white">
              <Megaphone size={18} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-diyar-dark">{t('admin.feedback.broadcastTitle')}</h3>
              <p className="mt-1 text-sm text-gray-500">{t('admin.feedback.broadcastSubtitle')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50"
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label htmlFor="broadcast-title" className="text-sm font-bold text-diyar-dark">
              {t('admin.feedback.broadcastFieldTitle')}
            </label>
            <input
              id="broadcast-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t('admin.feedback.broadcastTitlePlaceholder')}
              maxLength={255}
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown"
            />
            {errors.title ? <p className="mt-1 text-xs text-red-600">{errors.title}</p> : null}
          </div>

          <div>
            <label htmlFor="broadcast-body" className="text-sm font-bold text-diyar-dark">
              {t('admin.feedback.broadcastFieldBody')}
            </label>
            <textarea
              id="broadcast-body"
              rows={5}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={t('admin.feedback.broadcastBodyPlaceholder')}
              maxLength={5000}
              className="mt-2 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown"
            />
            {errors.body ? <p className="mt-1 text-xs text-red-600">{errors.body}</p> : null}
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-900">
            {t('admin.feedback.broadcastHint')}
          </div>
        </div>

        <div className="flex gap-3 border-t border-gray-100 bg-gray-50/80 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            disabled={mutation.isPending}
            onClick={handleSubmit}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1f3d3a] px-4 py-3 text-sm font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
            {t('admin.feedback.broadcastSend')}
          </button>
        </div>
      </div>
    </div>
  );
}
