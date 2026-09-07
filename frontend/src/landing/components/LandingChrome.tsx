import { useEffect, useId, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { LANDING_ASSETS, LANDING_NAV_ITEMS, type LandingNavKey } from '../constants.ts';
import { useLandingLocale } from '../hooks/useLandingLocale.ts';
import { landingLocaleHref } from '../landingSeo.ts';
import { LANDING_LOCALES, type LandingLocale } from '../i18n/types.ts';
import { getPlatformSupportMailHref } from '../../lib/platformContact.ts';
import { LandingAnchor } from './LandingAnchor.tsx';

export function LandingHeader() {
  const { locale, messages, setLocale, dir } = useLandingLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const menuId = useId();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  const switchLocale = (next: LandingLocale) => {
    setLocale(next);
    navigate(landingLocaleHref(next));
    setMenuOpen(false);
  };

  const navLabel = (key: LandingNavKey) => messages.nav[key];

  return (
    <header
      dir={dir}
      className={`sticky top-0 z-50 transition-[box-shadow,background-color,border-color] duration-300 ${
        scrolled
          ? 'border-b border-diyar-brown/20 bg-white/92 shadow-[0_8px_32px_rgb(31_61_58_/_0.1)] backdrop-blur-lg'
          : 'border-b border-diyar-brown/10 bg-white/75 backdrop-blur-md'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
        <LandingAnchor
          href="#top"
          className="group flex min-w-0 shrink-0 items-center gap-2.5 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-diyar-brown"
          ariaLabel="DIYAR"
        >
          <img src={LANDING_ASSETS.logo} alt="" className="h-9 w-auto transition-transform group-hover:scale-[1.03]" />
          <span className="hidden text-sm font-black tracking-[0.18em] text-diyar-dark sm:inline">DIYAR</span>
        </LandingAnchor>

        <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Primary">
          {LANDING_NAV_ITEMS.map((item) => (
            <LandingAnchor
              key={item.key}
              href={item.href}
              className="rounded-full px-3.5 py-2 text-sm font-bold text-diyar-dark/75 transition-all hover:bg-diyar-cream hover:text-diyar-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-diyar-brown cursor-pointer"
            >
              {navLabel(item.key)}
            </LandingAnchor>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div
            className="hidden items-center gap-0.5 rounded-full border border-diyar-brown/15 bg-diyar-cream/60 p-1 sm:flex"
            role="group"
            aria-label={messages.language.label}
            dir="ltr"
          >
            {LANDING_LOCALES.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => switchLocale(code)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-diyar-brown ${
                  locale === code
                    ? 'bg-diyar-dark text-diyar-cream shadow-sm'
                    : 'text-diyar-dark/70 hover:bg-white'
                }`}
                aria-pressed={locale === code}
              >
                {messages.language[code]}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="xl:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-diyar-brown/15 bg-white text-diyar-dark shadow-sm transition-colors hover:bg-diyar-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-diyar-brown cursor-pointer"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? messages.nav.close : messages.nav.menu}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div id={menuId} className="border-t border-diyar-brown/10 bg-white/98 px-4 py-4 xl:hidden" dir={dir}>
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {LANDING_NAV_ITEMS.map((item) => (
              <LandingAnchor
                key={item.key}
                href={item.href}
                className="rounded-xl px-3 py-3 text-sm font-bold text-diyar-dark transition-colors hover:bg-diyar-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-diyar-brown cursor-pointer"
                onNavigate={() => setMenuOpen(false)}
              >
                {navLabel(item.key)}
              </LandingAnchor>
            ))}
          </nav>
          <div className="mt-4 flex flex-wrap gap-2" dir="ltr">
            {LANDING_LOCALES.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => switchLocale(code)}
                className={`rounded-full px-3 py-2 text-xs font-bold cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-diyar-brown ${
                  locale === code ? 'bg-diyar-dark text-diyar-cream' : 'bg-diyar-cream text-diyar-dark'
                }`}
              >
                {messages.language[code]}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}

export function LandingFooter() {
  const { locale, messages, dir } = useLandingLocale();
  const year = new Date().getFullYear();
  const mailHref = getPlatformSupportMailHref();

  return (
    <footer dir={dir} className="border-t border-diyar-brown/15 bg-diyar-dark text-white">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)]">
          <div className="max-w-md">
            <img src={LANDING_ASSETS.logo} alt="" className="mb-4 h-8 brightness-0 invert" />
            <p className="text-sm leading-relaxed text-white/75 md:text-base">{messages.footer.tagline}</p>
          </div>

          <nav className="flex flex-col gap-2 text-sm font-semibold text-white/80" aria-label="Footer">
            <p className="mb-1 text-xs uppercase tracking-[0.18em] text-white/45">{messages.nav.about}</p>
            {LANDING_NAV_ITEMS.slice(0, 4).map((item) => (
              <LandingAnchor
                key={item.key}
                href={item.href}
                className="rounded-lg py-1 transition-colors hover:text-diyar-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-diyar-cream cursor-pointer"
              >
                {messages.nav[item.key]}
              </LandingAnchor>
            ))}
          </nav>

          <div className="flex flex-col gap-3 text-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-white/45">{messages.footer.contact}</p>
            <a
              href={mailHref}
              className="font-semibold text-white/85 transition-colors hover:text-diyar-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-diyar-cream cursor-pointer"
            >
              {messages.cta.email}
            </a>
            <div className="flex flex-wrap gap-2" dir="ltr">
              {LANDING_LOCALES.map((code) => (
                <Link
                  key={code}
                  to={landingLocaleHref(code)}
                  className={`rounded-full px-2.5 py-1 text-xs font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-diyar-cream cursor-pointer ${
                    locale === code ? 'bg-white/15 text-white' : 'text-white/70 hover:text-white'
                  }`}
                >
                  {messages.language[code]}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-10 border-t border-white/10 pt-6 text-xs text-white/45">
          © {year} DIYAR. {messages.footer.rights}
        </p>
      </div>
    </footer>
  );
}
