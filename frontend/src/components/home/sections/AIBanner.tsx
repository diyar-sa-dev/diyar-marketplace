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

export function AIBanner() {
  const { t } = useLocale();

  return (
    <div className="bg-[#132624] text-white py-8 md:py-12 my-8 md:my-10 mx-4 md:mx-auto relative overflow-hidden rounded-3xl max-w-7xl shadow-md">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-size-[4rem_4rem]"></div>
      <div className="absolute top-0 right-0 w-160 h-160 bg-diyar-brown/20 rounded-full blur-[130px] -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-120 h-120 bg-[#1a4a42]/30 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3"></div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-8 lg:gap-12 relative z-10">
        <div className="w-full md:w-1/2 text-center md:text-right order-2 md:order-1">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 backdrop-blur-md shadow-md text-[#d2b694] font-bold rounded-full mb-3 text-sm">
            <Sparkles size={16} className="animate-pulse" />
            <span>{t('home.aiBanner.badge')}</span>
          </div>
          <span className="inline-flex mb-4 text-[11px] font-bold uppercase tracking-wide bg-amber-500/15 text-amber-200 border border-amber-400/20 px-3 py-1 rounded-full">
            {t('home.aiBanner.earlyAccess')}
          </span>
          <h2 className="text-3xl md:text-5xl font-sans font-bold mb-6 text-diyar-cream leading-[1.4]">
            {t('home.aiBanner.titleLine1')} <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-linear-to-l from-[#d2b694] to-white">
              {t('home.aiBanner.titleLine2')}
            </span>
          </h2>
          <p className="mb-8 md:mb-10 text-gray-300 text-base md:text-lg leading-relaxed max-w-xl mx-auto md:mx-0 font-light">
            {t('home.aiBanner.body')}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
            <button
              type="button"
              disabled
              className="flex items-center justify-center gap-3 bg-diyar-brown/60 text-white/80 px-8 py-4 rounded-lg text-lg shadow-md font-bold border border-diyar-brown/30 w-full sm:w-auto cursor-not-allowed opacity-70"
            >
              <UploadCloud />
              <span>{t('home.aiBanner.tryNow')}</span>
            </button>
            <button
              type="button"
              disabled
              className="flex items-center justify-center gap-2 bg-transparent text-white/60 border border-white/15 px-8 py-4 rounded-lg text-lg font-bold w-full sm:w-auto cursor-not-allowed opacity-70"
            >
              {t('home.aiBanner.viewDetails')}
            </button>
          </div>
        </div>

        <div className="w-full md:w-1/2 order-1 md:order-2 flex justify-center">
          <div className="relative w-full max-w-lg aspect-4/3 bg-[#1a3330] rounded-xl overflow-hidden shadow-md border border-white/10 ring-1 ring-white/5 mx-auto">
            <img
              src="/before.png"
              alt={t('home.aiBanner.originalSpace')}
              className="absolute inset-0 w-full h-full object-cover filter grayscale-20 opacity-90"
            />

            <div className="absolute inset-0 animate-[sweep_4s_ease-in-out_infinite]">
              <img
                src="/after.png"
                alt={t('home.aiBanner.assistantLayout')}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>

            <div className="absolute top-0 bottom-0 w-1 bg-[#d2b694] shadow-md animate-[scan-x_4s_ease-in-out_infinite] -ml-0.5 z-10 flex flex-col items-center justify-center">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-[#132624] border-2 border-[#d2b694] rounded-full shadow-md flex items-center justify-center -translate-x-3.5 md:-translate-x-4.5">
                <Sparkles size={16} className="text-[#d2b694]" />
              </div>
            </div>

            <div className="absolute top-4 right-4 md:top-6 md:right-6 bg-black/50 border border-white/10 backdrop-blur-md px-4 py-1.5 md:px-5 md:py-2 rounded-lg text-xs font-bold text-gray-300 shadow-md z-0">
              {t('home.aiBanner.originalSpace')}
            </div>
            <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 bg-linear-to-r from-diyar-brown to-[#7a6450] px-4 py-1.5 md:px-5 md:py-2 rounded-lg text-xs md:text-sm font-bold text-white shadow-md z-20 flex items-center gap-2 border border-white/20">
              <Sparkles size={16} className="text-yellow-200" />
              {t('home.aiBanner.assistantLayout')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
