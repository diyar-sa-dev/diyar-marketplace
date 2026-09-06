export const marketplaceQueryRoot = ['marketplace'] as const;
export const adminQueryRoot = ['admin'] as const;

export function marketplaceQueryKey(...parts: readonly unknown[]) {
  return [...marketplaceQueryRoot, ...parts] as const;
}

export function adminQueryKey(...parts: readonly unknown[]) {
  return [...adminQueryRoot, ...parts] as const;
}

export function isAdminQueryKey(queryKey: readonly unknown[]): boolean {
  const first = queryKey[0];

  if (first === 'admin') {
    return true;
  }

  return typeof first === 'string' && first.startsWith('admin');
}

const PUBLIC_MARKETPLACE_SECTIONS = new Set([
  'blog',
  'projects',
  'catalog',
  'products',
  'services',
  'vendors',
  'providers',
  'search',
  'health',
]);

/** Public catalog/content queries must survive guest session resets (e.g. /auth/me → 401). */
export function shouldRemoveQueryOnSessionClear(queryKey: readonly unknown[]): boolean {
  if (isAdminQueryKey(queryKey)) {
    return false;
  }

  const root = queryKey[0];

  if (root === 'marketplace') {
    const section = queryKey[1];

    if (typeof section === 'string' && PUBLIC_MARKETPLACE_SECTIONS.has(section)) {
      return false;
    }

    return true;
  }

  if (root === 'cart' || root === 'wishlist' || root === 'chat') {
    return true;
  }

  return false;
}
