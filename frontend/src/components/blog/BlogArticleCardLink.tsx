import { Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatBlogReadingTime } from '../../lib/formatBlogReadingTime.ts';
import { formatLocaleDate } from '../../lib/intlLocale.ts';
import type { Locale } from '../../lib/i18n/types.ts';
import type { BlogArticleCard } from '../../types/blog.ts';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=600';

export function BlogArticleCardLink({
  article,
  locale,
}: {
  article: BlogArticleCard;
  locale: Locale;
}) {
  const formattedDate = article.published_at
    ? formatLocaleDate(article.published_at, locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  return (
    <Link
      to={`/blog/${article.slug}`}
      data-testid={`blog-article-card-${article.slug}`}
      className="group cursor-pointer bg-gray-50 rounded-3xl overflow-hidden border border-gray-100 hover:shadow-md hover:border-diyar-brown/20 transition-all h-full flex flex-col"
    >
      <div className="h-48 overflow-hidden relative shrink-0">
        {article.category?.name && (
          <span className="absolute top-4 right-4 bg-white/90 backdrop-blur text-diyar-dark text-xs font-bold px-3 py-1.5 rounded-full z-10">
            {article.category.name}
          </span>
        )}
        <img
          src={article.hero_image ?? FALLBACK_IMAGE}
          alt={article.title}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
          }}
        />
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
          <Calendar size={14} />
          <span>{formattedDate}</span>
          {article.reading_time_minutes ? (
            <>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span>{formatBlogReadingTime(article.reading_time_minutes, locale)}</span>
            </>
          ) : null}
        </div>
        <h3 className="font-bold text-lg text-diyar-dark group-hover:text-diyar-brown transition-colors line-clamp-2 leading-snug">
          {article.title}
        </h3>
        {article.excerpt ? (
          <p className="mt-2 text-sm text-gray-500 line-clamp-2 leading-relaxed">{article.excerpt}</p>
        ) : null}
      </div>
    </Link>
  );
}
