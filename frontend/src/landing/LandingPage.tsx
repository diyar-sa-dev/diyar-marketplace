import { lazy, Suspense, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLandingLocale } from './hooks/useLandingLocale.ts';
import { resolveLandingLocaleFromParam } from './LandingLocaleProvider.tsx';
import { applyLandingSeo, landingLocaleHref } from './landingSeo.ts';
import { LandingFooter, LandingHeader } from './components/LandingChrome.tsx';
import { LandingHero } from './components/LandingHero.tsx';
import { LandingSectionSkeleton } from './components/LandingImage.tsx';

const LandingBelowFold = lazy(() => import('./components/LandingBelowFold.tsx'));

export default function LandingPage() {
  const { locale: paramLocale } = useParams();
  const { locale, messages, setLocale, dir } = useLandingLocale();
  const navigate = useNavigate();

  useEffect(() => {
    const fromParam = resolveLandingLocaleFromParam(paramLocale);
    if (fromParam && fromParam !== locale) {
      setLocale(fromParam);
    }
  }, [paramLocale, locale, setLocale]);

  useEffect(() => {
    applyLandingSeo(messages, locale);
  }, [messages, locale]);

  useEffect(() => {
    if (!paramLocale && locale !== 'ar') {
      navigate(landingLocaleHref(locale), { replace: true });
    }
  }, [paramLocale, locale, navigate]);

  return (
    <div id="top" className="min-h-screen overflow-x-clip bg-diyar-cream text-diyar-dark landing-page" dir={dir}>
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
