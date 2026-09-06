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

export function LoyaltyPromo() {
  const { t, locale } = useLocale();
  const { isAuthenticated } = useAuth();
  const { data: loyaltySummary, isLoading: loyaltyLoading } = useLoyaltySummary(isAuthenticated);

  return (
    <div className="max-w-7xl mx-auto px-4 my-8 md:my-12">
      <div className="bg-[#FFFDF8] rounded-3xl border border-[#F2DEB4]/50 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] z-0"></div>
        <div className="absolute top-0 right-0 w-150 h-150 bg-[radial-gradient(circle,var(--tw-gradient-stops))] from-[#F9E8C8]/80 to-transparent blur-3xl z-0 -translate-y-1/2 translate-x-1/3"></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 relative z-10 w-full items-center">
          {/* Content side */}
          <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center text-start order-2 lg:order-1">
            <div className="w-fit bg-amber-100/80 border border-amber-200/60 rounded-full px-4 py-1.5 flex items-center gap-2 mb-6">
              <span className="flex items-center justify-center w-5 h-5 bg-amber-500 rounded-full text-white">
                <Sparkles size={12} />
              </span>
              <span className="text-amber-800 text-sm font-bold">{t('home.loyalty.badge')}</span>
            </div>

            <h2 className="text-3xl lg:text-5xl font-bold text-[#3D2E1F] leading-[1.4] mb-5">
              {t('home.loyalty.titleLine1')} <br /> {t('home.loyalty.titleLine2')}
            </h2>
            <p className="text-gray-600 text-lg mb-10 max-w-lg leading-relaxed">
              {isAuthenticated && loyaltyLoading
                ? t('common.loading')
                : isAuthenticated && loyaltySummary
                  ? t('home.loyalty.authenticatedBody', {
                      balance: loyaltySummary.balance.toLocaleString(locale),
                    })
                  : t('home.loyalty.body')}
            </p>

            {isAuthenticated && loyaltySummary && !loyaltyLoading ? (
              <div className="mb-8 inline-flex items-center gap-3 rounded-2xl border border-amber-200 bg-white px-5 py-3 shadow-sm">
                <Star size={20} className="text-amber-500 fill-amber-500" />
                <span className="font-bold text-[#3D2E1F]">
                  {t('home.loyalty.currentBalance', {
                    balance: loyaltySummary.balance.toLocaleString(locale),
                  })}
                </span>
              </div>
            ) : isAuthenticated ? (
              <div className="mb-8 h-12 w-56 max-w-full rounded-2xl bg-amber-50/80 animate-pulse" aria-hidden />
            ) : null}

            <div className="flex flex-col gap-5 mb-10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 shrink-0 rounded-xl bg-white border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm relative overflow-hidden group">
                  <div className="absolute inset-0 bg-amber-50 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                  <Gift size={24} className="relative z-10" />
                </div>
                <div>
                  <h4 className="font-bold text-[#3D2E1F] text-lg mb-1">
                    {t('home.loyalty.shopEarnTitle')}
                  </h4>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {t('home.loyalty.shopEarnDesc')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 shrink-0 rounded-xl bg-white border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm relative overflow-hidden group">
                  <div className="absolute inset-0 bg-amber-50 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                  <ShieldCheck size={24} className="relative z-10" />
                </div>
                <div>
                  <h4 className="font-bold text-[#3D2E1F] text-lg mb-1">
                    {t('home.loyalty.redeemTitle')}
                  </h4>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {t('home.loyalty.redeemDesc')}
                  </p>
                </div>
              </div>
            </div>

            <Link
              to="/loyalty"
              className="bg-[#3D2E1F] text-white px-8 py-4 rounded-full font-bold hover:bg-[#2A1F15] transition-all inline-flex items-center gap-3 w-fit group"
            >
              <span>{t('home.loyalty.cta')}</span>
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:-translate-x-1 rtl:group-hover:translate-x-1 transition-transform">
                <ArrowLeft size={14} className="rtl:-scale-x-100" />
              </div>
            </Link>
          </div>

          {/* Visual side */}
          <div className="bg-[#F8EBCD] h-full min-h-100 flex items-center justify-center p-8 lg:p-0 relative overflow-hidden order-1 lg:order-2 border-b lg:border-b-0 lg:border-e border-amber-200/50">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05] z-0"></div>

            {/* Circular decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-75 xl:w-100 h-75 xl:h-100 border border-amber-200 rounded-full z-0"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-100 xl:w-135 h-100 xl:h-135 border border-amber-200/50 rounded-full z-0 border-dashed"></div>

            <div className="relative z-10 w-full max-w-70 md:max-w-85 xl:max-w-105 transition-transform duration-700 hover:scale-105 aspect-square">
              <div className="absolute -inset-4 bg-amber-400/20 rounded-full blur-2xl -z-10" />
              <img
                src="/loyalty-points.webp"
                alt={t('home.loyalty.imageAlt')}
                width={420}
                height={420}
                decoding="async"
                loading="lazy"
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>

            {/* Floating elements */}
            <div className="absolute top-[20%] right-[15%] w-14 h-14 bg-white rounded-xl rotate-12 shadow-md flex items-center justify-center animate-bounce">
              <Sparkles size={24} className="text-amber-500" />
            </div>
            <div
              className="absolute bottom-[20%] left-[15%] w-12 h-12 bg-white rounded-full -rotate-12 shadow-md flex items-center justify-center animate-bounce"
              style={{ animationDelay: '0.3s' }}
            >
              <Gift size={20} className="text-amber-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
