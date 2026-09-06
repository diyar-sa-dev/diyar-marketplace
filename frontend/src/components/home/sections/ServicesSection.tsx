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

export function ServicesSection() {
  const { t, dir } = useLocale();
  const { data: serviceCategories, isLoading } = useCategories('service');
  const ViewAllIcon = dir === 'rtl' ? ChevronLeft : ArrowLeft;
  const featuredCategories = (serviceCategories ?? []).slice(0, 6);
  const showEmpty = !isLoading && (serviceCategories ?? []).length === 0;
  const categoryServiceQueries = useQueries({
    queries: featuredCategories.map((category) => ({
      queryKey: serviceKeys.list({ category: category.slug, per_page: 3, sort: 'latest' }),
      queryFn: () => fetchServices({ category: category.slug, per_page: 3, sort: 'latest' }),
      enabled: Boolean(category.slug),
    })),
  });
  const STATIC_IMG: Record<string, string> = {
    'interior-design': '/categories/تصميم داخلي.webp',
    maintenance: '/categories/تركيب وصيانة.webp',
    painting: '/categories/دهانات.webp',
    upholstery: '/categories/تنجيد وتجديد.webp',
    carpentry: '/categories/نجارة مخصصة.webp',
    consultation: '/categories/استشارات تصميم.webp',
    moving: '/categories/نقل وتغليف.webp',
    cleaning: '/categories/تنظيف وتلميع.webp',
    electrical: '/categories/إضاءة وكهرباء.webp',
    'curtains-install': '/categories/تركيب الستائر.webp',
    'floor-plan': '/categories/مخططات معمارية.webp',
    other: '/logo_diyar.svg',
  };

  return (
    <div className="py-6 md:py-8 bg-gray-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-end mb-6">
          <div>
            <span className="text-purple-600 text-sm font-bold mb-2 block">
              {t('home.diyarServices.badge')}
            </span>
            <h2 className="text-2xl md:text-3xl font-sans font-bold text-diyar-dark flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                <Paintbrush size={20} />
              </div>
              {t('home.diyarServices.title')}
            </h2>
          </div>
          <Link
            to="/services"
            className="text-diyar-brown font-bold flex items-center gap-2 hover:text-diyar-dark transition cursor-pointer text-sm md:text-base shrink-0"
          >
            {t('home.diyarServices.viewAll')} <ViewAllIcon size={18} />
          </Link>
        </div>
        {isLoading ? (
          <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide snap-x pt-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="min-w-56 h-48 bg-white rounded-lg animate-pulse shrink-0" />
            ))}
          </div>
        ) : showEmpty ? (
          <SectionEmptyState
            title={t('home.diyarServices.emptyTitle')}
            description={t('home.diyarServices.emptyDescription')}
            browseLabel={t('home.diyarServices.browseAll')}
            browseTo="/services"
            icon={Paintbrush}
          />
        ) : (
          <HorizontalRail className="flex overflow-x-auto gap-4 md:grid md:grid-cols-5 pb-2 scrollbar-hide snap-x pt-1">
            {(serviceCategories ?? []).slice(0, 10).map((category) => (
                <Link
                  to={`/category/${category.slug}`}
                  key={category.id}
                  className="min-w-56 md:min-w-0 bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all snap-start group cursor-pointer shrink-0"
                >
                  <div className="h-36 relative overflow-hidden bg-diyar-brown/10">
                    <img
                      src={STATIC_IMG[category.slug] ?? '/logo_diyar.svg'}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-diyar-dark text-base">{category.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('home.diyarServices.browseCategory')}
                    </p>
                  </div>
                </Link>
              ))}
          </HorizontalRail>
        )}

        {!showEmpty &&
          featuredCategories.map((category, index) => {
            const items = categoryServiceQueries[index]?.data?.items ?? [];
            if (items.length === 0) {
              return null;
            }

            return (
              <div key={category.id} className="mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-diyar-dark">{category.name}</h3>
                  <Link
                    to={`/category/${category.slug}`}
                    className="text-diyar-brown text-sm font-bold hover:text-diyar-dark transition cursor-pointer"
                  >
                    {t('home.diyarServices.viewAllCategory')}{' '}
                    <ViewAllIcon size={16} className="inline ms-1" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
