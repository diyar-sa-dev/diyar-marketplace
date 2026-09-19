import { useEffect } from 'react';
import { applyLandingSeo } from './landingSeo.ts';
import { COMING_SOON_COPY } from './comingSoon/copy.ts';
import { BrandMark } from './comingSoon/BrandMark.tsx';
import { HeroVisual } from './comingSoon/HeroVisual.tsx';
import { ComingSoonMessage } from './comingSoon/ComingSoonMessage.tsx';
import { LaunchStatement } from './comingSoon/LaunchStatement.tsx';

export default function DiyarComingSoonPage() {
  useEffect(() => {
    applyLandingSeo({ meta: COMING_SOON_COPY.meta }, 'ar');
  }, []);

  return (
    <div className="coming-soon-page" lang="ar" dir="rtl">
      <div className="coming-soon-bg" aria-hidden />
      <div className="coming-soon-grain" aria-hidden />

      <main className="coming-soon-shell">
        <header className="coming-soon-header">
          <BrandMark />
        </header>

        <div className="coming-soon-body">
          <div className="coming-soon-visual-column">
            <HeroVisual />
          </div>

          <div className="coming-soon-text-column">
            <ComingSoonMessage />
            <LaunchStatement />
          </div>
        </div>

        <footer className="coming-soon-footer">
          <p>{COMING_SOON_COPY.footer}</p>
        </footer>
      </main>
    </div>
  );
}
