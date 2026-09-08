import { ArrowDown, Sparkles } from 'lucide-react';
import { useLandingLocale } from '../hooks/useLandingLocale.ts';
import { LANDING_ASSETS } from '../constants.ts';
import { LandingImage } from './LandingImage.tsx';
import { LandingAnchor } from './LandingAnchor.tsx';

export function LandingHero() {
  const { messages } = useLandingLocale();

  return (
    <section className="relative flex min-h-[100dvh] flex-col justify-center overflow-hidden pb-10 pt-24 md:pb-14 md:pt-28 landing-hero">
      <div className="pointer-events-none absolute inset-0 landing-hero-glow" aria-hidden />
      <div className="pointer-events-none absolute -top-24 start-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#5A57FE]/10 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute bottom-0 end-0 h-64 w-64 rounded-full bg-diyar-brown/10 blur-3xl" aria-hidden />

      <div className="relative mx-auto grid w-full max-w-7xl flex-1 items-center gap-10 px-4 md:grid-cols-2 md:gap-14 md:px-6 lg:gap-16">
        <div className="landing-reveal text-start">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-diyar-brown/15 bg-white/90 px-3.5 py-1.5 text-xs font-bold text-diyar-brown shadow-sm">
            <Sparkles size={14} className="landing-hero-sparkle" aria-hidden />
            {messages.hero.eyebrow}
          </p>

          <h1 className="mb-4 max-w-xl text-3xl font-bold leading-[1.2] text-diyar-dark md:text-4xl lg:text-[2.65rem]">
            {messages.hero.title}
          </h1>

          <p className="mb-8 max-w-xl text-base leading-relaxed text-gray-600 md:text-lg">
            {messages.hero.subtitle}
          </p>

          <div className="flex flex-wrap gap-3">
            <LandingAnchor href="#about" className="landing-btn landing-btn-primary">
              {messages.hero.primaryCta}
            </LandingAnchor>
            <LandingAnchor href="#contact" className="landing-btn landing-btn-secondary">
              {messages.hero.secondaryCta}
            </LandingAnchor>
          </div>
        </div>

        <div className="relative landing-reveal landing-reveal-delay w-full">
          <div className="landing-hero-visual mx-auto w-full max-w-xl md:max-w-none">
            <div className="landing-hero-card landing-hero-card-back landing-hero-card-back-left landing-hero-float-up">
              <LandingImage
                src={LANDING_ASSETS.heroAccent}
                alt={messages.hero.accentAlt}
                width={420}
                height={280}
                wrapperClassName="rounded-2xl"
                className="rounded-2xl"
              />
            </div>
            <div className="landing-hero-card landing-hero-card-back landing-hero-card-back-right landing-hero-float-down">
              <LandingImage
                src={LANDING_ASSETS.heroSecondary}
                alt=""
                width={360}
                height={240}
                wrapperClassName="rounded-2xl"
                className="rounded-2xl"
              />
            </div>
            <div className="landing-hero-card landing-hero-card-back landing-hero-card-back-top landing-hero-float-up-slow hidden sm:block">
              <LandingImage
                src={LANDING_ASSETS.heroTertiary}
                alt=""
                width={320}
                height={220}
                wrapperClassName="rounded-2xl"
                className="rounded-2xl"
              />
            </div>
            <div className="landing-hero-card landing-hero-card-main landing-hero-float-main">
              <LandingImage
                src={LANDING_ASSETS.phoneMockup}
                alt={messages.hero.imageAlt}
                width={640}
                height={800}
                priority
                objectFit="contain"
                wrapperClassName="rounded-[1.75rem] bg-white"
                className="rounded-[1.75rem]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center landing-reveal landing-reveal-delay-2">
        <LandingAnchor
          href="#about"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-diyar-brown/15 bg-white/90 text-diyar-brown shadow-sm transition-all hover:-translate-y-0.5 hover:border-diyar-brown/30 hover:text-diyar-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-diyar-brown cursor-pointer"
          ariaLabel={messages.nav.about}
        >
          <ArrowDown size={22} className="landing-scroll-hint" aria-hidden />
        </LandingAnchor>
      </div>
    </section>
  );
}
