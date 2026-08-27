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

export function BrandsStrip() {
  const brands = [
    {
      name: 'إيكيا',
      logo: (
        <svg viewBox="0 0 120 40" className="h-8 md:h-12 w-auto">
          <rect width="120" height="40" fill="#0051ba" />
          <ellipse cx="60" cy="20" rx="55" ry="18" fill="#ffda1a" />
          <text
            x="60"
            y="28"
            fill="#0051ba"
            fontFamily="Impact, Arial Black, sans-serif"
            fontSize="24"
            fontWeight="bold"
            textAnchor="middle"
            letterSpacing="1"
          >
            IKEA
          </text>
        </svg>
      ),
    },
    {
      name: 'أشلي',
      logo: (
        <svg viewBox="0 0 140 40" className="h-8 md:h-10 w-auto">
          <text
            x="70"
            y="28"
            fill="#e87722"
            fontFamily="Georgia, serif"
            fontSize="26"
            fontWeight="bold"
            fontStyle="italic"
            textAnchor="middle"
          >
            Ashley.
          </text>
        </svg>
      ),
    },
    {
      name: 'ويست إلم',
      logo: (
        <svg viewBox="0 0 140 30" className="h-6 md:h-8 w-auto">
          <text
            x="70"
            y="22"
            fill="#333"
            fontFamily="Arial, Helvetica, sans-serif"
            fontSize="22"
            fontWeight="bold"
            textAnchor="middle"
            letterSpacing="2"
          >
            WEST ELM
          </text>
        </svg>
      ),
    },
    {
      name: 'بوكونسبت',
      logo: (
        <svg viewBox="0 0 140 30" className="h-6 md:h-8 w-auto">
          <text
            x="70"
            y="22"
            fill="#000"
            fontFamily="Arial, sans-serif"
            fontSize="22"
            fontWeight="bold"
            textAnchor="middle"
            letterSpacing="1"
          >
            BoConcept
          </text>
        </svg>
      ),
    },
    {
      name: 'بوتري بارن',
      logo: (
        <svg viewBox="0 0 200 30" className="h-5 md:h-7 w-auto">
          <text
            x="100"
            y="22"
            fill="#111"
            fontFamily="Times New Roman, serif"
            fontSize="22"
            fontWeight="normal"
            textAnchor="middle"
            letterSpacing="1"
          >
            P O T T E R Y B A R N
          </text>
        </svg>
      ),
    },
    {
      name: 'ناتوزي',
      logo: (
        <svg viewBox="0 0 140 30" className="h-5 md:h-7 w-auto">
          <text
            x="70"
            y="22"
            fill="#000"
            fontFamily="Arial, sans-serif"
            fontSize="20"
            fontWeight="bold"
            textAnchor="middle"
            letterSpacing="4"
          >
            NATUZZI
          </text>
        </svg>
      ),
    },
    {
      name: 'هيرمان ميلر',
      logo: (
        <svg viewBox="0 0 180 40" className="h-8 md:h-12 w-auto">
          <circle cx="20" cy="20" r="14" fill="#d00000" />
          <text
            x="100"
            y="26"
            fill="#000"
            fontFamily="Arial, sans-serif"
            fontSize="20"
            fontWeight="bold"
            textAnchor="middle"
            letterSpacing="1"
          >
            HermanMiller
          </text>
        </svg>
      ),
    },
    {
      name: 'موجي',
      logo: (
        <svg viewBox="0 0 100 30" className="h-6 md:h-9 w-auto">
          <rect width="100" height="30" fill="#7f0019" />
          <text
            x="50"
            y="21"
            fill="white"
            fontFamily="Arial, Helvetica, sans-serif"
            fontSize="18"
            fontWeight="bold"
            textAnchor="middle"
            letterSpacing="2"
          >
            MUJI
          </text>
        </svg>
      ),
    },
  ];

  return (
    <div className="bg-white py-8 border-y border-gray-100 overflow-hidden flex" dir="ltr">
      <div className="flex animate-marquee shrink-0 gap-16 md:gap-32 pr-16 md:pr-32 items-center w-max">
        {[...brands, ...brands, ...brands, ...brands].map((brand, i) => (
          <div
            key={i}
            className="flex items-center justify-center grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer shrink-0 min-w-30 md:min-w-40 min-h-15"
          >
            {brand.logo}
          </div>
        ))}
      </div>
    </div>
  );
}
