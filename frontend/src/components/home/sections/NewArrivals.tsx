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

export function NewArrivals() {
  const { t, dir } = useLocale();
  const { data, isLoading } = useProducts({ per_page: 6, sort: '-created_at' });
  const products = data?.items.map(mapProductCard) ?? [];
  const showEmpty = !isLoading && products.length === 0;
  const ViewAllIcon = dir === 'rtl' ? ChevronLeft : ArrowLeft;
  return (
    <div className="bg-diyar-cream/30 py-4 md:py-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <h2 className="text-xl md:text-4xl font-sans font-bold">{t('home.newArrivals.title')}</h2>
          <Link
            to="/category/all?sort=-created_at"
            className="text-diyar-brown text-sm md:text-base font-semibold flex items-center gap-1 md:gap-2 hover:text-diyar-dark transition cursor-pointer"
          >
            {t('home.newArrivals.viewAll')} <ViewAllIcon size={16} className="md:w-4.5 md:h-4.5" />
          </Link>
        </div>
        {showEmpty ? (
          <SectionEmptyState
            title={t('home.newArrivals.emptyTitle')}
            description={t('home.newArrivals.emptyDescription')}
            browseLabel={t('home.newArrivals.browseAll')}
            browseTo="/category/all?sort=-created_at"
          />
        ) : (
          <HorizontalRail className="flex gap-4 md:gap-5 overflow-x-auto scrollbar-hide snap-x py-2">
            {isLoading
              ? [...Array(4)].map((_, i) => (
                  <div key={i} className="w-50 md:w-57.5 shrink-0 snap-start">
                    <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
                  </div>
                ))
              : products.map((p) => (
                  <div className="w-50 md:w-57.5 shrink-0 snap-start" key={p.id}>
                    <ProductCard product={p} />
                  </div>
                ))}
          </HorizontalRail>
        )}
      </div>
    </div>
  );
}
