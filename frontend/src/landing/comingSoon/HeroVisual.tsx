import { COMING_SOON_ASSETS, COMING_SOON_COPY } from './copy.ts';

export function HeroVisual() {
  return (
    <div
      className="coming-soon-enter coming-soon-enter-3 relative mx-auto w-full max-w-md md:max-w-none"
      aria-hidden={false}
    >
      <div className="coming-soon-visual-frame">
        <div className="coming-soon-visual-glow" aria-hidden />
        <img
          src={COMING_SOON_ASSETS.hero}
          alt={COMING_SOON_COPY.heroAlt}
          width={960}
          height={720}
          className="coming-soon-visual-image"
          decoding="async"
          fetchPriority="high"
        />
        <div className="coming-soon-visual-overlay" aria-hidden />
      </div>
    </div>
  );
}
