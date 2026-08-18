import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher.tsx';
import { UserAvatar } from '../components/profile/UserAvatar.tsx';
import { useAuth } from '../hooks/auth/useAuth.ts';
import { useToast } from '../hooks/useToast.ts';
import { useLocale } from '../hooks/useLocale.ts';
import {
  getAccessibleDashboardPortals,
  getPortalByKey,
  getPortalFromPath,
  resolveAccountHubPath,
  type DashboardPortalKey,
} from '../lib/auth/roles.ts';
import { useVendorAccess } from '../hooks/vendor/useVendorTeam.ts';
import { VendorPortalGuard } from '../components/dashboard/vendor/VendorPortalGuard.tsx';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, dir } = useLocale();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const location = useLocation();

  const role = getPortalFromPath(location.pathname);
  const isVendorPortal = role === 'vendor';
  const { data: vendorAccess } = useVendorAccess(isVendorPortal);
  const accessiblePortals = getAccessibleDashboardPortals(user?.roles);
  const activePortal = role ? getPortalByKey(role) : null;
  const showRoleSwitcher = Boolean(role) && accessiblePortals.length > 1;
  const sidebarHiddenTransform = dir === 'rtl' ? 'translate-x-full' : '-translate-x-full';

  const PORTAL_ICONS: Record<DashboardPortalKey, typeof Store> = {
    vendor: Store,
    service: Wrench,
    affiliate: Megaphone,
  };

  const NAV_LINKS: Record<
    DashboardPortalKey,
    Array<{ name: string; path: string; icon: typeof LayoutDashboard; permission?: string }>
  > = {
    vendor: [
      { name: t('vendor.nav.home'), path: '/dashboard/vendor', icon: LayoutDashboard, permission: 'dashboard' },
      { name: t('vendor.nav.orders'), path: '/dashboard/vendor/orders', icon: ShoppingCart, permission: 'orders' },
      { name: t('vendor.nav.returns'), path: '/dashboard/vendor/returns', icon: Package, permission: 'returns' },
      { name: t('vendor.nav.products'), path: '/dashboard/vendor/products', icon: Package, permission: 'products' },
      { name: t('vendor.nav.reviews'), path: '/dashboard/vendor/reviews', icon: MessageSquare, permission: 'reviews' },
      { name: t('vendor.nav.chat'), path: '/dashboard/vendor/messages', icon: MessagesSquare, permission: 'chat' },
      { name: t('vendor.nav.team'), path: '/dashboard/vendor/team', icon: Users, permission: 'team' },
      { name: t('vendor.nav.finance'), path: '/dashboard/vendor/finance', icon: Wallet, permission: 'finance' },
      { name: t('vendor.nav.settings'), path: '/dashboard/vendor/settings', icon: Settings, permission: 'settings' },
    ],
    service: [
      { name: 'الرئيسية', path: '/dashboard/service', icon: LayoutDashboard },
      { name: 'طلبات العملاء', path: '/dashboard/service/client-requests', icon: Users },
      { name: 'الحجوزات', path: '/dashboard/service/bookings', icon: Calendar },
      { name: 'خدماتي', path: '/dashboard/service/services', icon: Wrench },
      { name: 'المالية', path: '/dashboard/service/finance', icon: Wallet },
      { name: 'الإعدادات', path: '/dashboard/service/settings', icon: Settings },
    ],
    affiliate: [
      { name: 'الرئيسية', path: '/dashboard/affiliate', icon: LayoutDashboard },
      { name: 'المنتجات المتاحة', path: '/dashboard/affiliate/products', icon: Package },
      { name: 'روابطي', path: '/dashboard/affiliate/links', icon: LinkIcon },
      { name: 'التقارير', path: '/dashboard/affiliate/reports', icon: BarChart },
      { name: 'سحب الأرباح', path: '/dashboard/affiliate/payouts', icon: Wallet },
      { name: 'الإعدادات', path: '/dashboard/affiliate/settings', icon: Settings },
    ],
  };

  const links = (role ? NAV_LINKS[role] : []).filter((link) => {
    if (role !== 'vendor' || !link.permission || !vendorAccess?.permissions) {
      return true;
    }

    const value = vendorAccess.permissions[link.permission as keyof typeof vendorAccess.permissions];
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
                return (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
                      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-diyar-brown text-white shadow-md shadow-diyar-brown/20 scale-[1.01]'
                          : 'text-gray-300 hover:bg-white/8 hover:text-white hover:translate-x-0.5 rtl:hover:-translate-x-0.5'
                      }`}
                      title={link.name}
                    >
                      <Icon size={20} className="shrink-0" />
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

            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 text-gray-500 hover:text-diyar-dark transition-colors"
                aria-label={t('common.notifications')}
              >
                <Bell size={20} />
                <span className="absolute top-1 inset-e-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </button>

              {isNotificationsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsNotificationsOpen(false)}
                  />
                  <div className="absolute top-full inset-e-0 mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-bold text-diyar-dark">{t('common.notifications')}</h3>
                      <button className="text-xs text-diyar-brown hover:underline font-medium">
                        {t('dashboard.markAllRead')}
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer flex gap-3 ${i === 1 ? 'bg-amber-50/30' : ''}`}
                        >
                          <div
                            className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center ${i === 1 ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}
                          >
                            {i === 1 ? <ShoppingCart size={18} /> : <Megaphone size={18} />}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-diyar-dark mb-1">
                              {i === 1 ? 'طلب جديد #1024' : 'إشعار تحديث من النظام'}
                            </h4>
                            <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                              {i === 1
                                ? 'تم استلام طلب جديد بقيمة 1,250 ر.س. يرجى تجهيز الطلب بأسرع وقت.'
                                : 'تم تحديث سياسات التسعير، يرجى مراجعة الشروط والأحكام الجديدة.'}
                            </p>
                            <span className="text-[10px] text-gray-400">منذ ساعتين</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t border-gray-100 bg-gray-50">
                      <Link
                        to={`/dashboard/${role}/notifications`}
                        onClick={() => setIsNotificationsOpen(false)}
                        className="block w-full text-center py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-diyar-dark hover:bg-gray-50 hover:border-diyar-brown transition"
                      >
                        {t('dashboard.viewAllNotifications')}
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>

            <LanguageSwitcher />

            <Link
              to={resolveAccountHubPath(user?.roles)}
              className="shrink-0 rounded-full transition-all hover:ring-2 hover:ring-diyar-brown/30"
              title={t('common.myAccount')}
            >
              <UserAvatar name={user?.name} avatarUrl={user?.avatar_url} size="sm" />
            </Link>

            <button
              type="button"
              onClick={() =>
                void logout().then((result) => {
                  toast.success(result.message ?? t('auth.toasts.logoutSuccess'));
                  navigate('/');
                })
              }
              className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <LogOut size={16} />
              {t('common.logout')}
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
