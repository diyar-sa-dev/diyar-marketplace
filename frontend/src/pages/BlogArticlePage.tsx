import React from 'react';
import {
  ChevronLeft,
  Calendar,
  Clock,
  Facebook,
  Twitter,
  Linkedin,
  Link as LinkIcon,
  Bookmark,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ErrorState } from '../components/common/ErrorState.tsx';
import NotFoundPage from './errors/NotFoundPage.tsx';
import { useBlogArticle } from '../hooks/blog/useBlogArticle.ts';
import { useLocale } from '../hooks/useLocale.ts';
import { formatBlogReadingTime } from '../lib/formatBlogReadingTime.ts';
import { formatLocaleDate } from '../lib/intlLocale.ts';
import { sanitizeHtml } from '../utils/sanitizeHtml.ts';
import { isNotFoundError } from '../utils/errors.ts';

const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=1600';
const FALLBACK_CARD_IMAGE =
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=600';

export default function BlogArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { locale } = useLocale();
  const { data, isPending, isError, error, refetch } = useBlogArticle(slug);

  if (isPending) {
    return (
      <div className="bg-gray-50 min-h-screen pb-24 md:pb-12 font-sans">
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 animate-pulse space-y-6">
          <div className="h-4 w-64 bg-gray-200 rounded" />
          <div className="h-10 w-full bg-gray-200 rounded" />
          <div className="h-72 bg-gray-200 rounded-3xl" />
          <div className="space-y-3">
            <div className="h-4 w-full bg-gray-200 rounded" />
            <div className="h-4 w-5/6 bg-gray-200 rounded" />
            <div className="h-4 w-4/6 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (isError && isNotFoundError(error)) {
    return <NotFoundPage />;
  }

  if (isError || !data) {
    return (
      <div className="bg-gray-50 min-h-screen pb-24 md:pb-12 font-sans">
        <ErrorState
          error={error}
          onRetry={() => void refetch()}
          title={locale === 'ar' ? 'تعذر تحميل المقال' : 'Unable to load article'}
        />
      </div>
    );
  }

  const { article, related } = data;
  const formattedDate = article.published_at
    ? formatLocaleDate(article.published_at, locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';
  const readTime = formatBlogReadingTime(article.reading_time_minutes, locale);
  const authorAvatar =
    article.author_avatar ??
    `https://ui-avatars.com/api/?name=${encodeURIComponent(article.author_name ?? 'Diyar')}&background=F3F4F6&color=4B5563`;
  const tags = article.tags ?? [];

  return (
    <div className="bg-gray-50 min-h-screen pb-24 md:pb-12 font-sans">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-diyar-dark transition">
              الرئيسية
            </Link>
            <ChevronLeft size={16} />
            <Link to="/blog" className="hover:text-diyar-dark transition">
              مدونة ديار
            </Link>
            <ChevronLeft size={16} />
            <span className="font-bold text-diyar-dark line-clamp-1 truncate max-w-xs">
              {article.title}
            </span>
          </div>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <header className="mb-8 md:mb-12">
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.slice(0, 2).map((tag) => (
              <span
                key={tag.id}
                className="bg-diyar-brown/10 text-diyar-brown text-xs font-bold px-3 py-1.5 rounded-full"
              >
                {tag.name}
              </span>
            ))}
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-diyar-dark leading-snug md:leading-snug mb-6">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-6 border-y border-gray-200 py-4">
            <div className="flex items-center gap-4">
              <img
                src={authorAvatar}
                alt={article.author_name ?? 'Diyar'}
                className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200"
              />
              <div>
                <h3 className="font-bold text-gray-900">{article.author_name ?? 'فريق ديار'}</h3>
                <p className="text-xs text-gray-500">{article.author_role ?? 'خبراء التصميم والمفروشات'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <Calendar size={16} /> <span>{formattedDate}</span>
              </div>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <div className="flex items-center gap-1.5">
                <Clock size={16} /> <span>{readTime}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="rounded-3xl overflow-hidden mb-10 shadow-sm border border-gray-100 flex justify-center bg-gray-100">
          <img
            src={article.hero_image ?? FALLBACK_COVER}
            alt={article.title}
            referrerPolicy="no-referrer"
            className="w-full max-h-[500px] object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = FALLBACK_COVER;
            }}
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          <div className="lg:w-2/3">
            <div
              className="article-content"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content ?? '') }}
            />

            <div className="mt-12 pt-6 border-t border-gray-200 flex flex-wrap gap-2">
              <span className="text-gray-500 text-sm py-1.5 font-medium ml-2">الإشارات:</span>
              {tags.map((tag) => (
                <Link
                  key={tag.id}
                  to={`/blog/tag/${tag.slug}`}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-4 py-1.5 rounded-full transition-colors"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="lg:w-1/3 space-y-8">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm sticky top-24">
              <h3 className="font-bold text-diyar-dark mb-4 text-lg">شارك المقال</h3>
              <div className="flex gap-2 mb-6">
                <button className="flex-1 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 text-gray-500 h-10 rounded-xl flex items-center justify-center transition-colors">
                  <Facebook size={18} />
                </button>
                <button className="flex-1 bg-gray-50 hover:bg-sky-50 hover:text-sky-500 text-gray-500 h-10 rounded-xl flex items-center justify-center transition-colors">
                  <Twitter size={18} />
                </button>
                <button className="flex-1 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 text-gray-500 h-10 rounded-xl flex items-center justify-center transition-colors">
                  <Linkedin size={18} />
                </button>
                <button className="flex-1 bg-gray-50 hover:bg-gray-200 text-gray-800 h-10 rounded-xl flex items-center justify-center transition-colors">
                  <LinkIcon size={18} />
                </button>
              </div>

              <h3 className="font-bold text-diyar-dark mb-4 text-lg border-t border-gray-100 pt-6">
                تفاعلات
              </h3>
              <button className="w-full border-2 border-gray-100 text-gray-600 hover:border-diyar-brown hover:text-diyar-brown font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                <Bookmark size={20} /> حفظ المقال
              </button>
            </div>
          </div>
        </div>
      </article>

      {related.length > 0 ? (
        <div className="bg-white border-t border-gray-200 py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-diyar-dark">مقالات ذات صلة</h2>
              <Link
                to="/blog"
                className="text-diyar-brown font-bold hover:text-diyar-dark transition-colors text-sm"
              >
                عرض المدونة
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((relatedArticle) => (
                <Link
                  key={relatedArticle.id}
                  to={`/blog/${relatedArticle.slug}`}
                  className="group bg-gray-50 rounded-3xl overflow-hidden border border-gray-100 hover:shadow-md transition-all"
                >
                  <div className="h-48 overflow-hidden relative">
                    {relatedArticle.category?.name ? (
                      <span className="absolute top-4 right-4 bg-white/90 backdrop-blur text-diyar-dark text-xs font-bold px-3 py-1.5 rounded-full z-10">
                        {relatedArticle.category.name}
                      </span>
                    ) : null}
                    <img
                      src={relatedArticle.hero_image ?? FALLBACK_CARD_IMAGE}
                      alt={relatedArticle.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_CARD_IMAGE;
                      }}
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                      <Calendar size={14} />
                      <span>
                        {relatedArticle.published_at
                          ? formatLocaleDate(relatedArticle.published_at, locale, {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : '—'}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg text-diyar-dark group-hover:text-diyar-brown transition-colors line-clamp-2 leading-snug">
                      {relatedArticle.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
