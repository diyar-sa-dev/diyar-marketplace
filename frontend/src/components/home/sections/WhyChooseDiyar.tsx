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

export function WhyChooseDiyar() {
  const { t } = useLocale();
  const features = [
    {
      titleKey: 'home.whyChoose.unlimitedTitle',
      descKey: 'home.whyChoose.unlimitedDesc',
      icon: 'star',
    },
    { titleKey: 'home.whyChoose.arTitle', descKey: 'home.whyChoose.arDesc', icon: 'sparkles' },
    {
      titleKey: 'home.whyChoose.shippingTitle',
      descKey: 'home.whyChoose.shippingDesc',
      icon: 'truck',
    },
    {
      titleKey: 'home.whyChoose.paymentTitle',
      descKey: 'home.whyChoose.paymentDesc',
      icon: 'lock',
    },
  ] as const;

  return (
    <div className="py-6 md:py-8 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex overflow-x-auto md:grid md:grid-cols-4 gap-4 md:gap-8 text-center pb-4 md:pb-0 scrollbar-hide snap-x">
          {features.map((feature, index) => (
            <div
              key={feature.titleKey}
              className="flex flex-col items-center bg-gray-50 md:bg-transparent p-6 md:p-0 rounded-xl md:rounded-none min-w-60 md:min-w-0 snap-start border border-gray-100 md:border-none"
            >
              <div
                className={`w-14 h-14 md:w-16 md:h-16 bg-white md:bg-diyar-cream rounded-xl flex items-center justify-center text-diyar-brown mb-4 md:mb-6 hover:rotate-0 transition-transform shadow-sm md:shadow-none ${
                  index % 2 === 0 ? 'rotate-3' : '-rotate-3'
                }`}
              >
                {feature.icon === 'star' && <Star size={28} className="md:w-8 md:h-8" />}
                {feature.icon === 'sparkles' && <Sparkles size={28} className="md:w-8 md:h-8" />}
                {feature.icon === 'truck' && (
                  <svg
                    width="28"
                    height="28"
                    className="md:w-8 md:h-8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="1" y="3" width="15" height="13"></rect>
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                    <circle cx="5.5" cy="18.5" r="2.5"></circle>
                    <circle cx="18.5" cy="18.5" r="2.5"></circle>
                  </svg>
                )}
                {feature.icon === 'lock' && (
                  <svg
                    width="28"
                    height="28"
                    className="md:w-8 md:h-8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                )}
              </div>
              <h3 className="text-lg md:text-xl font-bold text-diyar-dark mb-2 md:mb-3">
                {t(feature.titleKey)}
              </h3>
              <p className="text-gray-500 text-sm md:text-base leading-relaxed">
                {t(feature.descKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
