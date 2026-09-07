import React, { Suspense, lazy, useMemo } from 'react';
import Hero from '../components/home/Hero.tsx';
import CategoriesStrip from '../components/home/CategoriesStrip.tsx';
import FeaturedDeals from '../components/home/FeaturedDeals.tsx';
import { DeferredHomeBelowFold } from '../components/home/DeferredHomeBelowFold.tsx';
import { HomeSectionSkeleton } from '../components/home/HomeSectionSkeleton.tsx';
import { useHydrateHomeStorefront } from '../hooks/storefront/useHydrateHomeStorefront.ts';
import { useLocale } from '../hooks/useLocale.ts';
import { usePageSeo } from '../hooks/usePageSeo.ts';

const FastOffersSlider = lazy(() =>
  import('../components/home/sections/FastOffersSlider.tsx').then((m) => ({
    default: m.FastOffersSlider,
  })),
);

const MostInteractiveProducts = lazy(() =>
  import('../components/home/sections/MostInteractiveProducts.tsx').then((m) => ({
    default: m.MostInteractiveProducts,
  })),
);

const HomePromoPopup = lazy(() =>
  import('../components/home/HomePromoPopup.tsx').then((m) => ({
    default: m.HomePromoPopup,
  })),
);

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
      <Suspense fallback={<HomeSectionSkeleton />}>
        <FastOffersSlider />
      </Suspense>
      <Suspense fallback={<HomeSectionSkeleton />}>
        <MostInteractiveProducts />
      </Suspense>
      <FeaturedDeals />
      <DeferredHomeBelowFold />
      <Suspense fallback={null}>
        <HomePromoPopup />
      </Suspense>
    </main>
  );
}
