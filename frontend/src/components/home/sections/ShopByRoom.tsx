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

export function ShopByRoom() {
  const { t, dir } = useLocale();
  const rooms = [
    {
      nameKey: 'home.shopByRoom.rooms.living',
      img: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&q=80&w=600',
    },
    {
      nameKey: 'home.shopByRoom.rooms.bedroom',
      img: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=600',
    },
    {
      nameKey: 'home.shopByRoom.rooms.dining',
      img: 'https://images.unsplash.com/photo-1617806118233-0011f1823578?auto=format&fit=crop&q=80&w=600',
    },
    {
      nameKey: 'home.shopByRoom.rooms.office',
      img: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=600',
    },
    {
      nameKey: 'home.shopByRoom.rooms.outdoor',
      img: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=600',
    },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto py-8 md:py-12 px-4 relative" dir={dir}>
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-xl md:text-4xl font-sans font-bold text-diyar-dark mb-4">
          {t('home.shopByRoom.title')}
        </h2>
        <p className="text-gray-500 text-sm md:text-base max-w-2xl mx-auto">
          {t('home.shopByRoom.subtitle')}
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 opacity-80 pointer-events-none select-none">
        {rooms.map((room) => (
          <div
            key={room.nameKey}
            className="h-44 md:h-60 rounded-2xl overflow-hidden relative shadow-sm border border-gray-100"
          >
            <img
              src={room.img}
              alt={t(room.nameKey)}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover grayscale-15"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=600';
              }}
            />
            <div className="absolute inset-0 bg-linear-to-t from-diyar-dark/85 via-black/25 to-transparent" />
            <div className="absolute bottom-4 md:bottom-6 inset-x-4 text-white text-center">
              <h3 className="text-base md:text-xl font-bold font-sans mb-1 md:mb-2">
                {t(room.nameKey)}
              </h3>
              <span className="text-xs md:text-sm border border-white/35 px-3 md:px-4 py-1 md:py-1.5 rounded-full backdrop-blur-sm inline-block">
                {t('home.shopByRoom.shopNow')}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center pointer-events-none px-4">
        <span className="bg-white/95 backdrop-blur-sm text-diyar-dark text-sm font-bold px-5 py-2.5 rounded-full border border-gray-200 shadow-lg">
          {t('home.shopByRoom.comingSoon')}
        </span>
      </div>
    </div>
  );
}
