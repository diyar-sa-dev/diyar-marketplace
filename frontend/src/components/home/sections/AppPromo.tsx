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

export function AppPromo() {
  const { t } = useLocale();

  return (
    <div className="max-w-6xl mx-auto px-4 pt-16 md:pt-28 pb-8 md:pb-12">
      <div className="bg-linear-to-br from-diyar-dark to-[#342D25] rounded-3xl relative flex flex-col md:flex-row items-stretch shadow-md">
        {/* Abstract shapes (clipped to the rounded box) */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-diyar-brown/30 rounded-full mix-blend-color-dodge filter blur-[80px] translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-600/20 rounded-full mix-blend-color-dodge filter blur-[100px] -translate-x-1/3 translate-y-1/3"></div>
        </div>

        <div className="w-full md:w-1/2 p-6 md:p-10 relative z-10 text-center md:text-start flex flex-col justify-center">
          <div className="inline-flex self-center md:self-start items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-diyar-cream mb-6 backdrop-blur-md border border-white/10">
            <Smartphone size={14} />
            <span className="text-xs font-bold">{t('home.appPromo.badge')}</span>
          </div>

          <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white mb-4 leading-[1.4] font-sans">
            {t('home.appPromo.titleLine1')} <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-diyar-cream to-amber-300">
              {t('home.appPromo.titleLine2')}
            </span>
          </h2>

          <p className="text-base text-white/70 mb-8 leading-relaxed font-medium">
            {t('home.appPromo.body')}
          </p>

          <div className="hidden lg:grid grid-cols-2 gap-4 mb-8 text-start">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-diyar-cream shrink-0">
                <Box size={16} />
              </div>
              <div>
                <h4 className="text-white text-sm font-bold mb-0.5">
                  {t('home.appPromo.arTitle')}
                </h4>
                <p className="text-white/60 text-[10px]">{t('home.appPromo.arDesc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-diyar-cream shrink-0">
                <Scan size={16} />
              </div>
              <div>
                <h4 className="text-white text-sm font-bold mb-0.5">
                  {t('home.appPromo.imageSearchTitle')}
                </h4>
                <p className="text-white/60 text-[10px]">{t('home.appPromo.imageSearchDesc')}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-row items-center justify-center md:justify-start gap-3">
            <button className="transition-transform hover:scale-105 active:scale-95">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
                alt="App Store"
                className="h-10 md:h-12 w-auto"
              />
            </button>
            <button className="transition-transform hover:scale-105 active:scale-95">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                alt="Google Play"
                className="h-10 md:h-12 w-auto"
              />
            </button>
          </div>
        </div>

        <div className="w-full md:w-1/2 relative min-h-57.5 md:min-h-65 flex justify-center items-end mt-4 md:mt-0">
          <img
            src="/app-mockup.png"
            alt={t('home.appPromo.mockupAlt')}
            referrerPolicy="no-referrer"
            className="w-[62%] sm:w-[46%] md:w-auto md:h-[120%] md:absolute md:bottom-0 md:left-1/2 md:-translate-x-1/2 max-w-105 h-auto object-contain z-20 drop-shadow-2xl hover:scale-[1.02] transition-transform duration-500"
          />
        </div>
      </div>
    </div>
  );
}
