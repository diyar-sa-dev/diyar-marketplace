import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import ProductCard from '../../cards/ProductCard.tsx';
import ServiceCard from '../../cards/ServiceCard.tsx';
import { useCategories, useProducts, useVendors } from '../../../hooks/catalog/useCatalog.ts';
import { useBlogArticles } from '../../../hooks/blog/useBlogArticles.ts';
import { formatBlogReadingTime } from '../../../lib/formatBlogReadingTime.ts';
import { formatLocaleDate } from '../../../lib/intlLocale.ts';
import { serviceKeys } from '../../../hooks/services/queryKeys.ts';
import { fetchServices } from '../../../api/services.ts';
import { useLocale } from '../../../hooks/useLocale.ts';
import { validateNewsletterEmail } from '../../../lib/platformForms.ts';
import { parseApiError } from '../../../utils/errors.ts';
import { subscribeNewsletter } from '../../../api/platform.ts';
import { useAuth } from '../../../hooks/auth/useAuth.ts';
import { useLoyaltySummary } from '../../../hooks/loyalty/useLoyalty.ts';
import { skipDashboardTutorial } from '../../../lib/dashboardTutorialStorage.ts';
import { isValidStoreSlug, storePath } from '../../../lib/storePath.ts';
import { StarRating } from '../../product/StarRating.tsx';
import { mapProductCard } from '../../../lib/catalogMappers.ts';
import SectionEmptyState from '../SectionEmptyState.tsx';
import { RailArrows } from './RailArrows.tsx';
import {
  Star,
  Quote,
  ArrowLeft,
  Send,
  Sparkles,
  UploadCloud,
  Store,
  Briefcase,
  Paintbrush,
  Smartphone,
  Scan,
  Box,
  BellRing,
  Wrench,
  ShieldCheck,
  Truck,
  HeadphonesIcon,
  CreditCard,
  PenTool,
  Twitter,
  Instagram,
  MessageCircle,
  Heart,
  Bookmark,
  Eye,
  Gift,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export function DesignBlog() {
  const { t, dir, locale } = useLocale();
  const { data, isLoading } = useBlogArticles({ per_page: 3 });
  const posts = data?.items ?? [];
  const showEmpty = !isLoading && posts.length === 0;
  const ViewAllIcon = dir === 'rtl' ? ChevronLeft : ArrowLeft;

  return (
    <div className="py-8 md:py-12 max-w-7xl mx-auto px-4 relative" dir={dir}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 md:mb-10">
        <div className="text-center sm:text-start">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
            <span className="text-diyar-brown text-sm font-bold">{t('home.blog.badge')}</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-sans font-bold text-diyar-dark">
            {t('home.blog.title')}
          </h2>
        </div>
        <Link
          to="/blog"
          className="inline-flex items-center justify-center gap-2 self-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-diyar-brown hover:text-diyar-dark hover:border-diyar-brown transition-colors cursor-pointer"
        >
          {t('home.blog.allArticles')}
          <ViewAllIcon size={18} className="rtl:-scale-x-100" />
        </Link>
      </div>

      {showEmpty ? (
        <SectionEmptyState
          title={t('blog.emptyTitle')}
          description={t('blog.emptyDescription')}
          browseLabel={t('home.blog.allArticles')}
          browseTo="/blog"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {isLoading
            ? [...Array(3)].map((_, index) => (
                <div key={index} className="rounded-2xl overflow-hidden border border-gray-100">
                  <div className="h-56 md:h-60 bg-gray-100 animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-3 w-24 bg-gray-100 animate-pulse rounded" />
                    <div className="h-6 w-full bg-gray-100 animate-pulse rounded" />
                  </div>
                </div>
              ))
            : posts.map((post) => (
                <Link key={post.id} to={`/blog/${post.slug}`} className="group cursor-pointer">
                  <div className="w-full h-56 md:h-60 rounded-2xl overflow-hidden mb-5 relative shadow-sm border border-gray-100">
                    <img
                      src={
                        post.hero_image ??
                        'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=60&w=600'
                      }
                      alt={post.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=60&w=600';
                      }}
                    />
                    {post.category?.name ? (
                      <div className="absolute top-4 inset-e-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-diyar-brown shadow-sm">
                        {post.category.name}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                    <span>
                      {post.published_at
                        ? formatLocaleDate(post.published_at, locale, {
                            month: 'long',
                            day: 'numeric',
                          })
                        : '—'}
                    </span>
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                    <span>{formatBlogReadingTime(post.reading_time_minutes, locale)}</span>
                  </div>
                  <h3 className="text-lg md:text-2xl font-bold font-sans text-diyar-dark leading-snug group-hover:text-diyar-brown transition-colors">
                    {post.title}
                  </h3>
                </Link>
              ))}
        </div>
      )}
    </div>
  );
}
