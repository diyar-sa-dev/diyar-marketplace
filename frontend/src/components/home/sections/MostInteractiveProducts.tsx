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

export function MostInteractiveProducts() {
  const { t } = useLocale();
  const { data, isLoading } = useProducts({ per_page: 6, sort: '-popular' });
  const products = data?.items.map(mapProductCard) ?? [];
  const showEmpty = !isLoading && products.length === 0;

  return (
    <div className="bg-linear-to-b from-white to-diyar-cream/10 py-8 md:py-8 border-t border-b border-gray-100/10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-baseline mb-8">
          <div>
            <h2 className="text-xl md:text-3xl font-sans font-bold text-diyar-dark">
              {t('home.mostInteractive.title')}
            </h2>
            <p className="text-gray-500 text-xs md:text-sm mt-1">
              {t('home.mostInteractive.subtitle')}
            </p>
          </div>
          <Link
            to="/category/all?sort=-popular"
            className="text-diyar-brown text-xs md:text-sm font-bold hover:text-diyar-dark transition shrink-0 cursor-pointer"
          >
            {t('home.mostInteractive.viewAll')}
          </Link>
        </div>
        {showEmpty ? (
          <SectionEmptyState
            title={t('home.mostInteractive.emptyTitle')}
            description={t('home.mostInteractive.emptyDescription')}
            browseLabel={t('home.mostInteractive.browseAll')}
            browseTo="/category/all?sort=-popular"
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {isLoading
              ? [...Array(6)].map((_, i) => <ProductCardSkeleton key={i} />)
              : products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </div>
    </div>
  );
}
