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

export function Reviews() {
  const { t } = useLocale();
  const reviews = [
    {
      nameKey: 'home.reviews.review1Name',
      textKey: 'home.reviews.review1Text',
      productKey: 'home.reviews.review1Product',
    },
    {
      nameKey: 'home.reviews.review2Name',
      textKey: 'home.reviews.review2Text',
      productKey: 'home.reviews.review2Product',
    },
    {
      nameKey: 'home.reviews.review3Name',
      textKey: 'home.reviews.review3Text',
      productKey: 'home.reviews.review3Product',
    },
  ] as const;
  return (
    <div className="bg-diyar-cream/50 py-4 md:py-6">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-xl md:text-3xl font-sans font-bold mb-6 md:mb-8 text-center">
          {t('home.reviews.title')}
        </h2>
        <HorizontalRail className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 overflow-x-auto pb-2 scrollbar-hide snap-x">
          {reviews.map((r, i) => (
            <div
              key={i}
              className="bg-white p-5 md:p-8 rounded-xl shadow-sm border border-gray-100 relative min-w-[min(100%,18rem)] sm:min-w-72 md:min-w-0 snap-start shrink-0 flex flex-col"
            >
              <Quote className="absolute top-6 inset-e-6 text-diyar-cream w-8 md:w-12 h-8 md:h-12 opacity-50 z-0" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex gap-1 text-yellow-500 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill="currentColor" />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed mb-6 text-sm md:text-base flex-1">
                  "{t(r.textKey)}"
                </p>
                <div className="flex flex-col border-t border-gray-100 pt-4 mt-auto">
                  <span className="font-bold text-diyar-dark text-sm md:text-base">
                    {t(r.nameKey)}
                  </span>
                  <span className="text-xs md:text-sm text-gray-400">
                    {t('home.reviews.purchased', { product: t(r.productKey) })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </HorizontalRail>
      </div>
    </div>
  );
}
