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
import { HorizontalRail } from './HorizontalRail.tsx';
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

export function FeaturedStores() {
  const { t, dir } = useLocale();
  const { data, isLoading } = useVendors({ per_page: 6 });
  const stores = (data?.items ?? []).filter((store) => isValidStoreSlug(store.slug));
  const showEmpty = !isLoading && stores.length === 0;
  const ViewAllIcon = dir === 'rtl' ? ChevronLeft : ArrowLeft;

  return (
    <div className="bg-gray-50 py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-end mb-6 md:mb-10">
          <div>
            <span className="text-diyar-brown text-sm font-bold mb-2 block">
              {t('home.featuredStores.badge')}
            </span>
            <h2 className="text-2xl md:text-4xl font-sans font-bold text-diyar-dark">
              {t('home.featuredStores.title')}
            </h2>
          </div>
          <Link
            to="/category/all"
            className="text-diyar-brown font-bold flex items-center gap-2 hover:text-diyar-dark transition cursor-pointer text-sm md:text-base"
          >
            {t('home.featuredStores.viewAll')} <ViewAllIcon size={18} />
          </Link>
        </div>
        {showEmpty ? (
          <SectionEmptyState
            title={t('home.featuredStores.emptyTitle')}
            description={t('home.featuredStores.emptyDescription')}
            browseLabel={t('home.featuredStores.browseAll')}
            browseTo="/category/all"
            icon={Store}
          />
        ) : (
          <HorizontalRail className="flex overflow-x-auto md:grid md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-6 gap-4 md:gap-4 pb-2 scrollbar-hide snap-x">
            {isLoading
              ? [...Array(6)].map((_, i) => (
                  <div key={i} className="min-w-35 h-40 bg-white rounded-xl animate-pulse" />
                ))
              : stores.map((store) => (
                  <Link
                    to={storePath(store.slug)!}
                    key={store.id}
                    className="min-w-44 sm:min-w-40 md:min-w-0 bg-white rounded-xl p-4 md:p-3 border border-gray-100 shadow-sm hover:shadow-md transition group text-center flex flex-col items-center shrink-0 snap-start"
                  >
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gray-100 p-1 mb-3 overflow-hidden border border-gray-200 shrink-0">
                      <img
                        src={
                          store.logo_url ??
                          'https://images.unsplash.com/photo-1555529733-0e670560f7e1?auto=format&fit=crop&q=60&w=200'
                        }
                        alt={store.store_name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                    <h3
                      className="text-sm md:text-base font-bold text-diyar-dark mb-2 line-clamp-2 w-full leading-snug px-1"
                      title={store.store_name}
                    >
                      {store.store_name}
                    </h3>
                    <div
                      className="flex items-center justify-center gap-2 flex-wrap mb-3 w-full text-[10px] md:text-xs text-gray-500"
                      dir={dir}
                    >
                      {(store.rating_avg ?? 0) > 0 ? (
                        <>
                          <div className="inline-flex items-center gap-1 shrink-0">
                            <StarRating
                              value={store.rating_avg ?? 0}
                              readOnly
                              size={12}
                              className="text-yellow-400"
                            />
                            <span className="font-bold text-diyar-dark tabular-nums">
                              {(store.rating_avg ?? 0).toFixed(1)}
                            </span>
                          </div>
                          <span className="text-gray-300 select-none" aria-hidden="true">
                            ·
                          </span>
                        </>
                      ) : null}
                      <span className="text-gray-500 tabular-nums">
                        {t('store.productsCount', { count: store.product_count ?? 0 })}
                      </span>
                    </div>
                    <div className="w-full py-1.5 md:py-2 text-xs md:text-sm rounded-lg border border-gray-200 text-diyar-dark font-medium group-hover:bg-diyar-brown group-hover:text-white group-hover:border-diyar-dark transition mt-auto">
                      {t('home.featuredStores.browseStore')}
                    </div>
                  </Link>
                ))}
          </HorizontalRail>
        )}
      </div>
    </div>
  );
}
