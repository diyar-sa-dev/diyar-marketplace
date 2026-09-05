import { useState } from 'react';
import { Loader2, PanelTop, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { fetchAdminAnnouncement, updateAdminAnnouncement } from '../api/adminEngagement.ts';
import { adminQueryKey } from '../../lib/auth/queryKeys.ts';

type AdminAnnouncementModalProps = {
  open: boolean;
  onClose: () => void;
};

type AnnouncementDraft = {
  enabled: boolean;
  textAr: string;
  textEn: string;
  ctaAr: string;
  ctaEn: string;
  link: string;
};

export function AdminAnnouncementModal({ open, onClose }: AdminAnnouncementModalProps) {
  if (!open) {
    return null;
  }

  return <AdminAnnouncementModalContent onClose={onClose} />;
}

function AdminAnnouncementModalContent({ onClose }: { onClose: () => void }) {
  const { t } = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Partial<AnnouncementDraft>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: adminQueryKey('admin-announcement'),
    queryFn: fetchAdminAnnouncement,
  });

  const enabled = draft.enabled ?? data?.enabled ?? false;
  const textAr = draft.textAr ?? data?.text_ar ?? '';
  const textEn = draft.textEn ?? data?.text_en ?? '';
  const ctaAr = draft.ctaAr ?? data?.cta_ar ?? '';
  const ctaEn = draft.ctaEn ?? data?.cta_en ?? '';
  const link = draft.link ?? data?.link ?? '/';

  const updateDraft = (patch: Partial<AnnouncementDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const mutation = useMutation({
    mutationFn: updateAdminAnnouncement,
    onSuccess: async () => {
      toast.success(t('admin.feedback.bannerSuccess'));
      await queryClient.invalidateQueries({ queryKey: ['platform-announcement'] });
      await queryClient.invalidateQueries({ queryKey: adminQueryKey('admin-announcement') });
      onClose();
    },
    onError: () => toast.error(t('admin.feedback.bannerError')),
  });

  const validate = () => {
    const next: Record<string, string> = {};
    if (!textAr.trim()) next.text_ar = t('admin.feedback.bannerTextRequired');
    if (!textEn.trim()) next.text_en = t('admin.feedback.bannerTextRequired');
    if (!ctaAr.trim()) next.cta_ar = t('admin.feedback.bannerCtaRequired');
    if (!ctaEn.trim()) next.cta_en = t('admin.feedback.bannerCtaRequired');
    if (!link.trim()) next.link = t('admin.feedback.bannerLinkRequired');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      return;
    }
    mutation.mutate({
      enabled,
      text_ar: textAr.trim(),
      text_en: textEn.trim(),
      cta_ar: ctaAr.trim(),
      cta_en: ctaEn.trim(),
      link: link.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-100 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-2xl animate-in fade-in zoom-in-95 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl duration-200"
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 bg-linear-to-r from-diyar-cream/30 to-white px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-diyar-brown text-white">
              <PanelTop size={18} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-diyar-dark">{t('admin.feedback.bannerTitle')}</h3>
              <p className="mt-1 text-sm text-gray-500">{t('admin.feedback.bannerSubtitle')}</p>
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

        <div className="max-h-[calc(90vh-9rem)] space-y-4 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-diyar-brown" size={28} />
            </div>
          ) : (
            <>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(event) => updateDraft({ enabled: event.target.checked })}
                  className="h-4 w-4 cursor-pointer accent-diyar-brown"
                />
                <span className="text-sm font-bold text-diyar-dark">{t('admin.feedback.bannerEnabled')}</span>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-bold text-diyar-dark">{t('admin.feedback.bannerTextAr')}</label>
                  <textarea
                    rows={3}
                    value={textAr}
                    onChange={(event) => updateDraft({ textAr: event.target.value })}
                    placeholder={t('admin.feedback.bannerTextArPlaceholder')}
                    className="mt-2 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-diyar-brown"
                    dir="rtl"
                  />
                  {errors.text_ar ? <p className="mt-1 text-xs text-red-600">{errors.text_ar}</p> : null}
                </div>
                <div>
                  <label className="text-sm font-bold text-diyar-dark">{t('admin.feedback.bannerTextEn')}</label>
                  <textarea
                    rows={3}
                    value={textEn}
                    onChange={(event) => updateDraft({ textEn: event.target.value })}
                    placeholder={t('admin.feedback.bannerTextEnPlaceholder')}
                    className="mt-2 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-diyar-brown"
                    dir="ltr"
                  />
                  {errors.text_en ? <p className="mt-1 text-xs text-red-600">{errors.text_en}</p> : null}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-bold text-diyar-dark">{t('admin.feedback.bannerCtaAr')}</label>
                  <input
                    value={ctaAr}
                    onChange={(event) => updateDraft({ ctaAr: event.target.value })}
                    placeholder={t('admin.feedback.bannerCtaArPlaceholder')}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-diyar-brown"
                    dir="rtl"
                  />
                  {errors.cta_ar ? <p className="mt-1 text-xs text-red-600">{errors.cta_ar}</p> : null}
                </div>
                <div>
                  <label className="text-sm font-bold text-diyar-dark">{t('admin.feedback.bannerCtaEn')}</label>
                  <input
                    value={ctaEn}
                    onChange={(event) => updateDraft({ ctaEn: event.target.value })}
                    placeholder={t('admin.feedback.bannerCtaEnPlaceholder')}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-diyar-brown"
                    dir="ltr"
                  />
                  {errors.cta_en ? <p className="mt-1 text-xs text-red-600">{errors.cta_en}</p> : null}
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-diyar-dark">{t('admin.feedback.bannerLink')}</label>
                <input
                  value={link}
                  onChange={(event) => updateDraft({ link: event.target.value })}
                  placeholder={t('admin.feedback.bannerLinkPlaceholder')}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-diyar-brown"
                  dir="ltr"
                />
                {errors.link ? <p className="mt-1 text-xs text-red-600">{errors.link}</p> : null}
              </div>

              <div className="rounded-2xl border border-[#2a4a44] bg-linear-to-r from-[#132624] via-[#1a3330] to-[#132624] px-4 py-3 text-diyar-cream">
                <p className="text-[11px] uppercase tracking-wide text-white/60">{t('admin.feedback.bannerPreview')}</p>
                <p className="mt-2 text-sm">{textAr || textEn || t('admin.feedback.bannerPreviewEmpty')}</p>
                <span className="mt-2 inline-flex rounded-full bg-diyar-brown px-3 py-1 text-[10px] font-bold text-white">
                  {ctaAr || ctaEn || t('admin.feedback.bannerPreviewCtaFallback')}
                </span>
              </div>
            </>
          )}
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
            disabled={mutation.isPending || isLoading}
            onClick={handleSubmit}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-diyar-brown px-4 py-3 text-sm font-bold text-white transition hover:bg-[#856b54] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
