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
