import type { LucideIcon } from 'lucide-react';
import {
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  Package,
  Percent,
  ScrollText,
  Settings,
  ShoppingBag,
  Store,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';

export type AdminNavItem = {
  to: string;
  end?: boolean;
  icon: LucideIcon;
  labelKey: string;
  permission?: string;
};

/** Flat admin sidebar — no section groups. */
export const adminNavItems: AdminNavItem[] = [
  {
    to: '/admin',
    end: true,
    icon: LayoutDashboard,
    labelKey: 'admin.nav.dashboard',
    permission: 'panel.access',
  },
  { to: '/admin/users', icon: Users, labelKey: 'admin.nav.users', permission: 'users.view' },
  { to: '/admin/vendors', icon: Store, labelKey: 'admin.nav.vendors', permission: 'vendors.view' },
  {
    to: '/admin/providers',
    icon: Wrench,
    labelKey: 'admin.nav.providers',
    permission: 'providers.view',
  },
  {
    to: '/admin/categories',
    icon: FolderTree,
    labelKey: 'admin.nav.categories',
    permission: 'categories.view',
  },
  { to: '/admin/orders', icon: ShoppingBag, labelKey: 'admin.nav.orders', permission: 'orders.view' },
  { to: '/admin/products', icon: Package, labelKey: 'admin.nav.products', permission: 'products.view' },
  { to: '/admin/services', icon: Wrench, labelKey: 'admin.nav.services', permission: 'bookings.view' },
  { to: '/admin/finance', icon: Wallet, labelKey: 'admin.nav.finance', permission: 'payouts.view' },
  {
    to: '/admin/affiliate',
    icon: Percent,
    labelKey: 'admin.nav.affiliate',
    permission: 'affiliate.view',
  },
  { to: '/admin/audit', icon: ScrollText, labelKey: 'admin.nav.audit', permission: 'audit.view' },
  {
    to: '/admin/settings',
    icon: Settings,
    labelKey: 'admin.nav.settings',
    permission: 'settings.view',
  },
];

export const adminSidebarFooterItem: AdminNavItem = {
  to: '/',
  icon: ExternalLink,
  labelKey: 'admin.viewStore',
};

export function filterAdminNavItems(
  items: AdminNavItem[],
  hasPermission: (permission: string) => boolean,
): AdminNavItem[] {
  return items.filter((item) => !item.permission || hasPermission(item.permission));
}
