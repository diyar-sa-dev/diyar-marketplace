import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tag } from 'lucide-react';
import ProductCard from '../cards/ProductCard.tsx';
import SectionEmptyState from './SectionEmptyState.tsx';
import { useProducts } from '../../hooks/catalog/useCatalog.ts';
import { mapProductCard } from '../../lib/catalogMappers.ts';
import { useLocale } from '../../hooks/useLocale.ts';

export default function FeaturedDeals() {
  const { t } = useLocale();
  const [timeLeft, setTimeLeft] = useState(2 * 3600 + 14 * 60 + 35);
  const { data, isLoading } = useProducts({ per_page: 5, discounted: true, sort: '-discount' });
  const products = data?.items.map(mapProductCard) ?? [];
  const showEmpty = !isLoading && products.length === 0;

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const format = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto py-8 md:py-12 px-4">
      <div className="flex justify-between items-center mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-sans font-bold">{t('home.featuredDeals.title')}</h2>
        <div className="flex items-center gap-3">
          {!showEmpty && (
            <div
              className="text-sm md:text-xl font-bold bg-diyar-cream p-2 md:p-3 rounded-lg text-diyar-brown tabular-nums"
              dir="ltr"
            >
              {format(timeLeft)}
            </div>
          )}
          <Link
            to="/category/all?discounted=1&sort=-discount"
            className="hidden sm:inline-flex text-diyar-brown text-sm font-bold hover:text-diyar-dark transition cursor-pointer"
          >
            {t('home.featuredDeals.viewAll')}
          </Link>
        </div>
      </div>
      {showEmpty ? (
        <SectionEmptyState
          title={t('home.featuredDeals.emptyTitle')}
          description={t('home.featuredDeals.emptyDescription')}
          browseLabel={t('home.featuredDeals.browseAll')}
          browseTo="/category/all?discounted=1&sort=-discount"
          icon={Tag}
        />
      ) : (
        <div className="flex md:grid md:grid-cols-5 gap-4 md:gap-5 overflow-x-auto scrollbar-hide snap-x py-6 -my-6">
          {isLoading
            ? [...Array(5)].map((_, i) => (
                <div key={i} className="w-50 md:w-auto shrink-0 snap-start">
                  <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
                </div>
              ))
            : products.map((p) => (
                <div key={p.id} className="w-50 md:w-auto shrink-0 snap-start">
                  <ProductCard product={p} />
                </div>
              ))}
        </div>
      )}
    </div>
  );
}
