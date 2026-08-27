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

export function Newsletter() {
  const { t, locale } = useLocale();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user?.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isAuthenticated) {
      navigate('/auth', { state: { from: '/', authView: 'login' } });
      return;
    }

    const validationError = validateNewsletterEmail(email, t);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      await subscribeNewsletter(email.trim(), locale);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed.message || t('home.newsletter.submitError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white py-6 md:py-8">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-4xl font-sans font-bold mb-4 text-diyar-dark">
          {t('home.newsletter.title')}
        </h2>
        <p className="text-lg text-gray-500 mb-8">{t('home.newsletter.subtitle')}</p>
        {success ? (
          <p className="text-sm font-bold text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3 inline-block">
            {t('home.newsletter.success')}
          </p>
        ) : (
          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto"
          >
            <div className="flex-1 text-start">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('home.newsletter.placeholder')}
                className={`w-full bg-diyar-cream/50 border rounded-lg px-6 py-4 outline-none focus:border-diyar-brown transition ${
                  error ? 'border-red-300' : 'border-gray-200'
                }`}
              />
              {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-diyar-brown text-white px-8 py-4 rounded-lg hover:bg-diyar-dark transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
            >
              <span>
                {submitting ? t('home.newsletter.submitting') : t('home.newsletter.submit')}
              </span>
              <Send className="w-5 h-5 rtl:-scale-x-100" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
