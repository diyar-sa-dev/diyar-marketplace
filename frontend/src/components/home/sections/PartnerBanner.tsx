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

export function PartnerBanner() {
  const navigate = useNavigate();
  const { t, dir } = useLocale();
  const cardsRef = useRef<HTMLDivElement>(null);
  const CtaIcon = dir === 'rtl' ? ChevronLeft : ArrowLeft;

  const goToRegister = (role: 'merchant' | 'marketer' | 'service_provider') => {
    navigate(`/auth?role=${role}`);
  };

  const openDashboardDemo = () => {
    skipDashboardTutorial();
    navigate('/dashboard/vendor?skipTutorial=1');
  };

  const scrollToCards = () => {
    cardsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 my-8 md:my-12">
      <div className="bg-linear-to-br from-[#1A1A1A] to-[#2A2A2A] rounded-xl p-8 md:p-12 lg:p-16 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8 shadow-md">
        {/* Subtle decorative background elements */}
        <div className="absolute top-0 right-0 w-150 h-150 bg-diyar-brown/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-100 h-100 bg-diyar-cream/10 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3"></div>

        {/* Text and Actions Content */}
        <div className="w-full lg:translate-x-0 lg:w-1/2 relative z-10 text-center lg:text-start flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8 shadow-sm self-center lg:self-start">
            <Store size={16} className="text-diyar-cream" />
            <span className="text-diyar-cream text-sm font-bold">{t('home.partners.badge')}</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-sans font-bold text-white mb-6 leading-snug">
            {t('home.partners.titleLine1')} <br />
            <span className="text-transparent bg-clip-text bg-linear-to-l from-[#d4b08c] to-yellow-500">
              {t('home.partners.titleHighlight')}
            </span>
          </h2>

          <p className="text-base md:text-lg text-gray-400 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0 font-light">
            {t('home.partners.body')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button
              type="button"
              onClick={() => goToRegister('merchant')}
              className="flex items-center justify-center gap-2 bg-diyar-cream text-diyar-dark px-8 py-4 rounded-xl font-bold hover:bg-white hover:-translate-y-1 transition-all duration-300 shadow-md group cursor-pointer"
            >
              <Store
                className="group-hover:scale-110 transition-transform text-diyar-brown"
                size={20}
              />
              <span>{t('home.partners.registerMerchant')}</span>
            </button>
            <button
              type="button"
              onClick={scrollToCards}
              className="flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white px-8 py-4 rounded-xl font-bold hover:bg-white/20 hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
            >
              <Sparkles
                className="group-hover:scale-110 transition-transform text-yellow-500"
                size={20}
              />
              <span>{t('home.partners.discoverMore')}</span>
            </button>
          </div>
        </div>

        {/* Bento Grid layout for cards */}
        <div ref={cardsRef} className="w-full lg:w-1/2 relative z-10 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => goToRegister('marketer')}
              className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-3xl hover:bg-white/10 transition-all duration-300 group cursor-pointer relative overflow-hidden backdrop-blur-sm flex flex-col text-start"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-diyar-brown/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="w-14 h-14 bg-diyar-brown/20 border border-diyar-brown/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                <Briefcase className="text-diyar-cream" size={28} />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white mb-2">
                {t('home.partners.affiliateTitle')}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed flex-1">
                {t('home.partners.affiliateDesc')}
              </p>
              <div className="inline-flex items-center gap-1.5 text-diyar-brown text-sm font-bold group-hover:text-[#d4b08c] transition-colors mt-6">
                <span>{t('home.partners.affiliateCta')}</span>
                <CtaIcon size={16} />
              </div>
            </button>

            <button
              type="button"
              onClick={() => goToRegister('service_provider')}
              className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-3xl hover:bg-white/10 transition-all duration-300 group cursor-pointer relative overflow-hidden backdrop-blur-sm flex flex-col text-start"
            >
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-diyar-cream/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
              <div className="w-14 h-14 bg-diyar-cream/20 border border-diyar-cream/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                <Paintbrush className="text-diyar-cream" size={28} />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white mb-2">
                {t('home.partners.providerTitle')}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed flex-1">
                {t('home.partners.providerDesc')}
              </p>
              <div className="inline-flex items-center gap-1.5 text-diyar-cream/80 text-sm font-bold group-hover:text-diyar-cream transition-colors mt-6">
                <span>{t('home.partners.providerCta')}</span>
                <CtaIcon size={16} />
              </div>
            </button>
          </div>

          <div className="bg-diyar-brown/10 border border-diyar-brown/20 p-6 md:p-8 rounded-3xl hover:bg-diyar-brown/20 transition-all duration-300 group flex flex-col sm:flex-row items-center gap-6 justify-between relative overflow-hidden backdrop-blur-sm">
            <div className="relative z-10 text-center sm:text-start w-full sm:w-[60%] flex flex-col items-center sm:items-start">
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
                {t('home.partners.dashboardTitle')}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                {t('home.partners.dashboardDesc')}
              </p>
              <button
                type="button"
                onClick={openDashboardDemo}
                className="inline-flex items-center gap-2 text-white bg-white/10 px-4 py-2 rounded-lg text-sm font-bold hover:bg-white/20 transition-colors cursor-pointer"
              >
                <Store size={16} />
                <span>{t('home.partners.dashboardDemo')}</span>
              </button>
            </div>
            <div className="w-full sm:w-[40%] flex justify-center opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500">
              <img
                src="/laptop.png"
                alt="لوحة تحكم"
                className="w-40 md:w-56 object-contain drop-shadow-md"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
