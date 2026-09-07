import {
  BadgeCheck,
  CalendarCheck,
  Compass,
  GitCompare,
  Globe2,
  LayoutGrid,
  Layers3,
  Mail,
  MapPin,
  Phone,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  UserCheck,
  Users,
  Wrench,
  Zap,
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
const TRUST_ICONS: LucideIcon[] = [Layers3, Search, CalendarCheck, MapPin, Zap];

const STEP_ICONS: LucideIcon[] = [Search, GitCompare, UserCheck, CalendarCheck, BadgeCheck];

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="grid gap-3">
      {steps.map((step, index) => {
        const Icon = STEP_ICONS[index] ?? BadgeCheck;
        return (
          <li key={step} className="landing-step-item group">
            <span className="landing-step-index">{index + 1}</span>
            <Icon size={16} className="shrink-0 text-diyar-cream/80 transition-transform group-hover:scale-110" aria-hidden />
            <span>{step}</span>
          </li>
        );
      })}
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
      <LandingSectionShell id="about" title={messages.intro.title} icon={Sparkles} tone="light">
        <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="landing-intro-copy">
            <p className="text-lg leading-relaxed text-gray-700 md:text-xl">{messages.intro.body}</p>
          </div>
          <div className="landing-intro-visual">
            <LandingImage
              src={LANDING_ASSETS.laptop}
              alt=""
              width={720}
              height={480}
              wrapperClassName="rounded-3xl border border-diyar-brown/10 shadow-xl"
              className="rounded-3xl"
            />
          </div>
        </div>
      </LandingSectionShell>

      <LandingSectionShell id="how" title={messages.how.title} icon={Layers3} tone="how" className="landing-section-how">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="landing-flow-panel landing-flow-panel-gradient">
            <h3 className="landing-flow-title">
              <Users size={18} className="text-diyar-cream" aria-hidden />
              {messages.how.customersTitle}
            </h3>
            <StepList steps={messages.how.customerSteps} />
          </div>
          <div className="landing-flow-panel landing-flow-panel-gradient-alt">
            <h3 className="landing-flow-title">
              <Wrench size={18} className="text-diyar-cream" aria-hidden />
              {messages.how.providersTitle}
            </h3>
            <StepList steps={messages.how.providerSteps} />
          </div>
        </div>
      </LandingSectionShell>

      <LandingSectionShell
        id="customers"
        title={messages.customers.title}
        subtitle={messages.customers.subtitle}
        icon={UserCheck}
        tone="cream"
      >
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
          <div className="landing-float-visual">
            <LandingImage
              src={LANDING_ASSETS.appMockup}
              alt=""
              width={640}
              height={720}
              wrapperClassName="rounded-3xl border border-diyar-brown/10 shadow-lg"
              className="rounded-3xl"
            />
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {messages.customers.items.map((item, index) => {
              const Icon = CUSTOMER_ICONS[index] ?? BadgeCheck;
              return (
                <li key={item.title} className="landing-feature-card group">
                  <span className="landing-feature-icon">
                    <Icon size={20} className="transition-transform group-hover:scale-110" aria-hidden />
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
        icon={Store}
      >
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center">
          <ul className="grid gap-4 sm:grid-cols-2">
            {messages.providers.items.map((item, index) => {
              const Icon = PROVIDER_ICONS[index] ?? Store;
              return (
                <li key={item.title} className="landing-feature-card group">
                  <span className="landing-feature-icon landing-feature-icon-alt">
                    <Icon size={20} className="transition-transform group-hover:scale-110" aria-hidden />
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
            {LANDING_ASSETS.categories.map((src, index) => (
              <div key={src} className={`landing-category-tile landing-stagger-item-${index + 1}`}>
                <LandingImage
                  src={src}
                  alt=""
                  width={320}
                  height={240}
                  wrapperClassName="rounded-2xl border border-diyar-brown/10 shadow-sm"
                  className="rounded-2xl"
                />
              </div>
            ))}
          </div>
        </div>
      </LandingSectionShell>

      <section id="ecosystem" className="scroll-mt-24 py-16 md:py-24 landing-section">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="landing-ecosystem-banner landing-reveal">
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
                    <article key={card.title} className="landing-ecosystem-card group">
                      <span className="landing-ecosystem-card-icon">
                        <Icon size={24} className="transition-transform group-hover:scale-110" aria-hidden />
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
                <div className="mb-3 inline-flex items-center gap-2 text-diyar-cream">
                  <CalendarCheck size={20} aria-hidden />
                  <span className="text-sm font-bold uppercase tracking-wide">{messages.ecosystem.hubTitle}</span>
                </div>
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

      <LandingSectionShell id="trust" title={messages.trust.title} icon={ShieldCheck} tone="gradient">
        <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {messages.trust.items.map((item, index) => {
            const Icon = TRUST_ICONS[index] ?? ShieldCheck;
            return (
              <li key={item} className="landing-trust-card group">
                <span className="landing-trust-icon">
                  <Icon size={18} className="transition-transform group-hover:scale-110" aria-hidden />
                </span>
                <span>{item}</span>
              </li>
            );
          })}
        </ul>
      </LandingSectionShell>

      <LandingSectionShell id="coming" title={messages.coming.title} icon={Rocket} tone="cream">
        <div className="landing-coming-card group">
          <Rocket size={28} className="mb-4 text-diyar-brown transition-transform group-hover:-translate-y-1" aria-hidden />
          <p className="mb-4 text-lg leading-relaxed text-gray-700 md:text-xl">{messages.coming.body}</p>
          <p className="text-sm text-gray-500">{messages.coming.note}</p>
        </div>
      </LandingSectionShell>

      <LandingSectionShell id="contact" title={messages.cta.title} subtitle={messages.cta.body} icon={Globe2} tone="contact">
        <div className="grid gap-4 sm:grid-cols-2">
          <a href={mailHref} className="landing-contact-card landing-contact-card-primary group">
            <Mail size={22} className="transition-transform group-hover:scale-110" aria-hidden />
            <span>{messages.cta.email}</span>
          </a>
          <a href={telHref} className="landing-contact-card group">
            <Phone size={22} className="transition-transform group-hover:scale-110" aria-hidden />
            <span>
              {messages.cta.phone}{' '}
              <span className="font-medium text-gray-500" dir="ltr">
                ({phoneDisplay})
              </span>
            </span>
          </a>
        </div>
      </LandingSectionShell>
    </>
  );
}
