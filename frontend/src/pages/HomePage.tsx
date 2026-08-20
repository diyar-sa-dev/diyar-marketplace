import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLocale } from '../hooks/useLocale.ts';
import Hero from '../components/home/Hero.tsx';
import CategoriesStrip from '../components/home/CategoriesStrip.tsx';
import FeaturedDeals from '../components/home/FeaturedDeals.tsx';
import {
  BestSellers,
  StyleFilter,
  AIBanner,
  NewArrivals,
  SuggestedForYou,
  Reviews,
  Newsletter,
  PartnerBanner,
  ShopByRoom,
  FeaturedStores,
  WhyChooseDiyar,
  DesignBlog,
  AppPromo,
  FastOffersSlider,
  SummerBanner,
  SummerBanner2,
  BrandsStrip,
  LoyaltyPromo,
  ServicesSection,
  MostInteractiveProducts,
} from '../components/home/Sections.tsx';

export default function HomePage() {
  const { t } = useLocale();
  const [showAdPopup, setShowAdPopup] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAdPopup(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main>
      <Hero />
      <CategoriesStrip />
      <FastOffersSlider />
      <MostInteractiveProducts />
      <FeaturedDeals />
      <SummerBanner2 />
      <ServicesSection />
      <ShopByRoom />
      <NewArrivals />
      <FeaturedStores />
      <SummerBanner />
      <WhyChooseDiyar />
      <BestSellers />
      <AIBanner />
      <StyleFilter />
      <SuggestedForYou />
      <LoyaltyPromo />
      <PartnerBanner />
      <BrandsStrip />
      <Reviews />
      <DesignBlog />
      <AppPromo />
      <Newsletter />

      {showAdPopup && (
        <div
          className="fixed inset-0 bg-black/65 backdrop-blur-sm z-300 flex items-center justify-center p-4 animate-in fade-in duration-300"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-w-3xl w-full bg-white flex flex-col rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 ring-1 ring-white/20">
            <button
              type="button"
              onClick={() => setShowAdPopup(false)}
              className="absolute top-4 right-4 z-20 bg-black/50 hover:bg-black/70 text-white p-2.5 rounded-full backdrop-blur-md transition-colors cursor-pointer border border-white/20 shadow-lg"
              aria-label={t('home.adPopup.close')}
              title={t('home.adPopup.close')}
            >
              <X size={20} />
            </button>
            <Link
              to="/category/all?discounted=1&sort=-discount"
              className="relative block cursor-pointer group"
              onClick={() => setShowAdPopup(false)}
            >
              <img
                src="/بنر عروض الصيف.png"
                alt={t('home.adPopup.alt')}
                className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.01]"
              />
              <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-black/35 to-transparent pointer-events-none" />
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
