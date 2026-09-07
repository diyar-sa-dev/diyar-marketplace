import { useEffect, useId, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { DiyarBrandMark } from '../../components/common/DiyarBrandMark.tsx';
import { LANDING_ASSETS, LANDING_NAV_ITEMS, type LandingNavKey } from '../constants.ts';
import { useLandingLocale } from '../hooks/useLandingLocale.ts';
import { landingLocaleHref } from '../landingSeo.ts';
import { LANDING_LOCALES, type LandingLocale } from '../i18n/types.ts';
import { getPlatformSupportMailHref } from '../../lib/platformContact.ts';

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
      className={`sticky top-0 z-50 transition-[box-shadow,background-color,border-color] duration-300 ${
        scrolled
          ? 'border-b border-diyar-brown/15 bg-diyar-cream/95 shadow-[0_10px_30px_rgb(31_61_58_/_0.08)] backdrop-blur-md'
          : 'border-b border-transparent bg-diyar-cream/80 backdrop-blur-sm'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6 md:py-3.5">
        <a
          href="#top"
          className="group flex min-w-0 items-center gap-3 shrink-0 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-diyar-brown"
          aria-label="DIYAR"
        >
          <img src={LANDING_ASSETS.logo} alt="" className="h-8 w-auto transition-transform group-hover:scale-[1.02]" />
          <span className="hidden sm:inline">
            <DiyarBrandMark size="sm" />
          </span>
        </a>

        <nav
          className="hidden lg:flex items-center gap-0.5 text-sm font-semibold text-diyar-dark/80"
          aria-label="Primary"
        >
          {LANDING_NAV_ITEMS.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className="rounded-xl px-3 py-2 transition-colors hover:bg-white/75 hover:text-diyar-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-diyar-brown cursor-pointer"
            >
              {navLabel(item.key)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div
            className="hidden sm:flex items-center gap-1 rounded-xl border border-diyar-brown/15 bg-white/80 p-1 shadow-sm"
            role="group"
            aria-label={messages.language.label}
            dir="ltr"
          >
            {LANDING_LOCALES.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => switchLocale(code)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-diyar-brown ${
                  locale === code
                    ? 'bg-diyar-dark text-diyar-cream shadow-sm'
                    : 'text-diyar-dark/70 hover:bg-diyar-cream'
                }`}
                aria-pressed={locale === code}
              >
                {messages.language[code]}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-diyar-brown/15 bg-white/90 text-diyar-dark shadow-sm transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-diyar-brown cursor-pointer"
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
        <div
          id={menuId}
          className="lg:hidden border-t border-diyar-brown/10 bg-diyar-cream/98 px-4 py-4 shadow-inner"
          dir={dir}
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {LANDING_NAV_ITEMS.map((item) => (
              <a
                key={item.key}
                href={item.href}
                className="rounded-xl px-3 py-3 text-sm font-bold text-diyar-dark transition-colors hover:bg-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-diyar-brown cursor-pointer"
                onClick={() => setMenuOpen(false)}
              >
                {navLabel(item.key)}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex flex-wrap gap-2" dir="ltr">
            {LANDING_LOCALES.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => switchLocale(code)}
                className={`rounded-xl px-3 py-2 text-xs font-bold cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-diyar-brown ${
                  locale === code ? 'bg-diyar-dark text-diyar-cream' : 'bg-white text-diyar-dark'
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
  const { locale, messages } = useLandingLocale();
  const year = new Date().getFullYear();
  const mailHref = getPlatformSupportMailHref();

  return (
    <footer className="border-t border-diyar-brown/15 bg-diyar-dark text-white">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)]">
          <div className="max-w-md">
            <img src={LANDING_ASSETS.logo} alt="" className="mb-4 h-8 brightness-0 invert" />
            <p className="text-sm leading-relaxed text-white/75 md:text-base">{messages.footer.tagline}</p>
          </div>

          <nav className="flex flex-col gap-2 text-sm font-semibold text-white/80" aria-label="Footer">
            <p className="mb-1 text-xs uppercase tracking-[0.18em] text-white/45">{messages.nav.about}</p>
            {LANDING_NAV_ITEMS.slice(0, 5).map((item) => (
              <a
                key={item.key}
                href={item.href}
                className="rounded-lg py-1 transition-colors hover:text-diyar-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-diyar-cream cursor-pointer"
              >
                {messages.nav[item.key]}
              </a>
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
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-diyar-cream cursor-pointer ${
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
