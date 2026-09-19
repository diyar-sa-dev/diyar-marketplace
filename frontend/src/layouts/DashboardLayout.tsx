import React, { useEffect, useRef, useState } from 'react';
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
  User,
  X,
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
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const dirRef = useRef(dir);
  const sidebarWasOpenRef = useRef(isSidebarOpen);
  const [sidebarMotionOn, setSidebarMotionOn] = useState(true);
  const [navRevealId, setNavRevealId] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsSidebarOpen(true);
        setIsAccountMenuOpen(false);
      }
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('skipTutorial') === '1') {
      skipDashboardTutorial();
    }
  }, [location.search]);

  useEffect(() => {
    setIsAccountMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const justOpened = isSidebarOpen && !sidebarWasOpenRef.current;
    sidebarWasOpenRef.current = isSidebarOpen;
    if (justOpened && window.innerWidth < 768) {
      setNavRevealId((id) => id + 1);
    }
  }, [isSidebarOpen]);

  useEffect(() => {
    if (dirRef.current === dir) {
      return;
    }

    dirRef.current = dir;
    setSidebarMotionOn(false);
    const timer = window.setTimeout(() => setSidebarMotionOn(true), 80);
    return () => window.clearTimeout(timer);
  }, [dir]);

  useEffect(() => {
    if (!isAccountMenuOpen) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [isAccountMenuOpen]);

  const handleLogout = () => {
    setIsAccountMenuOpen(false);
    void logout().then((result) => {
      toast.success(result.message ?? t('auth.toasts.logoutSuccess'));
      navigate('/');
    });
  };

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
  const revealNav = isMobile && isSidebarOpen && navRevealId > 0;

  return (
    <div className="flex h-dvh max-h-dvh overflow-hidden bg-gray-50 text-diyar-dark" dir={dir}>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden
        />
      )}

      <aside
          className={`fixed inset-y-0 z-50 flex h-dvh max-h-dvh shrink-0 flex-col overflow-hidden bg-diyar-dark text-white shadow-xl md:relative md:inset-auto md:h-full md:max-h-full md:translate-x-0 ${
            sidebarMotionOn ? 'transition-[width,transform] duration-300' : ''
          } ${dir === 'rtl' ? 'right-0' : 'left-0'} ${
          isSidebarOpen
            ? 'w-64 translate-x-0'
            : `w-64 md:w-20 ${sidebarHiddenTransform} md:translate-x-0`
        }`}
      >
        <div
          className={`flex h-16 shrink-0 items-center border-b border-white/10 ${
            isSidebarOpen ? 'justify-between gap-2 px-4' : 'justify-center px-0'
          }`}
        >
          {isSidebarOpen ? (
            <span className="flex-1 truncate text-lg font-bold text-diyar-cream md:text-xl">
              {t('dashboard.title')}
            </span>
          ) : null}

          {isMobile && isSidebarOpen ? (
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="shrink-0 rounded-lg p-2 transition-colors hover:bg-white/10 cursor-pointer"
              aria-label={t('common.close')}
            >
              <X size={20} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden size-10 shrink-0 items-center justify-center rounded-xl transition-colors hover:bg-white/10 md:inline-flex cursor-pointer"
              aria-label={isSidebarOpen ? t('common.close') : t('dashboard.openMenu')}
            >
              <Menu size={20} />
            </button>
          )}
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-4">
          {!role ? (
            <div className="px-4 text-sm text-gray-400">{t('dashboard.selectAccountType')}</div>
          ) : (
            <ul className={`space-y-1 ${isSidebarOpen ? 'px-3' : 'flex flex-col items-center px-0'}`}>
              {links.map((link, index) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                const portalKey = role ?? 'vendor';
                return (
                  <li
                    key={`${link.path}-${navRevealId}`}
                    className={revealNav ? 'dashboard-nav-in' : undefined}
                    style={revealNav ? { animationDelay: `${index * 40}ms` } : undefined}
                  >
                    <Link
                      to={link.path}
                      onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
                      className={`group flex items-center transition-all duration-200 cursor-pointer ${
                        isSidebarOpen
                          ? `gap-3 rounded-xl px-3 py-2.5 ${
                              isActive
                                ? PORTAL_ACTIVE_STYLES[portalKey]
                                : 'text-gray-300 hover:bg-white/8 hover:text-white hover:translate-x-0.5 rtl:hover:-translate-x-0.5'
                            }`
                          : `size-10 justify-center rounded-xl ${
                              isActive
                                ? PORTAL_ACTIVE_STYLES[portalKey]
                                : 'text-gray-300 hover:bg-white/8 hover:text-white'
                            }`
                      }`}
                      title={link.name}
                    >
                      <Icon
                        size={20}
                        className={`shrink-0 ${isActive ? PORTAL_ICON_ACTIVE[portalKey] : ''}`}
                      />
                      {isSidebarOpen && (
                        <span className="truncate font-medium whitespace-nowrap">{link.name}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </nav>

        <div
          className={`shrink-0 border-t border-white/10 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-4 ${
            isSidebarOpen ? 'px-4' : 'flex justify-center px-0'
          }`}
        >
          <Link
            to="/"
            className={`flex items-center text-gray-300 transition-colors hover:bg-white/5 hover:text-white cursor-pointer ${
              isSidebarOpen
                ? 'min-h-11 gap-3 rounded-xl px-1 py-2'
                : 'size-10 justify-center rounded-xl'
            } ${revealNav ? 'dashboard-nav-in' : ''}`}
            style={revealNav ? { animationDelay: `${links.length * 40}ms` } : undefined}
            title={t('dashboard.backToStore')}
          >
            <LogOut size={20} className="shrink-0" />
            {isSidebarOpen && (
              <span className="truncate font-medium whitespace-nowrap">{t('dashboard.backToStore')}</span>
            )}
          </Link>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="z-20 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-gray-100 bg-white/95 px-3 backdrop-blur sm:h-16 sm:px-4 md:px-6">
            <div className="flex min-w-0 items-center gap-2 md:gap-4">
              <button
                onClick={() => {
                  setIsAccountMenuOpen(false);
                  setIsNotificationsOpen(false);
                  setIsSidebarOpen(true);
                }}
                className="shrink-0 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 md:hidden cursor-pointer"
                aria-label={t('dashboard.openMenu')}
              >
                <Menu size={20} />
              </button>
              <h1 className="truncate text-base font-bold text-diyar-dark sm:text-lg md:text-xl">
                {role ? t(`dashboard.portals.${role}.headerTitle`) : t('dashboard.selectPortal')}
              </h1>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
              {showRoleSwitcher && (
                <div className="group relative hidden md:block">
                  <button className="flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 px-2 py-1.5 text-xs font-medium transition-colors hover:bg-gray-50 md:gap-2 md:px-3 md:text-sm">
                    <span>{t('dashboard.switchAccount')}</span>
                    <ChevronDown size={14} />
                  </button>
                  <div className="invisible absolute top-full inset-s-0 z-50 mt-1 w-48 overflow-hidden rounded-xl border border-gray-100 bg-white opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
                    {accessiblePortals.map((portal) => {
                      const Icon = PORTAL_ICONS[portal.key];

                      return (
                        <Link
                          key={portal.key}
                          to={portal.path}
                          className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-gray-50 ${
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
                onToggle={() => {
                  setIsAccountMenuOpen(false);
                  setIsNotificationsOpen((value) => !value);
                }}
                onClose={() => setIsNotificationsOpen(false)}
              />

              <div className="hidden md:block">
                <LanguageSwitcher />
              </div>

              <div className="relative" ref={accountMenuRef}>
                <button
                  type="button"
                  className={`cursor-pointer rounded-full transition-all hover:ring-2 md:hidden ${portalTheme.avatarRing}`}
                  aria-label={t('common.myAccount')}
                  aria-expanded={isAccountMenuOpen}
                  aria-haspopup="menu"
                  onClick={() => {
                    setIsNotificationsOpen(false);
                    setIsAccountMenuOpen((open) => !open);
                  }}
                >
                  <UserAvatar name={headerAvatarName} avatarUrl={headerAvatarUrl} size="sm" />
                </button>
                <Link
                  to={resolveAccountHubPath(user?.roles)}
                  className={`hidden shrink-0 cursor-pointer rounded-full transition-all hover:ring-2 md:inline-flex ${portalTheme.avatarRing}`}
                  title={t('common.myAccount')}
                >
                  <UserAvatar name={headerAvatarName} avatarUrl={headerAvatarUrl} size="sm" />
                </Link>
                {isAccountMenuOpen ? (
                  <div
                    role="menu"
                    className="absolute top-full inset-e-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_16px_40px_rgba(19,38,36,0.12)] md:hidden"
                  >
                    <div className="flex items-center gap-3 border-b border-gray-100 px-3.5 py-3">
                      <UserAvatar name={headerAvatarName} avatarUrl={headerAvatarUrl} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-diyar-dark">
                          {headerAvatarName ?? user?.name}
                        </p>
                        {user?.email ? (
                          <p className="truncate text-xs text-gray-500">{user.email}</p>
                        ) : null}
                      </div>
                    </div>
                    {showRoleSwitcher ? (
                      <div className="border-b border-gray-100 p-1">
                        <p className="px-2.5 py-1.5 text-xs font-medium text-gray-400">
                          {t('dashboard.switchAccount')}
                        </p>
                        {accessiblePortals.map((portal) => {
                          const Icon = PORTAL_ICONS[portal.key];

                          return (
                            <Link
                              key={portal.key}
                              role="menuitem"
                              to={portal.path}
                              onClick={() => setIsAccountMenuOpen(false)}
                              className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl px-2.5 text-sm transition-colors hover:bg-gray-50 ${
                                role === portal.key ? 'bg-gray-50 font-semibold text-diyar-dark' : 'text-gray-700'
                              }`}
                            >
                              <Icon size={16} className={portal.iconTextClass} />
                              {t(`dashboard.portals.${portal.key}.switchLabel`)}
                            </Link>
                          );
                        })}
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-3.5 py-2.5">
                      <span className="text-sm text-gray-600">{t('common.language')}</span>
                      <LanguageSwitcher />
                    </div>
                    <div className="p-1">
                      <Link
                        role="menuitem"
                        to={resolveAccountHubPath(user?.roles)}
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl px-2.5 text-sm text-diyar-dark transition-colors hover:bg-gray-50"
                      >
                        <User size={16} className="text-gray-400" />
                        {t('common.myAccount')}
                      </Link>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleLogout}
                        className="flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 text-start text-sm text-red-600 transition-colors hover:bg-red-50"
                      >
                        <LogOut size={16} />
                        {t('common.logout')}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="hidden cursor-pointer items-center gap-2 rounded-lg border border-gray-200 p-2 text-sm font-medium transition hover:bg-gray-50 md:inline-flex md:px-3"
                aria-label={t('common.logout')}
              >
                <LogOut size={16} />
                <span>{t('common.logout')}</span>
              </button>
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 md:p-6">
            {isVendorPortal ? (
              <VendorPortalGuard>
                <Outlet />
              </VendorPortalGuard>
            ) : (
              <Outlet />
            )}
          </main>
      </div>
    </div>
  );
}
