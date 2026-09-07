import { lazy, Suspense, useEffect } from 'react';
import { useLandingLocale } from './hooks/useLandingLocale.ts';
import { applyLandingSeo } from './landingSeo.ts';
import { LandingFooter, LandingHeader } from './components/LandingChrome.tsx';
import { LandingHero } from './components/LandingHero.tsx';
import { LandingSectionSkeleton } from './components/LandingImage.tsx';

const LandingBelowFold = lazy(() => import('./components/LandingBelowFold.tsx'));

export default function LandingPage() {
  const { locale, messages, dir } = useLandingLocale();

  useEffect(() => {
    applyLandingSeo(messages, locale);
  }, [messages, locale]);

  return (
    <div
      id="top"
      lang={locale}
      dir={dir}
      className={`min-h-screen overflow-x-clip bg-diyar-cream text-diyar-dark landing-page landing-page-${locale}`}
    >
      <LandingHeader />

      <main>
        <LandingHero />

        <Suspense fallback={<LandingSectionSkeleton />}>
          <LandingBelowFold />
        </Suspense>
      </main>

      <LandingFooter />
    </div>
  );
}
