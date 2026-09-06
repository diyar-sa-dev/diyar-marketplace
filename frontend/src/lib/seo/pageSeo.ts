export type PageSeoOptions = {
  title: string;
  description?: string;
  image?: string;
  canonicalPath?: string;
  noindex?: boolean;
};

export const DEFAULT_SEO = {
  title: 'ديار — سوق الأثاث والخدمات | DIYAR Marketplace',
  description:
    'ديار — منصة الأثاث والخدمات في المملكة. تسوق الأثاث، احجز خدمات التصميم والتركيب، واكتشف متاجر موثوقة.',
  image: '/logo_diyar.svg',
} as const;

function upsertNamedMeta(name: string, content: string | undefined, fallback?: string) {
  const selector = `meta[name="${name}"]`;
  const resolved = content?.trim() || fallback;
  if (!resolved) {
    return;
  }

  let node = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!node) {
    node = document.createElement('meta');
    node.name = name;
    document.head.appendChild(node);
  }

  node.content = resolved;
}

function upsertPropertyMeta(property: string, content: string | undefined, fallback?: string) {
  const selector = `meta[property="${property}"]`;
  const resolved = content?.trim() || fallback;
  if (!resolved) {
    return;
  }

  let node = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!node) {
    node = document.createElement('meta');
    node.setAttribute('property', property);
    document.head.appendChild(node);
  }

  node.content = resolved;
}

function upsertCanonical(href: string | undefined) {
  const selector = 'link[rel="canonical"]';
  if (!href) {
    document.head.querySelector(selector)?.remove();
    return;
  }

  let node = document.head.querySelector(selector) as HTMLLinkElement | null;
  if (!node) {
    node = document.createElement('link');
    node.rel = 'canonical';
    document.head.appendChild(node);
  }

  node.href = href;
}

export function applyPageSeo(options: PageSeoOptions): void {
  document.title = options.title;

  upsertNamedMeta('description', options.description, DEFAULT_SEO.description);
  upsertPropertyMeta('og:title', options.title, DEFAULT_SEO.title);
  upsertPropertyMeta('og:description', options.description, DEFAULT_SEO.description);
  upsertNamedMeta('twitter:title', options.title, DEFAULT_SEO.title);
  upsertNamedMeta('twitter:description', options.description, DEFAULT_SEO.description);

  const image = options.image ?? DEFAULT_SEO.image;
  upsertPropertyMeta('og:image', image);
  upsertNamedMeta('twitter:image', image);

  const robots = options.noindex ? 'noindex,nofollow' : 'index,follow';
  upsertNamedMeta('robots', robots);

  const canonical = options.canonicalPath
    ? new URL(options.canonicalPath, window.location.origin).toString()
    : undefined;
  upsertCanonical(canonical);
}

export function resetPageSeo(): void {
  applyPageSeo({
    title: DEFAULT_SEO.title,
    description: DEFAULT_SEO.description,
    image: DEFAULT_SEO.image,
  });
  upsertCanonical(undefined);
}
