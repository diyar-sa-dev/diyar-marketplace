import { resolveMediaUrl } from './media.ts';
import { staticAsset } from './media/pictureSources.ts';

/** Product category WebP tiles shipped in /public/categories (keyed by slug). */
export const PRODUCT_CATEGORY_WEBP: Record<string, string> = {
  bedroom: '/categories/غرف النوم.webp',
  'living-room': '/categories/الصالونات.webp',
  kitchen: '/categories/المطابخ.webp',
  dining: '/categories/غرف الطعام.webp',
  office: '/categories/المكاتب.webp',
  decor: '/categories/ديكورات.webp',
  lighting: '/categories/الإضاءة.webp',
  curtains: '/categories/الستائر.webp',
  outdoor: '/categories/أثاث خارجي.webp',
  bathroom: '/categories/الحمامات.webp',
};

/** Service category WebP tiles shipped in /public/categories (keyed by slug). */
export const SERVICE_CATEGORY_WEBP: Record<string, string> = {
  'interior-design': '/categories/تصميم داخلي.webp',
  maintenance: '/categories/تركيب وصيانة.webp',
  painting: '/categories/دهانات.webp',
  upholstery: '/categories/تنجيد وتجديد.webp',
  carpentry: '/categories/نجارة مخصصة.webp',
  consultation: '/categories/استشارات تصميم.webp',
  moving: '/categories/نقل وتغليف.webp',
  cleaning: '/categories/تنظيف وتلميع.webp',
  electrical: '/categories/إضاءة وكهرباء.webp',
  'curtains-install': '/categories/تركيب الستائر.webp',
};

/** @deprecated Use PRODUCT_CATEGORY_WEBP — kept for room/style grids. */
export const CATEGORY_IMAGES: Record<string, string> = PRODUCT_CATEGORY_WEBP;

/** Room-focused categories for the Shop by room grid. */
export const HOME_ROOM_SLUGS = [
  'living-room',
  'bedroom',
  'kitchen',
  'dining',
  'office',
  'outdoor',
] as const;

/** Accent / finish categories for the Shop by style bento grid. */
export const HOME_STYLE_SLUGS = ['decor', 'lighting', 'curtains', 'bathroom', 'kitchen'] as const;

export const PLACEHOLDER_CATEGORY_IMG =
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=60&w=800';

export function staticCategoryWebp(slug: string, type: 'product' | 'service' = 'product'): string | undefined {
  if (type === 'service') {
    return SERVICE_CATEGORY_WEBP[slug] ?? PRODUCT_CATEGORY_WEBP[slug];
  }

  return PRODUCT_CATEGORY_WEBP[slug];
}

/** Uploaded API image wins, then static WebP for known slugs. */
export function resolveCategoryImageUrl(
  slug: string,
  apiImageUrl?: string | null,
  type: 'product' | 'service' = 'product',
): string | undefined {
  const uploaded = resolveMediaUrl(apiImageUrl);
  if (uploaded) {
    return uploaded;
  }

  const staticPath = staticCategoryWebp(slug, type);
  return staticPath ? staticAsset(staticPath) : undefined;
}

export function categoryImageForSlug(slug: string): string {
  return resolveCategoryImageUrl(slug) ?? PLACEHOLDER_CATEGORY_IMG;
}

export function categoryHref(slug: string): string {
  return `/category/${slug}`;
}

const CATEGORY_LABEL_KEYS: Record<string, string> = {
  'living-room': 'home.shopByRoom.rooms.living',
  bedroom: 'home.shopByRoom.rooms.bedroom',
  kitchen: 'home.productCategories.kitchen',
  dining: 'home.shopByRoom.rooms.dining',
  office: 'home.shopByRoom.rooms.office',
  outdoor: 'home.shopByRoom.rooms.outdoor',
  decor: 'home.productCategories.decor',
  lighting: 'home.productCategories.lighting',
  curtains: 'home.productCategories.curtains',
  bathroom: 'home.productCategories.bathroom',
};

export function resolveHomeCategoryLabel(
  slug: string,
  t: (key: string) => string,
  apiName?: string | null,
): string {
  const key = CATEGORY_LABEL_KEYS[slug];
  if (key) {
    return t(key);
  }
  return apiName?.trim() || slug;
}
