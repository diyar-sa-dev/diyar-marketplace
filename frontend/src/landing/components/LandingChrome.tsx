import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { DiyarBrandMark } from '../../components/common/DiyarBrandMark.tsx';
import { useLandingLocale } from '../hooks/useLandingLocale.ts';
import { landingLocaleHref } from '../landingSeo.ts';
import type { LandingLocale } from '../i18n/types.ts';

const NAV_ITEMS = [
  { key: 'about', href: '#about' },
  { key: 'how', href: '#how' },
  { key: 'customers', href: '#customers' },
  { key: 'providers', href: '#providers' },
  { key: 'ecosystem', href: '#ecosystem' },
  { key: 'coming', href: '#coming' },
  { key: 'contact', href: '#contact' },
] as const;

export function LandingHeader() {
  const { locale, messages, setLocale, dir } = useLandingLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const switchLocale = (next: LandingLocale) => {
    setLocale(next);
    navigate(landingLocaleHref(next));
    setMenuOpen(false);
  };

  const navLabel = (key: (typeof NAV_ITEMS)[number]['key']) => messages.nav[key];

  return (
    <header className="sticky top-0 z-50 border-b border-diyar-brown/10 bg-diyar-cream/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <a href="#top" className="flex items-center gap-3 shrink-0" aria-label="DIYAR">
          <img src="/logo_diyar.svg" alt="" className="h-8 w-auto" />
          <span className="hidden sm:inline">
            <DiyarBrandMark size="sm" />
          </span>
        </a>

        <nav className="hidden lg:flex items-center gap-1 text-sm font-semibold text-diyar-dark/80" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className="rounded-xl px-3 py-2 hover:bg-white/70 hover:text-diyar-brown transition-colors"
            >
              {navLabel(item.key)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div
            className="hidden sm:flex items-center gap-1 rounded-xl border border-diyar-brown/15 bg-white/70 p-1"
            role="group"
            aria-label={messages.language.label}
            dir="ltr"
          >
            {(['ar', 'en', 'fr'] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => switchLocale(code)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                  locale === code
                    ? 'bg-diyar-dark text-diyar-cream'
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
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-diyar-brown/15 bg-white/80 text-diyar-dark cursor-pointer"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? messages.nav.close : messages.nav.menu}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="lg:hidden border-t border-diyar-brown/10 bg-diyar-cream px-4 py-4" dir={dir}>
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.key}
                href={item.href}
                className="rounded-xl px-3 py-3 text-sm font-bold text-diyar-dark hover:bg-white/80"
                onClick={() => setMenuOpen(false)}
              >
                {navLabel(item.key)}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex flex-wrap gap-2" dir="ltr">
            {(['ar', 'en', 'fr'] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => switchLocale(code)}
                className={`rounded-xl px-3 py-2 text-xs font-bold cursor-pointer ${
                  locale === code ? 'bg-diyar-dark text-diyar-cream' : 'bg-white text-diyar-dark'
                }`}
              >
                {messages.language[code]}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

export function LandingFooter() {
  const { messages } = useLandingLocale();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-diyar-brown/10 bg-diyar-dark text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-md">
            <img src="/logo_diyar.svg" alt="" className="mb-4 h-8 brightness-0 invert" />
            <p className="text-sm leading-relaxed text-white/75">{messages.footer.tagline}</p>
          </div>
          <nav className="flex flex-col gap-2 text-sm font-semibold text-white/80" aria-label="Footer">
            {NAV_ITEMS.slice(0, 4).map((item) => (
              <a key={item.key} href={item.href} className="hover:text-diyar-cream transition-colors">
                {messages.nav[item.key]}
              </a>
            ))}
            <Link to={landingLocaleHref('ar')} className="hover:text-diyar-cream transition-colors">
              {messages.language.ar}
            </Link>
          </nav>
        </div>
        <p className="mt-8 border-t border-white/10 pt-6 text-xs text-white/50">
          © {year} DIYAR. {messages.footer.rights}
        </p>
      </div>
    </footer>
  );
}
