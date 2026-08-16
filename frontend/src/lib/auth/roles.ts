export const RoleName = {
  Customer: 'customer',
  Vendor: 'vendor',
  Provider: 'provider',
  Marketer: 'marketer',
  Admin: 'admin',
} as const;

export type RoleNameValue = (typeof RoleName)[keyof typeof RoleName];

/** Registration UI keys accepted by the backend. */
export const RegistrationRoleKey = {
  Customer: 'customer',
  Merchant: 'merchant',
  ServiceProvider: 'service_provider',
  Marketer: 'marketer',
} as const;

export type DashboardPortalKey = 'vendor' | 'service' | 'affiliate';

export type UserRoleLike = {
  name: string;
  status?: string;
};

export type DashboardPortal = {
  key: DashboardPortalKey;
  path: string;
  roleNames: RoleNameValue[];
  title: string;
  shortTitle: string;
  switchLabel: string;
  headerTitle: string;
  description: string;
  hoverBorderClass: string;
  iconBgClass: string;
  iconTextClass: string;
};

export const DASHBOARD_PORTALS: DashboardPortal[] = [
  {
    key: 'vendor',
    path: '/dashboard/vendor',
    roleNames: [RoleName.Vendor],
    title: 'التاجر / المتجر',
    shortTitle: 'تاجر',
    switchLabel: 'تاجر',
    headerTitle: 'بوابة التاجر',
    description: 'إدارة المنتجات، الطلبات، المخزون، وتحليل المبيعات.',
    hoverBorderClass: 'hover:border-diyar-brown/30',
    iconBgClass: 'bg-amber-50',
    iconTextClass: 'text-diyar-brown',
  },
  {
    key: 'service',
    path: '/dashboard/service',
    roleNames: [RoleName.Provider],
    title: 'مقدم خدمة',
    shortTitle: 'مزود خدمة',
    switchLabel: 'مزود خدمة',
    headerTitle: 'بوابة مزود الخدمة',
    description: 'صيانة، تصميم، تركيب، وإدارة مواعيد الحجوزات.',
    hoverBorderClass: 'hover:border-blue-500/30',
    iconBgClass: 'bg-blue-50',
    iconTextClass: 'text-blue-600',
  },
  {
    key: 'affiliate',
    path: '/dashboard/affiliate',
    roleNames: [RoleName.Marketer],
    title: 'مسوق بالعمولة',
    shortTitle: 'مسوق بالعمولة',
    switchLabel: 'مسوق بالعمولة',
    headerTitle: 'بوابة المسوق',
    description: 'تتبع الزيارات، الطلبات المحققة، وطلب سحب الأرباح.',
    hoverBorderClass: 'hover:border-green-500/30',
    iconBgClass: 'bg-green-50',
    iconTextClass: 'text-green-600',
  },
];

const ACTIVE_ROLE_STATUSES = new Set(['active']);

export function hasAnyRole(
  roles: Array<{ name: string }> | undefined,
  expected: string[],
): boolean {
  if (!roles?.length || expected.length === 0) {
    return false;
  }

  return roles.some((role) => expected.includes(role.name));
}

function isActiveDashboardRole(role: UserRoleLike): boolean {
  if (!role.status) {
    return true;
  }

  return ACTIVE_ROLE_STATUSES.has(role.status);
}

export function getAccessibleDashboardPortals(
  roles: UserRoleLike[] | undefined,
): DashboardPortal[] {
  if (!roles?.length) {
    return [];
  }

  if (hasAnyRole(roles, [RoleName.Admin])) {
    return [...DASHBOARD_PORTALS];
  }

  const activeRoleNames = new Set(roles.filter(isActiveDashboardRole).map((role) => role.name));

  return DASHBOARD_PORTALS.filter((portal) =>
    portal.roleNames.some((roleName) => activeRoleNames.has(roleName)),
  );
}

export function hasDashboardAccess(roles: UserRoleLike[] | undefined): boolean {
  return getAccessibleDashboardPortals(roles).length > 0;
}

export function resolveDashboardEntryPath(roles: UserRoleLike[] | undefined): string {
  const portals = getAccessibleDashboardPortals(roles);

  if (portals.length === 0) {
    return '/';
  }

  if (portals.length === 1) {
    return portals[0].path;
  }

  return '/dashboard';
}

/** Default landing route after sign-in / sign-up. */
export function resolvePostAuthPath(roles: UserRoleLike[] | undefined): string {
  if (hasDashboardAccess(roles)) {
    return resolveDashboardEntryPath(roles);
  }

  return '/';
}

export function canAccessPath(roles: UserRoleLike[] | undefined, path: string): boolean {
  if (path.startsWith('/dashboard')) {
    if (!hasDashboardAccess(roles)) {
      return false;
    }

    const portal = getPortalFromPath(path);
    if (portal) {
      return canAccessPortal(roles, portal);
    }

    return path === '/dashboard' || path === '/dashboard/';
  }

  if (
    path.startsWith('/checkout') ||
    path.startsWith('/orders') ||
    path.startsWith('/profile') ||
    path.startsWith('/account/')
  ) {
    return true;
  }

  return true;
}

export function resolveSafeReturnPath(
  from: string | undefined,
  roles: UserRoleLike[] | undefined,
): string {
  if (from && from !== '/auth' && canAccessPath(roles, from)) {
    return from;
  }

  return resolvePostAuthPath(roles);
}

export function primaryDashboardPath(roles: UserRoleLike[] | undefined): string {
  return resolveDashboardEntryPath(roles);
}

export function getPortalFromPath(pathname: string): DashboardPortalKey | null {
  if (pathname.includes('/dashboard/vendor')) return 'vendor';
  if (pathname.includes('/dashboard/service')) return 'service';
  if (pathname.includes('/dashboard/affiliate')) return 'affiliate';
  return null;
}

export function getPortalByKey(key: DashboardPortalKey): DashboardPortal | undefined {
  return DASHBOARD_PORTALS.find((portal) => portal.key === key);
}

export function canAccessPortal(
  roles: UserRoleLike[] | undefined,
  portalKey: DashboardPortalKey,
): boolean {
  return getAccessibleDashboardPortals(roles).some((portal) => portal.key === portalKey);
}

export function roleLabelAr(name: string): string {
  const labels: Record<string, string> = {
    customer: 'عميل',
    vendor: 'تاجر',
    provider: 'مقدم خدمة',
    marketer: 'مسوق',
    admin: 'مدير',
  };

  return labels[name] ?? name;
}
