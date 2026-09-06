import type { LucideIcon } from 'lucide-react';
import {
  ExternalLink,
  FileText,
  FolderGit2,
  Building2,
  FolderTree,
  LayoutDashboard,
  MessageSquare,
  MessageSquareHeart,
  Percent,
  ScrollText,
  BarChart3,
  Users,
  Settings,
  Store,
  Truck,
  Wallet,
  Wrench,
} from 'lucide-react';

export type AdminNavItem = {
  to: string;
  end?: boolean;
  icon: LucideIcon;
  labelKey: string;
  permission?: string;
  permissionAny?: string[];
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
  {
    to: '/admin/shipping',
    icon: Truck,
    labelKey: 'admin.nav.shipping',
    permission: 'shipping.view',
  },
  {
    to: '/admin/payments',
    icon: Wallet,
    labelKey: 'admin.nav.payments',
    permission: 'payments.view',
  },
  {
    to: '/admin/blog/articles',
    icon: FileText,
    labelKey: 'admin.nav.blog',
    permission: 'blog.view',
  },
  {
    to: '/admin/projects',
    icon: FolderGit2,
    labelKey: 'admin.nav.projects',
    permission: 'projects.view',
  },
  {
    to: '/admin/b2b/companies',
    icon: Building2,
    labelKey: 'admin.nav.b2b',
    permission: 'b2b.view',
  },
  { to: '/admin/finance', icon: Wallet, labelKey: 'admin.nav.finance', permission: 'payouts.view' },
  {
    to: '/admin/chat',
    icon: MessageSquare,
    labelKey: 'admin.nav.chat',
    permission: 'chat.view',
  },
  {
    to: '/admin/analytics',
    icon: BarChart3,
    labelKey: 'admin.nav.analytics',
    permissionAny: ['analytics.view', 'search.analytics.view'],
  },
  {
    to: '/admin/affiliate',
    icon: Percent,
    labelKey: 'admin.nav.affiliate',
    permission: 'affiliate.view',
  },
  { to: '/admin/audit', icon: ScrollText, labelKey: 'admin.nav.audit', permission: 'audit.view' },
  {
    to: '/admin/feedback',
    icon: MessageSquareHeart,
    labelKey: 'admin.nav.feedback',
    permission: 'feedback.view',
  },
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
  return items.filter((item) => {
    if (item.permissionAny?.length) {
      return item.permissionAny.some((permission) => hasPermission(permission));
    }

    return !item.permission || hasPermission(item.permission);
  });
}
