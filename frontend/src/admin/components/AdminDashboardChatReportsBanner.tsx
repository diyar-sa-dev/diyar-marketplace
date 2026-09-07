import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, MessageSquareWarning, ShieldAlert } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale.ts';
import { formatLocaleNumber } from '../../lib/intlLocale.ts';

type AdminDashboardChatReportsBannerProps = {
  pendingCount: number;
  isLoading: boolean;
};

export function AdminDashboardChatReportsBanner({
  pendingCount,
  isLoading,
}: AdminDashboardChatReportsBannerProps) {
  const { t, locale, dir } = useLocale();
  const isRtl = dir === 'rtl';
  const Arrow = isRtl ? ArrowLeft : ArrowRight;
  const hasPending = pendingCount > 0;

  return (
    <Link
      to="/admin/chat"
      className={`group relative block overflow-hidden rounded-3xl border p-5 shadow-sm transition duration-200 sm:p-6 ${
        hasPending
          ? 'border-rose-200/80 bg-linear-to-br from-rose-50 via-white to-orange-50 hover:border-rose-300 hover:shadow-md'
          : 'border-gray-100 bg-linear-to-br from-[#faf8f5] via-white to-emerald-50/40 hover:border-diyar-brown/25 hover:shadow-md'
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
              hasPending ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {hasPending ? <ShieldAlert size={26} /> : <MessageSquareWarning size={26} />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-extrabold text-diyar-dark">
                {t('admin.dashboard.quickActions.chatReports')}
              </h3>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                  hasPending
                    ? 'bg-rose-200/80 text-rose-900'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {isLoading
                  ? '…'
                  : hasPending
                    ? t('admin.dashboard.quickActions.pendingReports', {
                        count: formatLocaleNumber(pendingCount, locale),
                      })
                    : t('admin.dashboard.quickActions.chatReportsClear')}
              </span>
            </div>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-gray-600">
              {t('admin.dashboard.quickActions.chatReportsHint')}
            </p>
          </div>
        </div>

        <span
          className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
            hasPending
              ? 'bg-rose-600 text-white group-hover:bg-rose-700'
              : 'bg-diyar-dark text-white group-hover:bg-diyar-dark/90'
          }`}
        >
          {t('admin.dashboard.quickActions.chatReportsAction')}
          <Arrow size={16} className="transition group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
