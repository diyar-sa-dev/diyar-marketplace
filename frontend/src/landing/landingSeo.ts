import type { LandingMessages } from './i18n/types.ts';
import { LANDING_LOCALES, type LandingLocale } from './i18n/types.ts';

const siteUrl = (import.meta.env.VITE_SITE_URL ?? 'https://diyar.com').replace(/\/$/, '');

function localePath(locale: LandingLocale): string {
  return locale === 'ar' ? '/' : `/${locale}`;
}

function upsertLink(rel: string, href: string, hreflang?: string) {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let node = document.querySelector<HTMLLinkElement>(selector);
  if (!node) {
    node = document.createElement('link');
    node.rel = rel;
    if (hreflang) {
      node.hreflang = hreflang;
    }
    document.head.appendChild(node);
  }
  node.href = href;
}

export function applyLandingSeo(messages: LandingMessages, localePathKey: string): void {
  if (typeof document === 'undefined') {
    return;
  }

  const canonicalPath = localePathKey === 'ar' ? '/' : `/${localePathKey}`;
  const canonical = `${siteUrl}${canonicalPath === '/' ? '' : canonicalPath}`;

  document.title = messages.meta.title;

  const setMeta = (selector: string, content: string) => {
    const node = document.querySelector<HTMLMetaElement>(selector);
    if (node) {
      node.content = content;
    }
  };

  setMeta('meta[name="description"]', messages.meta.description);
  setMeta('meta[property="og:title"]', messages.meta.title);
  setMeta('meta[property="og:description"]', messages.meta.description);
  setMeta('meta[property="og:locale"]', messages.meta.ogLocale);
  setMeta('meta[name="twitter:title"]', messages.meta.title);
  setMeta('meta[name="twitter:description"]', messages.meta.description);

  upsertLink('canonical', canonical);

  LANDING_LOCALES.forEach((locale) => {
    upsertLink('alternate', `${siteUrl}${localePath(locale)}`, locale);
  });
  upsertLink('alternate', `${siteUrl}/`, 'x-default');
}

export function landingLocaleHref(locale: string): string {
  return locale === 'ar' ? '/' : `/${locale}`;
}

export { siteUrl };
