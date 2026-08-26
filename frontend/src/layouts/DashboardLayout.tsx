import React, { useEffect, useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { usePortalTheme } from '../lib/dashboard/portalTheme.ts';
import {
  Store,
  Wrench,
  Megaphone,
  Menu,
  Bell,
  LogOut,
  Settings,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Wallet,
  Calendar,
  Link as LinkIcon,
  BarChart,
  ChevronDown,
  MessageSquare,
  MessagesSquare,
  Tag,
  Building2,
} from 'lucide-react';
import { NotificationBellDropdown } from '../components/notifications/NotificationBellDropdown.tsx';
import { ChatMessagesLink } from '../components/chat/ChatMessagesLink.tsx';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher.tsx';
import { UserAvatar } from '../components/profile/UserAvatar.tsx';
import { useAuth } from '../hooks/auth/useAuth.ts';
import { useToast } from '../hooks/useToast.ts';
import { useLocale } from '../hooks/useLocale.ts';
import {
  getAccessibleDashboardPortals,
  getPortalByKey,
  getPortalFromPath,
  hasDashboardAccess,
  isAdminOnlyAccount,
  resolveAccountHubPath,
  resolveChatHubPath,
  type DashboardPortalKey,
} from '../lib/auth/roles.ts';
import { useVendorAccess } from '../hooks/vendor/useVendorTeam.ts';
import { useProviderSettings } from '../hooks/provider/useProviderDashboard.ts';
import { VendorPortalGuard } from '../components/dashboard/vendor/VendorPortalGuard.tsx';
import { skipDashboardTutorial } from '../lib/dashboardTutorialStorage.ts';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, dir } = useLocale();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('skipTutorial') === '1') {
      skipDashboardTutorial();
    }
  }, [location.search]);

  const role = getPortalFromPath(location.pathname);
  const portalTheme = usePortalTheme(role ?? undefined);
  const isVendorPortal = role === 'vendor';
  const isServicePortal = role === 'service';
  const { data: vendorAccess } = useVendorAccess(isVendorPortal);
  const { data: providerSettings } = useProviderSettings(isServicePortal);
  const headerAvatarUrl =
    isServicePortal && providerSettings?.profile.avatar_url
      ? providerSettings.profile.avatar_url
      : user?.avatar_url;
  const headerAvatarName =
    isServicePortal && providerSettings?.profile.specialty
      ? providerSettings.profile.specialty
      : user?.name;
  const accessiblePortals = getAccessibleDashboardPortals(user?.roles);
  const activePortal = role ? getPortalByKey(role) : null;
  const showRoleSwitcher = Boolean(role) && accessiblePortals.length > 1;
  const sidebarHiddenTransform = dir === 'rtl' ? 'translate-x-full' : '-translate-x-full';

  if (isAdminOnlyAccount(user?.roles) || !hasDashboardAccess(user?.roles)) {
    return <Navigate to="/403" replace />;
  }

  const PORTAL_ICONS: Record<DashboardPortalKey, typeof Store> = {
    vendor: Store,
    service: Wrench,
    affiliate: Megaphone,
  };

  const PORTAL_ACTIVE_STYLES: Record<DashboardPortalKey, string> = {
    vendor: 'bg-diyar-brown text-white shadow-md shadow-diyar-brown/20 scale-[1.01]',
    service: 'bg-blue-600 text-white shadow-md shadow-blue-600/20 scale-[1.01]',
    affiliate: 'bg-green-600 text-white shadow-md shadow-green-600/20 scale-[1.01]',
  };

  const PORTAL_ICON_ACTIVE: Record<DashboardPortalKey, string> = {
    vendor: 'text-white',
    service: 'text-white',
    affiliate: 'text-white',
  };

  const NAV_LINKS: Record<
    DashboardPortalKey,
    Array<{ name: string; path: string; icon: typeof LayoutDashboard; permission?: string }>
  > = {
    vendor: [
      {
        name: t('vendor.nav.home'),
        path: '/dashboard/vendor',
        icon: LayoutDashboard,
        permission: 'dashboard',
      },
      {
        name: t('vendor.nav.orders'),
        path: '/dashboard/vendor/orders',
        icon: ShoppingCart,
        permission: 'orders',
      },
      {
        name: t('vendor.nav.returns'),
        path: '/dashboard/vendor/returns',
        icon: Package,
        permission: 'returns',
      },
      {
        name: t('vendor.nav.products'),
        path: '/dashboard/vendor/products',
        icon: Package,
        permission: 'products',
      },
      {
        name: t('vendor.nav.coupons'),
        path: '/dashboard/vendor/coupons',
        icon: Tag,
        permission: 'products',
      },
      {
        name: t('vendor.nav.reviews'),
        path: '/dashboard/vendor/reviews',
        icon: MessageSquare,
        permission: 'reviews',
      },
      {
        name: t('vendor.nav.chat'),
        path: '/dashboard/vendor/messages',
        icon: MessagesSquare,
        permission: 'chat',
      },
      {
        name: t('vendor.nav.team'),
        path: '/dashboard/vendor/team',
        icon: Users,
        permission: 'team',
      },
      {
        name: t('vendor.nav.finance'),
        path: '/dashboard/vendor/finance',
        icon: Wallet,
        permission: 'finance',
      },
      {
        name: t('vendor.nav.analytics'),
        path: '/dashboard/vendor/analytics',
        icon: BarChart,
        permission: 'dashboard',
      },
      {
        name: t('vendor.nav.b2b'),
        path: '/dashboard/vendor/b2b',
        icon: Building2,
      },
      {
        name: t('vendor.nav.settings'),
        path: '/dashboard/vendor/settings',
        icon: Settings,
        permission: 'settings',
      },
    ],
    service: [
      { name: t('providerDashboard.nav.home'), path: '/dashboard/service', icon: LayoutDashboard },
      {
        name: t('providerDashboard.nav.clientRequests'),
        path: '/dashboard/service/client-requests',
        icon: Users,
      },
      {
        name: t('providerDashboard.nav.bookings'),
        path: '/dashboard/service/bookings',
        icon: Calendar,
      },
      {
        name: t('providerDashboard.nav.reviews'),
        path: '/dashboard/service/reviews',
        icon: MessageSquare,
      },
      {
        name: t('providerDashboard.nav.chat'),
        path: '/dashboard/service/messages',
        icon: MessagesSquare,
      },
      {
        name: t('providerDashboard.nav.myServices'),
        path: '/dashboard/service/services',
        icon: Wrench,
      },
      {
        name: t('providerDashboard.nav.finance'),
        path: '/dashboard/service/finance',
        icon: Wallet,
      },
      {
        name: t('providerDashboard.nav.analytics'),
        path: '/dashboard/service/analytics',
        icon: BarChart,
      },
      {
        name: t('providerDashboard.nav.b2b'),
        path: '/dashboard/service/b2b',
        icon: Building2,
      },
      {
        name: t('providerDashboard.nav.settings'),
        path: '/dashboard/service/settings',
        icon: Settings,
      },
    ],
    affiliate: [
      { name: t('affiliate.nav.home'), path: '/dashboard/affiliate', icon: LayoutDashboard },
      { name: t('affiliate.nav.products'), path: '/dashboard/affiliate/products', icon: Package },
      { name: t('affiliate.nav.links'), path: '/dashboard/affiliate/links', icon: LinkIcon },
      { name: t('affiliate.nav.reports'), path: '/dashboard/affiliate/reports', icon: BarChart },
      { name: t('affiliate.nav.payouts'), path: '/dashboard/affiliate/payouts', icon: Wallet },
      { name: t('affiliate.nav.settings'), path: '/dashboard/affiliate/settings', icon: Settings },
    ],
  };

  const links = (role ? NAV_LINKS[role] : []).filter((link) => {
    if (role !== 'vendor' || !link.permission || !vendorAccess?.permissions) {
      return true;
    }

    const value =
      vendorAccess.permissions[link.permission as keyof typeof vendorAccess.permissions];
    return value !== false && value !== 'none';
  });

  return (
    <div className="min-h-screen bg-gray-50 flex" dir={dir}>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed md:sticky top-0 inset-s-0 z-50 h-screen bg-diyar-dark text-white flex flex-col transition-all duration-300 ${
          isSidebarOpen
            ? 'w-64 translate-x-0'
            : `w-64 md:w-20 ${sidebarHiddenTransform} md:translate-x-0`
        }`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
          {isSidebarOpen && (
            <span className="font-bold text-xl text-diyar-cream truncate">
              {t('dashboard.title')}
            </span>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <Menu size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          {!role ? (
            <div className="px-4 text-gray-400 text-sm">{t('dashboard.selectAccountType')}</div>
          ) : (
            <ul className="space-y-1 px-3">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                const portalKey = role ?? 'vendor';
                return (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
                      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                        isActive
                          ? PORTAL_ACTIVE_STYLES[portalKey]
                          : 'text-gray-300 hover:bg-white/8 hover:text-white hover:translate-x-0.5 rtl:hover:-translate-x-0.5'
                      }`}
                      title={link.name}
                    >
                      <Icon
                        size={20}
                        className={`shrink-0 ${isActive ? PORTAL_ICON_ACTIVE[portalKey] : ''}`}
                      />
                      {isSidebarOpen && (
                        <span className="font-medium whitespace-nowrap">{link.name}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="p-4 border-t border-white/10">
          <Link
            to="/"
            className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors cursor-pointer"
            title={t('dashboard.backToStore')}
          >
            <LogOut size={20} className="shrink-0" />
            {isSidebarOpen && (
              <span className="font-medium whitespace-nowrap">{t('dashboard.backToStore')}</span>
            )}
          </Link>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer -ms-2"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg md:text-xl font-bold text-diyar-dark truncate max-w-37.5 md:max-w-none">
              {role ? t(`dashboard.portals.${role}.headerTitle`) : t('dashboard.selectPortal')}
            </h1>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {showRoleSwitcher && (
              <div className="relative group">
                <button className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 rounded-lg border border-gray-200 text-xs md:text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer">
                  <span className="hidden sm:inline">{t('dashboard.switchAccount')}</span>
                  <span className="sm:hidden">{t('dashboard.portal')}</span>
                  <ChevronDown size={14} />
                </button>
                <div className="absolute top-full inset-s-0 mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                  {accessiblePortals.map((portal) => {
                    const Icon = PORTAL_ICONS[portal.key];

                    return (
                      <Link
                        key={portal.key}
                        to={portal.path}
                        className={`flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm transition-colors ${
                          role === portal.key ? 'bg-gray-50 font-bold text-diyar-dark' : ''
                        }`}
                      >
                        <Icon size={16} className={portal.iconTextClass} />{' '}
                        {t(`dashboard.portals.${portal.key}.switchLabel`)}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {(role === 'vendor' || role === 'service') && (
              <ChatMessagesLink
                to={resolveChatHubPath(user?.roles, role)}
                variant="header"
              />
            )}

            <NotificationBellDropdown
              viewAllPath={`/dashboard/${role}/notifications`}
              open={isNotificationsOpen}
              onToggle={() => setIsNotificationsOpen((value) => !value)}
              onClose={() => setIsNotificationsOpen(false)}
            />

            <LanguageSwitcher />

            <Link
              to={resolveAccountHubPath(user?.roles)}
              className={`shrink-0 rounded-full transition-all hover:ring-2 ${portalTheme.avatarRing}`}
              title={t('common.myAccount')}
            >
              <UserAvatar name={headerAvatarName} avatarUrl={headerAvatarUrl} size="sm" />
            </Link>

            <button
              type="button"
              onClick={() =>
                void logout().then((result) => {
                  toast.success(result.message ?? t('auth.toasts.logoutSuccess'));
                  navigate('/');
                })
              }
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 p-2 text-sm font-medium transition hover:bg-gray-50 cursor-pointer md:px-3"
              aria-label={t('common.logout')}
            >
              <LogOut size={16} />
              <span className="hidden md:inline">{t('common.logout')}</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {isVendorPortal ? (
            <VendorPortalGuard>
              <Outlet />
            </VendorPortalGuard>
          ) : (
            <Outlet />
          )}
        </div>
      </main>
    </div>
  );
}
