import { Store } from 'lucide-react';
import { UserAvatar } from '../profile/UserAvatar.tsx';
import { formatRelativeReviewDate } from '../../lib/formatRelativeReviewDate.ts';
import type { Locale } from '../../lib/i18n/types.ts';

interface VendorReplyBlockProps {
  reply: string;
  repliedBy?: string | null;
  repliedAt?: string | null;
  avatarUrl?: string | null;
  locale: Locale;
  t: (key: string) => string;
  compact?: boolean;
}

export function VendorReplyBlock({
  reply,
  repliedBy,
  repliedAt,
  avatarUrl,
  locale,
  t,
  compact = false,
}: VendorReplyBlockProps) {
  const displayName = repliedBy ?? t('customerReviews.vendorReplyDefaultAuthor');

  return (
    <article
      className={`rounded-2xl border border-amber-100 bg-linear-to-br from-amber-50/80 to-orange-50/40 ${
        compact ? 'p-3.5' : 'p-5'
      } shadow-sm`}
    >
      <div className="flex items-start gap-3 mb-3">
        {avatarUrl ? (
          <UserAvatar name={displayName} avatarUrl={avatarUrl} size="sm" />
        ) : (
          <div
            className={`shrink-0 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center ${
              compact ? 'w-9 h-9' : 'w-10 h-10'
            }`}
          >
            <Store size={compact ? 16 : 18} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <span className={`font-bold text-diyar-dark block ${compact ? 'text-xs' : 'text-sm'}`}>
                {displayName}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-amber-700/80 font-bold">
                {t('customerReviews.vendorReplyTitle')}
              </span>
            </div>
            {repliedAt && (
              <time
                dateTime={repliedAt}
                className="text-xs text-gray-400 tabular-nums shrink-0"
                dir="ltr"
              >
                {formatRelativeReviewDate(repliedAt, locale)}
              </time>
            )}
          </div>
        </div>
      </div>
      <p className={`text-gray-700 leading-relaxed ${compact ? 'text-xs' : 'text-sm'}`}>{reply}</p>
    </article>
  );
}
