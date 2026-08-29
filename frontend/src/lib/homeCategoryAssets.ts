/** Shared product category imagery for homepage sections (room grid, style grid, strip). */
export const CATEGORY_IMAGES: Record<string, string> = {
  bedroom: '/categories/%D8%BA%D8%B1%D9%81%20%D8%A7%D9%84%D9%86%D9%88%D9%85.png',
  'living-room': '/categories/%D8%A7%D9%84%D8%B5%D8%A7%D9%84%D9%88%D9%86%D8%A7%D8%AA.png',
  kitchen: '/categories/%D8%A7%D9%84%D9%85%D8%B7%D8%A7%D8%A8%D8%AE.png',
  dining: '/categories/غرف الطعام.png',
  office: '/categories/%D8%A7%D9%84%D9%85%D9%83%D8%A7%D8%AA%D8%A8.png',
  decor: '/categories/%D8%AF%D9%8A%D9%83%D9%88%D8%B1%D8%A7%D8%AA.png',
  lighting: '/categories/الإضاءة.png',
  curtains: '/categories/الستائر.png',
  outdoor: '/categories/أثاث خارجي.png',
  bathroom: '/categories/الحمامات.png',
};

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

const PLACEHOLDER_CATEGORY_IMG =
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=60&w=800';

export function categoryImageForSlug(slug: string): string {
  return CATEGORY_IMAGES[slug] ?? PLACEHOLDER_CATEGORY_IMG;
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
