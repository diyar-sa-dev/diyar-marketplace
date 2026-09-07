import {
  BadgeCheck,
  CalendarCheck,
  Compass,
  GitCompare,
  LayoutGrid,
  Mail,
  Phone,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  UserCheck,
  Users,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLandingLocale } from '../hooks/useLandingLocale.ts';
import { LANDING_ASSETS } from '../constants.ts';
import {
  getPlatformSupportMailHref,
  getPlatformSupportPhoneDisplay,
  getPlatformSupportTelHref,
} from '../../lib/platformContact.ts';
import { LandingImage } from './LandingImage.tsx';
import { LandingSectionShell } from './LandingSectionShell.tsx';

const CUSTOMER_ICONS: LucideIcon[] = [Compass, GitCompare, UserCheck, CalendarCheck];
const PROVIDER_ICONS: LucideIcon[] = [Store, Rocket, LayoutGrid, Sparkles];
const ECOSYSTEM_ICONS: LucideIcon[] = [Users, Wrench, Search];

function StepList({ steps, tone = 'light' }: { steps: string[]; tone?: 'light' | 'dark' }) {
  return (
    <ol className="grid gap-3">
      {steps.map((step, index) => (
        <li
          key={step}
          className={`landing-step-item ${tone === 'dark' ? 'landing-step-item-dark' : ''}`}
        >
          <span className="landing-step-index">{index + 1}</span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}

export default function LandingBelowFold() {
  const { messages } = useLandingLocale();
  const mailHref = getPlatformSupportMailHref();
  const telHref = getPlatformSupportTelHref();
  const phoneDisplay = getPlatformSupportPhoneDisplay();

  return (
    <>
      <LandingSectionShell id="about" title={messages.intro.title} tone="light">
        <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <p className="text-lg leading-relaxed text-gray-700 md:text-xl">{messages.intro.body}</p>
          <LandingImage
            src={LANDING_ASSETS.laptop}
            alt=""
            width={720}
            height={480}
            wrapperClassName="rounded-3xl border border-diyar-brown/10 shadow-xl"
            className="rounded-3xl"
          />
        </div>
      </LandingSectionShell>

      <LandingSectionShell id="how" title={messages.how.title} tone="how" className="landing-section-how">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="landing-flow-panel landing-flow-panel-gradient">
            <h3 className="landing-flow-title">
              <Search size={18} className="text-diyar-cream" aria-hidden />
              {messages.how.customersTitle}
            </h3>
            <StepList steps={messages.how.customerSteps} tone="dark" />
          </div>
          <div className="landing-flow-panel landing-flow-panel-gradient-alt">
            <h3 className="landing-flow-title">
              <Wrench size={18} className="text-diyar-cream" aria-hidden />
              {messages.how.providersTitle}
            </h3>
            <StepList steps={messages.how.providerSteps} tone="dark" />
          </div>
        </div>
      </LandingSectionShell>

      <LandingSectionShell
        id="customers"
        title={messages.customers.title}
        subtitle={messages.customers.subtitle}
        tone="cream"
      >
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
          <LandingImage
            src={LANDING_ASSETS.appMockup}
            alt=""
            width={640}
            height={720}
            wrapperClassName="rounded-3xl border border-diyar-brown/10 shadow-lg"
            className="rounded-3xl"
          />
          <ul className="grid gap-4 sm:grid-cols-2">
            {messages.customers.items.map((item, index) => {
              const Icon = CUSTOMER_ICONS[index] ?? BadgeCheck;
              return (
                <li key={item.title} className="landing-feature-card">
                  <span className="landing-feature-icon">
                    <Icon size={20} aria-hidden />
                  </span>
                  <div>
                    <p className="landing-feature-title">{item.title}</p>
                    <p className="landing-feature-desc">{item.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </LandingSectionShell>

      <LandingSectionShell
        id="providers"
        title={messages.providers.title}
        subtitle={messages.providers.subtitle}
      >
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center">
          <ul className="grid gap-4 sm:grid-cols-2">
            {messages.providers.items.map((item, index) => {
              const Icon = PROVIDER_ICONS[index] ?? Store;
              return (
                <li key={item.title} className="landing-feature-card">
                  <span className="landing-feature-icon landing-feature-icon-alt">
                    <Icon size={20} aria-hidden />
                  </span>
                  <div>
                    <p className="landing-feature-title">{item.title}</p>
                    <p className="landing-feature-desc">{item.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="grid grid-cols-2 gap-3">
            {LANDING_ASSETS.categories.map((src) => (
              <LandingImage
                key={src}
                src={src}
                alt=""
                width={320}
                height={240}
                wrapperClassName="rounded-2xl border border-diyar-brown/10 shadow-sm"
                className="rounded-2xl"
              />
            ))}
          </div>
        </div>
      </LandingSectionShell>

      <section id="ecosystem" className="scroll-mt-24 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="landing-ecosystem-banner">
            <div className="pointer-events-none absolute inset-0 landing-ecosystem-glow" aria-hidden />

            <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
              <div className="text-start">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  <Store size={16} className="text-diyar-cream" aria-hidden />
                  <span className="text-sm font-bold text-diyar-cream">{messages.ecosystem.badge}</span>
                </div>
                <h2 className="mb-4 text-3xl font-bold leading-tight text-white md:text-4xl">
                  {messages.ecosystem.titleLine1}{' '}
                  <span className="landing-gradient-text">{messages.ecosystem.titleHighlight}</span>
                </h2>
                <p className="max-w-xl text-base leading-relaxed text-white/70 md:text-lg">
                  {messages.ecosystem.body}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {messages.ecosystem.cards.map((card, index) => {
                  const Icon = ECOSYSTEM_ICONS[index] ?? Users;
                  return (
                    <article key={card.title} className="landing-ecosystem-card">
                      <span className="landing-ecosystem-card-icon">
                        <Icon size={24} aria-hidden />
                      </span>
                      <h3 className="mb-2 text-lg font-bold text-white">{card.title}</h3>
                      <p className="text-sm leading-relaxed text-white/65">{card.description}</p>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="relative mt-6 grid gap-6 overflow-hidden rounded-3xl border border-diyar-brown/25 bg-diyar-brown/10 p-6 md:p-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
              <div className="text-start">
                <h3 className="mb-2 text-xl font-bold text-white md:text-2xl">{messages.ecosystem.hubTitle}</h3>
                <p className="text-sm leading-relaxed text-white/70 md:text-base">{messages.ecosystem.hubSubtitle}</p>
              </div>
              <LandingImage
                src={LANDING_ASSETS.panelThree}
                alt=""
                width={480}
                height={320}
                wrapperClassName="rounded-2xl border border-white/10"
                className="rounded-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      <LandingSectionShell id="trust" title={messages.trust.title} tone="gradient">
        <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {messages.trust.items.map((item) => (
            <li key={item} className="landing-trust-card">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-diyar-brown" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </LandingSectionShell>

      <LandingSectionShell id="coming" title={messages.coming.title} tone="cream">
        <div className="landing-coming-card">
          <p className="mb-4 text-lg leading-relaxed text-gray-700 md:text-xl">{messages.coming.body}</p>
          <p className="text-sm text-gray-500">{messages.coming.note}</p>
        </div>
      </LandingSectionShell>

      <LandingSectionShell id="contact" title={messages.cta.title} subtitle={messages.cta.body} tone="contact">
        <div className="grid gap-4 sm:grid-cols-2">
          <a href={mailHref} className="landing-contact-card landing-contact-card-primary">
            <Mail size={22} aria-hidden />
            <span>{messages.cta.email}</span>
          </a>
          <a href={telHref} className="landing-contact-card">
            <Phone size={22} aria-hidden />
            <span>
              {messages.cta.phone}{' '}
              <span className="text-gray-500 font-medium" dir="ltr">
                ({phoneDisplay})
              </span>
            </span>
          </a>
        </div>
      </LandingSectionShell>
    </>
  );
}
