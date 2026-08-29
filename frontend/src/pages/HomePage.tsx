import Hero from '../components/home/Hero.tsx';
import CategoriesStrip from '../components/home/CategoriesStrip.tsx';
import FeaturedDeals from '../components/home/FeaturedDeals.tsx';
import { FastOffersSlider, MostInteractiveProducts } from '../components/home/Sections.tsx';
import { DeferredHomeBelowFold } from '../components/home/DeferredHomeBelowFold.tsx';
import { HomePromoPopup } from '../components/home/HomePromoPopup.tsx';
import { useHydrateHomeStorefront } from '../hooks/storefront/useHydrateHomeStorefront.ts';

export default function HomePage() {
  useHydrateHomeStorefront();

  return (
    <main>
      <Hero />
      <CategoriesStrip />
      <FastOffersSlider />
      <MostInteractiveProducts />
      <FeaturedDeals />
      <DeferredHomeBelowFold />
      <HomePromoPopup />
    </main>
  );
}
