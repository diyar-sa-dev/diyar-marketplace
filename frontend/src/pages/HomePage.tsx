import React, { useMemo } from 'react';
import Hero from '../components/home/Hero.tsx';
import CategoriesStrip from '../components/home/CategoriesStrip.tsx';
import FeaturedDeals from '../components/home/FeaturedDeals.tsx';
import { FastOffersSlider, MostInteractiveProducts } from '../components/home/Sections.tsx';
import { DeferredHomeBelowFold } from '../components/home/DeferredHomeBelowFold.tsx';
import { HomePromoPopup } from '../components/home/HomePromoPopup.tsx';
import { useHydrateHomeStorefront } from '../hooks/storefront/useHydrateHomeStorefront.ts';
import { useLocale } from '../hooks/useLocale.ts';
import { usePageSeo } from '../hooks/usePageSeo.ts';

export default function HomePage() {
  useHydrateHomeStorefront();
  const { t } = useLocale();

  const seo = useMemo(
    () => ({
      title: t('seo.homeTitle'),
      description: t('seo.homeDescription'),
      canonicalPath: '/',
    }),
    [t],
  );
  usePageSeo(seo);

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
