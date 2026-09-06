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

export function SuggestedForYou() {
  const { t } = useLocale();
  const { data, isLoading } = useProducts({ per_page: 5, sort: '-popular' });
  const products = data?.items.map(mapProductCard) ?? [];
  const showEmpty = !isLoading && products.length === 0;
  return (
    <div className="max-w-7xl mx-auto py-8 md:py-12 px-4">
      <div className="text-center mb-6 md:mb-8">
        <span className="text-diyar-brown text-sm font-medium mb-2 block">
          {t('home.suggestedForYou.badge')}
        </span>
        <h2 className="text-2xl md:text-3xl font-sans font-bold">
          {t('home.suggestedForYou.title')}
        </h2>
        <Link
          to="/category/all?sort=-popular"
          className="inline-block mt-3 text-diyar-brown text-sm font-bold hover:text-diyar-dark transition cursor-pointer"
        >
          {t('home.suggestedForYou.exploreMore')}
        </Link>
      </div>
      {showEmpty ? (
        <SectionEmptyState
          title={t('home.suggestedForYou.emptyTitle')}
          description={t('home.suggestedForYou.emptyDescription')}
          browseLabel={t('home.suggestedForYou.browseAll')}
          browseTo="/category/all?sort=-popular"
        />
      ) : (
        <HorizontalRail className="flex md:grid md:grid-cols-5 gap-4 md:gap-5 overflow-x-auto scrollbar-hide snap-x py-2">
          {isLoading
            ? [...Array(5)].map((_, i) => (
                <div key={i} className="w-50 md:w-auto shrink-0 snap-start">
                  <ProductCardSkeleton />
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
