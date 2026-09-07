import type { LandingMessages } from './i18n/types.ts';
import { LANDING_LOCALES, type LandingLocale } from './i18n/types.ts';

const siteUrl = (import.meta.env.VITE_SITE_URL ?? 'https://deyarhome.com').replace(/\/$/, '');

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

function upsertMeta(property: string, content: string, isName = false) {
  const selector = isName ? `meta[name="${property}"]` : `meta[property="${property}"]`;
  let node = document.querySelector<HTMLMetaElement>(selector);
  if (!node) {
    node = document.createElement('meta');
    if (isName) {
      node.name = property;
    } else {
      node.setAttribute('property', property);
    }
    document.head.appendChild(node);
  }
  node.content = content;
}

export function applyLandingSeo(messages: LandingMessages, localePathKey: string): void {
  if (typeof document === 'undefined') {
    return;
  }

  const canonicalPath = localePathKey === 'ar' ? '/' : `/${localePathKey}`;
  const canonical = `${siteUrl}${canonicalPath === '/' ? '' : canonicalPath}`;
  const ogImage = `${siteUrl}/logo_diyar.svg`;

  document.title = messages.meta.title;

  upsertMeta('description', messages.meta.description, true);
  upsertMeta('og:title', messages.meta.title);
  upsertMeta('og:description', messages.meta.description);
  upsertMeta('og:locale', messages.meta.ogLocale);
  upsertMeta('og:url', canonical);
  upsertMeta('og:image', ogImage);
  upsertMeta('twitter:title', messages.meta.title, true);
  upsertMeta('twitter:description', messages.meta.description, true);
  upsertMeta('twitter:image', ogImage, true);

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
