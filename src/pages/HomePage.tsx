import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Hero from '../components/home/Hero.tsx';
import CategoriesStrip from '../components/home/CategoriesStrip.tsx';
import FeaturedDeals from '../components/home/FeaturedDeals.tsx';
import { BestSellers, StyleFilter, AIBanner, NewArrivals, SuggestedForYou, Reviews, Newsletter, PartnerBanner, ShopByRoom, FeaturedStores, WhyChooseDiyar, DesignBlog, AppPromo, FastOffersSlider, SummerBanner, SummerBanner2, BrandsStrip, LoyaltyPromo, ServicesSection, MostInteractiveProducts } from '../components/home/Sections.tsx';

export default function HomePage() {
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

      {/* Ad Popup */}
      {showAdPopup && (
        <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="relative max-w-3xl w-full bg-white flex flex-col rounded-xl md:rounded-xl shadow-md overflow-hidden animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowAdPopup(false)}
              className="absolute top-4 right-4 z-10 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-md transition-colors"
            >
              <X size={24} />
            </button>
            <div className="relative cursor-pointer" onClick={() => setShowAdPopup(false)}>
              <img 
                src="/بنر عروض الصيف.png" 
                alt="عروض الصيف" 
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
