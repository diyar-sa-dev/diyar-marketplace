/** Catalog service-category slug → suggested service type labels (نوع الخدمة). */
export const SERVICE_TYPE_OPTIONS_BY_CATEGORY: Record<string, string[]> = {
  'interior-design': [
    'تصميم سكني',
    'تصميم تجاري',
    'استشارات',
    'مخططات معمارية',
    'استشارة ومخطط',
    'سعر ثابت',
  ],
  maintenance: ['تركيب أثاث', 'صيانة خشبية', 'تنجيد', 'دهانات', 'تركيب وصيانة'],
  painting: ['دهانات داخلية', 'دهانات خارجية', 'تركيب وصيانة'],
  upholstery: ['تنجيد كنب', 'تجديد مجالس', 'التنفيذ بالقطعة'],
  carpentry: ['نجارة مخصصة', 'خشبيات', 'تركيب وصيانة'],
  consultation: ['استشارات', 'استشارة ومخطط', 'تصميم سكني'],
  moving: ['نقل أثاث', 'فك وتركيب', 'خدمة متكاملة'],
  cleaning: ['تنظيف منزلي', 'تلميع', 'تنظيف وتلميع'],
  electrical: ['إضاءة', 'كهرباء', 'تركيب وصيانة'],
  'curtains-install': ['تركيب الستائر', 'تركيب وصيانة'],
  'floor-plan': ['مخططات معمارية', 'استشارة ومخطط'],
  other: ['خدمة مخصصة', 'استشارة'],
};

/** Browse pages use catalog slugs; marketplace services use service_categories slugs. */
export const CATALOG_TO_SERVICE_CATEGORY_SLUG: Record<string, string> = {
  painting: 'maintenance',
  carpentry: 'maintenance',
  consultation: 'interior-design',
  cleaning: 'maintenance',
  electrical: 'maintenance',
  'curtains-install': 'maintenance',
};

export const KNOWN_SERVICE_CATEGORY_SLUGS = new Set([
  'interior-design',
  'maintenance',
  'painting',
  'upholstery',
  'carpentry',
  'consultation',
  'moving',
  'cleaning',
  'electrical',
  'curtains-install',
  'floor-plan',
  'other',
]);

export function resolveServiceCategorySlug(catalogSlug: string): string {
  return CATALOG_TO_SERVICE_CATEGORY_SLUG[catalogSlug] ?? catalogSlug;
}

export function getServiceTypeOptionsForCategory(categorySlug: string | undefined): string[] {
  if (!categorySlug) {
    return [];
  }

  const direct = SERVICE_TYPE_OPTIONS_BY_CATEGORY[categorySlug];
  if (direct?.length) {
    return direct;
  }

  const mapped = CATALOG_TO_SERVICE_CATEGORY_SLUG[categorySlug];
  if (mapped && SERVICE_TYPE_OPTIONS_BY_CATEGORY[mapped]) {
    return SERVICE_TYPE_OPTIONS_BY_CATEGORY[mapped];
  }

  return [];
}

export function mapCatalogSortToServiceSort(
  sort: string,
): 'latest' | 'most_requested' | 'price_asc' | 'price_desc' | 'rating' {
  switch (sort) {
    case 'price':
      return 'price_asc';
    case '-price':
      return 'price_desc';
    case '-popular':
    case '-discount':
      return 'most_requested';
    case 'rating':
      return 'rating';
    default:
      return 'latest';
  }
}
