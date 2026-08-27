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

export function StyleFilter() {
  const { t } = useLocale();
  const styles = [
    {
      nameKey: 'home.styleFilter.classic',
      descKey: 'home.styleFilter.classicDesc',
      img: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=800',
    },
    {
      nameKey: 'home.styleFilter.modern',
      descKey: 'home.styleFilter.modernDesc',
      img: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=600',
    },
    {
      nameKey: 'home.styleFilter.neoClassic',
      descKey: 'home.styleFilter.neoClassicDesc',
      img: 'https://images.unsplash.com/photo-1595428774223-ef52624120ec?auto=format&fit=crop&q=80&w=600',
    },
    {
      nameKey: 'home.styleFilter.minimal',
      descKey: 'home.styleFilter.minimalDesc',
      img: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=600',
    },
    {
      nameKey: 'home.styleFilter.naturalWood',
      descKey: 'home.styleFilter.naturalWoodDesc',
      img: 'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?auto=format&fit=crop&q=80&w=600',
    },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto py-8 md:py-12 px-4 relative">
      <div className="text-center mb-6 md:mb-10">
        <span className="text-diyar-brown text-sm md:text-base font-bold mb-3 block">
          {t('home.styleFilter.badge')}
        </span>
        <h2 className="text-2xl md:text-5xl font-sans font-bold text-diyar-dark">
          {t('home.styleFilter.title')}
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 md:gap-5 md:h-150 opacity-70 pointer-events-none select-none">
        {styles.map((s, i) => (
          <div
            key={s.nameKey}
            className={`rounded-xl overflow-hidden relative flex flex-col justify-end ${
              i === 0
                ? 'md:col-span-2 md:row-span-2 h-80 md:h-full'
                : 'md:col-span-1 md:row-span-1 h-56 md:h-full'
            }`}
          >
            <img
              src={s.img}
              alt={t(s.nameKey)}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover grayscale-20"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=60&w=800';
              }}
            />
            <div className="absolute inset-0 bg-linear-to-t from-diyar-dark/90 via-diyar-dark/20 to-transparent"></div>
            <div className="relative z-10 p-6 md:p-8">
              <span className="block font-sans font-bold text-xl md:text-3xl text-white mb-2">
                {t(s.nameKey)}
              </span>
              <span className="block text-white/80 text-sm md:text-base">{t(s.descKey)}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="bg-white/95 backdrop-blur-sm text-diyar-dark text-sm font-bold px-5 py-2.5 rounded-full border border-gray-200 shadow-lg">
          {t('home.styleFilter.comingSoon')}
        </span>
      </div>
    </div>
  );
}
