import { useEffect, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowDown,
  CalendarCheck,
  Handshake,
  Mail,
  Phone,
  Search,
  Sparkles,
  Users,
  Wrench,
} from 'lucide-react';
import { useLandingLocale } from './hooks/useLandingLocale.ts';
import { resolveLandingLocaleFromParam } from './LandingLocaleProvider.tsx';
import { applyLandingSeo, landingLocaleHref } from './landingSeo.ts';
import { LandingFooter, LandingHeader } from './components/LandingChrome.tsx';
import {
  getPlatformSupportMailHref,
  getPlatformSupportPhoneDisplay,
  getPlatformSupportTelHref,
} from '../lib/platformContact.ts';
import { DiyarBrandMark } from '../components/common/DiyarBrandMark.tsx';

function SectionShell({
  id,
  title,
  subtitle,
  children,
  tone = 'light',
}: {
  id: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  tone?: 'light' | 'cream' | 'dark';
}) {
  const bg =
    tone === 'dark'
      ? 'bg-diyar-dark text-white'
      : tone === 'cream'
        ? 'bg-diyar-cream'
        : 'bg-white';

  return (
    <section id={id} className={`${bg} py-16 md:py-24 scroll-mt-20 landing-section`}>
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mb-10 max-w-2xl">
          <h2
            className={`text-2xl md:text-3xl font-bold mb-3 ${
              tone === 'dark' ? 'text-white' : 'text-diyar-dark'
            }`}
          >
            {title}
          </h2>
          {subtitle ? (
            <p className={`text-base leading-relaxed ${tone === 'dark' ? 'text-white/75' : 'text-gray-600'}`}>
              {subtitle}
            </p>
          ) : null}
        </div>
        {children}
      </div>
    </section>
  );
}

function StepList({ steps, tone = 'light' }: { steps: string[]; tone?: 'light' | 'dark' }) {
  return (
    <ol className="grid gap-3">
      {steps.map((step, index) => (
        <li
          key={step}
          className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${
            tone === 'dark'
              ? 'border-white/10 bg-white/5'
              : 'border-diyar-brown/10 bg-white shadow-sm'
          }`}
        >
          <span
            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              tone === 'dark' ? 'bg-diyar-brown text-white' : 'bg-diyar-cream text-diyar-dark'
            }`}
          >
            {index + 1}
          </span>
          <span className={`text-sm font-semibold ${tone === 'dark' ? 'text-white/90' : 'text-diyar-dark'}`}>
            {step}
          </span>
        </li>
      ))}
    </ol>
  );
}

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

  const mailHref = getPlatformSupportMailHref();
  const telHref = getPlatformSupportTelHref();
  const phoneDisplay = getPlatformSupportPhoneDisplay();

  return (
    <div id="top" className="min-h-screen bg-diyar-cream text-diyar-dark" dir={dir}>
      <LandingHeader />

      <main>
        <section className="relative overflow-hidden bg-linear-to-b from-white via-diyar-cream to-diyar-cream pb-16 pt-10 md:pb-24 md:pt-16 landing-hero">
          <div className="pointer-events-none absolute inset-0 opacity-40 landing-hero-glow" aria-hidden />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-2 md:items-center md:gap-12 md:px-6">
            <div className="landing-reveal">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-diyar-brown/15 bg-white/80 px-3 py-1 text-xs font-bold text-diyar-brown">
                <Sparkles size={14} aria-hidden />
                {messages.hero.eyebrow}
              </p>
              <div className="mb-4">
                <DiyarBrandMark />
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-diyar-dark mb-4">
                {messages.hero.title}
              </h1>
              <p className="text-base md:text-lg leading-relaxed text-gray-600 mb-6 max-w-xl">
                {messages.hero.subtitle}
              </p>
              <p className="inline-flex items-center gap-2 rounded-xl bg-diyar-dark/5 px-3 py-2 text-sm font-semibold text-diyar-dark mb-8">
                <CalendarCheck size={16} className="text-diyar-brown" aria-hidden />
                {messages.hero.status}
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="#about"
                  className="inline-flex items-center justify-center rounded-2xl bg-diyar-dark px-6 py-3 text-sm font-bold text-diyar-cream shadow-md hover:bg-black transition-colors"
                >
                  {messages.hero.primaryCta}
                </a>
                <a
                  href="#contact"
                  className="inline-flex items-center justify-center rounded-2xl border border-diyar-brown/20 bg-white px-6 py-3 text-sm font-bold text-diyar-dark hover:border-diyar-brown transition-colors"
                >
                  {messages.hero.secondaryCta}
                </a>
              </div>
            </div>

            <div className="relative landing-reveal landing-reveal-delay">
              <div className="rounded-3xl border border-diyar-brown/10 bg-white p-4 shadow-xl">
                <img
                  src="/diyar-phone-mockup.webp"
                  alt={messages.hero.imageAlt}
                  className="w-full rounded-2xl object-cover"
                  width={640}
                  height={800}
                  loading="eager"
                  decoding="async"
                />
              </div>
            </div>
          </div>
          <div className="mt-10 flex justify-center landing-reveal landing-reveal-delay-2">
            <a href="#about" className="text-diyar-brown/80 hover:text-diyar-brown" aria-label={messages.nav.about}>
              <ArrowDown className="animate-bounce" size={24} />
            </a>
          </div>
        </section>

        <SectionShell id="about" title={messages.intro.title}>
          <p className="max-w-3xl text-lg leading-relaxed text-gray-700">{messages.intro.body}</p>
        </SectionShell>

        <SectionShell id="how" title={messages.how.title} tone="cream">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-diyar-dark">
                <Search size={18} className="text-diyar-brown" aria-hidden />
                {messages.how.customersTitle}
              </h3>
              <StepList steps={messages.how.customerSteps} />
            </div>
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-diyar-dark">
                <Wrench size={18} className="text-diyar-brown" aria-hidden />
                {messages.how.providersTitle}
              </h3>
              <StepList steps={messages.how.providerSteps} />
            </div>
          </div>
        </SectionShell>

        <SectionShell id="customers" title={messages.customers.title} subtitle={messages.customers.subtitle}>
          <ul className="grid gap-4 md:grid-cols-2">
            {messages.customers.items.map((item) => (
              <li
                key={item}
                className="rounded-2xl border border-diyar-brown/10 bg-diyar-cream/50 px-5 py-4 text-sm font-semibold text-diyar-dark"
              >
                {item}
              </li>
            ))}
          </ul>
        </SectionShell>

        <SectionShell id="providers" title={messages.providers.title} subtitle={messages.providers.subtitle} tone="cream">
          <ul className="grid gap-4 md:grid-cols-2">
            {messages.providers.items.map((item) => (
              <li
                key={item}
                className="rounded-2xl border border-diyar-brown/10 bg-white px-5 py-4 text-sm font-semibold text-diyar-dark shadow-sm"
              >
                {item}
              </li>
            ))}
          </ul>
        </SectionShell>

        <SectionShell id="ecosystem" title={messages.ecosystem.title} subtitle={messages.ecosystem.subtitle} tone="dark">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-3 rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
              <p className="text-sm uppercase tracking-[0.2em] text-white/60 mb-2">{messages.ecosystem.hub}</p>
              <p className="text-3xl font-black text-diyar-cream">DIYAR</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
              <Users className="mx-auto mb-3 text-diyar-cream" size={28} aria-hidden />
              <p className="font-bold">{messages.ecosystem.customers}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
              <Handshake className="mx-auto mb-3 text-diyar-cream" size={28} aria-hidden />
              <p className="font-bold">{messages.ecosystem.providers}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
              <Wrench className="mx-auto mb-3 text-diyar-cream" size={28} aria-hidden />
              <p className="font-bold">{messages.ecosystem.services}</p>
              <p className="mt-3 text-xs text-white/60">{messages.ecosystem.bookings}</p>
            </div>
          </div>
        </SectionShell>

        <SectionShell id="trust" title={messages.trust.title}>
          <ul className="grid gap-3 md:grid-cols-2">
            {messages.trust.items.map((item) => (
              <li key={item} className="flex gap-3 rounded-2xl bg-white border border-diyar-brown/10 px-4 py-4 shadow-sm">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-diyar-brown" aria-hidden />
                <span className="text-sm font-semibold text-diyar-dark">{item}</span>
              </li>
            ))}
          </ul>
        </SectionShell>

        <SectionShell id="coming" title={messages.coming.title} tone="cream">
          <div className="max-w-3xl rounded-3xl border border-diyar-brown/15 bg-white p-8 shadow-lg landing-reveal">
            <p className="text-lg leading-relaxed text-gray-700 mb-4">{messages.coming.body}</p>
            <p className="text-sm text-gray-500">{messages.coming.note}</p>
          </div>
        </SectionShell>

        <SectionShell id="contact" title={messages.cta.title} subtitle={messages.cta.body}>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href={mailHref}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-diyar-dark px-6 py-3 text-sm font-bold text-diyar-cream hover:bg-black transition-colors"
            >
              <Mail size={18} aria-hidden />
              {messages.cta.email}
            </a>
            <a
              href={telHref}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-diyar-brown/20 bg-white px-6 py-3 text-sm font-bold text-diyar-dark hover:border-diyar-brown transition-colors"
            >
              <Phone size={18} aria-hidden />
              {messages.cta.phone}
              <span className="text-gray-500 font-medium" dir="ltr">
                ({phoneDisplay})
              </span>
            </a>
          </div>
        </SectionShell>
      </main>

      <LandingFooter />
    </div>
  );
}
