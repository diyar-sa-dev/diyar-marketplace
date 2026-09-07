import {
  Check,
  Handshake,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  Users,
  Wrench,
} from 'lucide-react';
import { useLandingLocale } from '../hooks/useLandingLocale.ts';
import { LANDING_ASSETS } from '../constants.ts';
import {
  getPlatformSupportMailHref,
  getPlatformSupportPhoneDisplay,
  getPlatformSupportTelHref,
} from '../../lib/platformContact.ts';
import { LandingImage } from './LandingImage.tsx';
import { LandingSectionShell } from './LandingSectionShell.tsx';

function StepList({ steps, tone = 'light' }: { steps: string[]; tone?: 'light' | 'dark' }) {
  return (
    <ol className="grid gap-3">
      {steps.map((step, index) => (
        <li
          key={step}
          className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 transition-shadow hover:shadow-md ${
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

function ValueCard({ text }: { text: string }) {
  return (
    <li className="landing-value-card">
      <Check size={18} className="mt-0.5 shrink-0 text-diyar-brown" aria-hidden />
      <span>{text}</span>
    </li>
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
        <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <p className="text-lg leading-relaxed text-gray-700 md:text-xl">{messages.intro.body}</p>
          <div className="landing-intro-visual">
            <LandingImage
              src={LANDING_ASSETS.laptop}
              alt=""
              width={720}
              height={480}
              wrapperClassName="rounded-3xl border border-diyar-brown/10 shadow-lg"
              className="rounded-3xl"
            />
          </div>
        </div>
      </LandingSectionShell>

      <LandingSectionShell id="how" title={messages.how.title} tone="cream">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="landing-flow-panel">
            <h3 className="landing-flow-title">
              <Search size={18} className="text-diyar-brown" aria-hidden />
              {messages.how.customersTitle}
            </h3>
            <StepList steps={messages.how.customerSteps} />
          </div>
          <div className="landing-flow-panel">
            <h3 className="landing-flow-title">
              <Wrench size={18} className="text-diyar-brown" aria-hidden />
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
      >
        <ul className="grid gap-4 md:grid-cols-2">
          {messages.customers.items.map((item) => (
            <ValueCard key={item} text={item} />
          ))}
        </ul>
      </LandingSectionShell>

      <LandingSectionShell
        id="providers"
        title={messages.providers.title}
        subtitle={messages.providers.subtitle}
        tone="cream"
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-start">
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
            {messages.providers.items.map((item) => (
              <ValueCard key={item} text={item} />
            ))}
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

      <LandingSectionShell
        id="ecosystem"
        title={messages.ecosystem.title}
        subtitle={messages.ecosystem.subtitle}
        tone="dark"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-3 rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm">
            <p className="mb-2 text-xs uppercase tracking-[0.24em] text-white/60">{messages.ecosystem.hub}</p>
            <p className="text-4xl font-black tracking-wide text-diyar-cream">DIYAR</p>
          </div>
          <div className="landing-eco-card">
            <Users className="mx-auto mb-3 text-diyar-cream" size={26} strokeWidth={1.75} aria-hidden />
            <p className="font-bold">{messages.ecosystem.customers}</p>
          </div>
          <div className="landing-eco-card">
            <Handshake className="mx-auto mb-3 text-diyar-cream" size={26} strokeWidth={1.75} aria-hidden />
            <p className="font-bold">{messages.ecosystem.providers}</p>
          </div>
          <div className="landing-eco-card">
            <Wrench className="mx-auto mb-3 text-diyar-cream" size={26} strokeWidth={1.75} aria-hidden />
            <p className="font-bold">{messages.ecosystem.services}</p>
            <p className="mt-2 text-xs text-white/60">{messages.ecosystem.bookings}</p>
          </div>
        </div>
      </LandingSectionShell>

      <LandingSectionShell id="trust" title={messages.trust.title} tone="gradient">
        <ul className="grid gap-3 md:grid-cols-2">
          {messages.trust.items.map((item) => (
            <li key={item} className="landing-trust-card">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-diyar-brown" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </LandingSectionShell>

      <LandingSectionShell id="coming" title={messages.coming.title} tone="cream">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center">
          <div className="landing-coming-card">
            <p className="mb-4 text-lg leading-relaxed text-gray-700 md:text-xl">{messages.coming.body}</p>
            <p className="text-sm text-gray-500">{messages.coming.note}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <LandingImage
              src={LANDING_ASSETS.panelOne}
              alt=""
              width={400}
              height={300}
              wrapperClassName="rounded-2xl border border-diyar-brown/10 shadow-sm"
              className="rounded-2xl"
            />
            <LandingImage
              src={LANDING_ASSETS.panelTwo}
              alt=""
              width={400}
              height={300}
              wrapperClassName="rounded-2xl border border-diyar-brown/10 shadow-sm"
              className="rounded-2xl"
            />
          </div>
        </div>
      </LandingSectionShell>

      <LandingSectionShell id="contact" title={messages.cta.title} subtitle={messages.cta.body}>
        <div className="flex flex-col gap-4 sm:flex-row">
          <a href={mailHref} className="landing-btn landing-btn-primary gap-2">
            <Mail size={18} aria-hidden />
            {messages.cta.email}
          </a>
          <a href={telHref} className="landing-btn landing-btn-secondary gap-2">
            <Phone size={18} aria-hidden />
            {messages.cta.phone}
            <span className="font-medium text-gray-500" dir="ltr">
              ({phoneDisplay})
            </span>
          </a>
        </div>
      </LandingSectionShell>
    </>
  );
}
