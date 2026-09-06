import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import ProductCard from '../../cards/ProductCard.tsx';
import { ProductCardSkeleton } from '../../cards/ProductCardSkeleton.tsx';
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

export function BestSellers() {
  const { t, dir } = useLocale();
  const [tab, setTab] = useState(0);
  const tabs = [
    { labelKey: 'home.bestSellers.tabs.all', category_slug: undefined },
    { labelKey: 'home.bestSellers.tabs.bedroom', category_slug: 'bedroom' },
    { labelKey: 'home.bestSellers.tabs.livingRoom', category_slug: 'living-room' },
    { labelKey: 'home.bestSellers.tabs.kitchen', category_slug: 'kitchen' },
  ] as const;
  const active = tabs[tab] ?? tabs[0];
  const { data, isLoading } = useProducts({
    per_page: 8,
    sort: '-popular',
    category_slug: active.category_slug,
  });
  const products = data?.items.map(mapProductCard) ?? [];
  const showEmpty = !isLoading && products.length === 0;

  return (
    <div className="max-w-7xl mx-auto py-8 md:py-12 px-4" dir={dir}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 md:mb-8">
        <h2 className="text-xl md:text-3xl font-sans font-bold text-center sm:text-start text-diyar-dark">
          {t('home.bestSellers.title')}
        </h2>
        <Link
          to="/category/all?sort=-popular"
          className="text-diyar-brown text-sm font-bold hover:text-diyar-dark transition self-center cursor-pointer"
        >
          {t('home.bestSellers.viewAll')}
        </Link>
      </div>
      <div className="mb-6 md:mb-8">
        <div className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide snap-x justify-start md:justify-center pb-1">
          {tabs.map((item, i) => (
            <button
              key={item.labelKey}
              type="button"
              onClick={() => setTab(i)}
              className={`px-4 md:px-6 py-2 rounded-full transition whitespace-nowrap snap-start text-sm md:text-base cursor-pointer ${
                tab === i
                  ? 'bg-diyar-brown text-white shadow-md shadow-diyar-brown/20'
                  : 'bg-diyar-cream text-diyar-dark hover:bg-diyar-brown/15 border border-transparent hover:border-diyar-brown/20'
              }`}
            >
              {t(item.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {showEmpty ? (
        <SectionEmptyState
          title={t('home.bestSellers.emptyTitle')}
          description={t('home.bestSellers.emptyDescription')}
          browseLabel={t('home.bestSellers.browseAll')}
          browseTo="/category/all?sort=-popular"
        />
      ) : (
        <HorizontalRail
          className="flex md:grid md:grid-cols-5 gap-4 md:gap-5 overflow-x-auto scrollbar-hide snap-x py-2"
        >
          {isLoading
            ? [...Array(5)].map((_, i) => (
                <div key={i} className="w-50 md:w-auto shrink-0 snap-start">
                  <ProductCardSkeleton className="rounded-2xl" />
                </div>
              ))
            : products.map((p) => (
                <div key={p.id} className="w-50 md:w-auto shrink-0 snap-start">
                  <ProductCard product={p} />
                </div>
              ))}
        </HorizontalRail>
      )}
    </div>
  );
}
