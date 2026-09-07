import { ArrowDown, CalendarCheck, Sparkles } from 'lucide-react';
import { DiyarBrandMark } from '../../components/common/DiyarBrandMark.tsx';
import { useLandingLocale } from '../hooks/useLandingLocale.ts';
import { LANDING_ASSETS } from '../constants.ts';
import { LandingImage } from './LandingImage.tsx';

export function LandingHero() {
  const { messages } = useLandingLocale();

  return (
    <section className="relative overflow-hidden pb-14 pt-8 md:pb-20 md:pt-12 landing-hero">
      <div className="pointer-events-none absolute inset-0 landing-hero-glow" aria-hidden />
      <div className="pointer-events-none absolute -top-24 start-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#5A57FE]/10 blur-3xl" aria-hidden />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:gap-12 md:px-6">
        <div className="landing-reveal">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-diyar-brown/15 bg-white/85 px-3.5 py-1.5 text-xs font-bold text-diyar-brown shadow-sm backdrop-blur-sm">
            <Sparkles size={14} aria-hidden />
            {messages.hero.eyebrow}
          </p>

          <div className="mb-5">
            <DiyarBrandMark />
          </div>

          <h1 className="mb-4 max-w-xl text-3xl font-bold leading-[1.15] text-diyar-dark md:text-4xl lg:text-[2.75rem]">
            {messages.hero.title}
          </h1>

          <p className="mb-6 max-w-xl text-base leading-relaxed text-gray-600 md:text-lg">
            {messages.hero.subtitle}
          </p>

          <p className="mb-8 inline-flex items-center gap-2 rounded-2xl border border-diyar-brown/10 bg-white/70 px-3.5 py-2.5 text-sm font-semibold text-diyar-dark shadow-sm">
            <CalendarCheck size={16} className="shrink-0 text-diyar-brown" aria-hidden />
            {messages.hero.status}
          </p>

          <div className="flex flex-wrap gap-3">
            <a href="#about" className="landing-btn landing-btn-primary">
              {messages.hero.primaryCta}
            </a>
            <a href="#contact" className="landing-btn landing-btn-secondary">
              {messages.hero.secondaryCta}
            </a>
          </div>
        </div>

        <div className="relative landing-reveal landing-reveal-delay">
          <div className="landing-hero-visual">
            <div className="landing-hero-card landing-hero-card-main">
              <LandingImage
                src={LANDING_ASSETS.phoneMockup}
                alt={messages.hero.imageAlt}
                width={640}
                height={800}
                priority
                wrapperClassName="rounded-2xl"
                className="rounded-2xl"
              />
            </div>
            <div className="landing-hero-card landing-hero-card-accent hidden sm:block">
              <LandingImage
                src={LANDING_ASSETS.heroAccent}
                alt={messages.hero.accentAlt}
                width={480}
                height={320}
                wrapperClassName="rounded-xl"
                className="rounded-xl"
              />
            </div>
            <div className="landing-hero-card landing-hero-card-secondary hidden md:block">
              <LandingImage
                src={LANDING_ASSETS.heroSecondary}
                alt=""
                width={360}
                height={240}
                wrapperClassName="rounded-xl"
                className="rounded-xl"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center landing-reveal landing-reveal-delay-2">
        <a
          href="#about"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-diyar-brown/15 bg-white/80 text-diyar-brown shadow-sm transition-colors hover:border-diyar-brown/30 hover:text-diyar-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-diyar-brown cursor-pointer"
          aria-label={messages.nav.about}
        >
          <ArrowDown size={22} className="landing-scroll-hint" aria-hidden />
        </a>
      </div>
    </section>
  );
}
