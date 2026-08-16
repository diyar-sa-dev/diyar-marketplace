import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../cards/ProductCard.tsx';
import { useProducts } from '../../hooks/catalog/useCatalog.ts';
import { mapProductCard } from '../../lib/catalogMappers.ts';

export default function FeaturedDeals() {
  const [timeLeft, setTimeLeft] = useState(2 * 3600 + 14 * 60 + 35);
  const { data, isLoading } = useProducts({ per_page: 5, discounted: true, sort: '-discount' });
  const products = data?.items.map(mapProductCard) ?? [];

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
        <h2 className="text-2xl md:text-3xl font-sans font-bold">عروض مميزة</h2>
        <div className="flex items-center gap-3">
          <div
            className="text-sm md:text-xl font-bold bg-diyar-cream p-2 md:p-3 rounded-lg text-diyar-brown tabular-nums"
            dir="ltr"
          >
            {format(timeLeft)}
          </div>
          <Link
            to="/category/all?discounted=1&sort=-discount"
            className="hidden sm:inline-flex text-diyar-brown text-sm font-bold hover:text-diyar-dark transition cursor-pointer"
          >
            عرض الكل
          </Link>
        </div>
      </div>
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
    </div>
  );
}
