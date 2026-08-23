import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Settings } from 'lucide-react';
import { useMemo, useState } from 'react';
import { LocaleSwitcher } from '../../components/common/LocaleSwitcher.tsx';
import { useToast } from '../../hooks/useToast.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { useAdminAuth } from '../auth/AdminAuthContext.tsx';
import { AdminSystemHealthBar } from '../components/AdminSystemHealthBar.tsx';
import {
  adminNavItems,
  adminSidebarFooterItem,
  filterAdminNavItems,
} from '../navigation/adminNav.ts';

export default function AdminLayout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, dir } = useLocale();
  const { logout, hasPermission } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const sidebarHiddenTransform = dir === 'rtl' ? 'translate-x-full' : '-translate-x-full';

  const visibleItems = useMemo(
    () => filterAdminNavItems(adminNavItems, hasPermission),
    [hasPermission],
  );

  const handleLogout = async () => {
    try {
      await logout();
      toast.success(t('admin.logoutSuccess'));
      navigate('/admin/login', { replace: true });
    } catch {
      toast.error(t('admin.settings.saveError'));
    }
  };

  const FooterIcon = adminSidebarFooterItem.icon;

  return (
    <div className="min-h-screen bg-[#f7f4f1] text-diyar-dark" dir={dir}>
      <div className="flex min-h-screen">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
        )}

        <aside
          className={`fixed inset-y-0 z-40 flex h-screen w-64 shrink-0 flex-col overflow-hidden bg-[#1f3d3a] text-white shadow-xl transition-transform duration-300 md:sticky md:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : sidebarHiddenTransform
          } ${dir === 'rtl' ? 'right-0' : 'left-0'}`}
        >
          <AdminSystemHealthBar />
          <div className="shrink-0 border-b border-white/10 px-4 py-5">
            <Link to="/admin" className="flex items-center gap-3">
              <img
                src="/logo_diyar.svg"
                alt="DIYAR"
                className="h-9 w-9 rounded-lg bg-white/10 p-1"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-[#f3ecdb]">
                  {t('admin.identityLabel')}
                </p>
                <p className="truncate text-[11px] font-medium text-white/55">
                  {t('admin.panelTitle')}
                </p>
              </div>
            </Link>
          </div>

          <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-3 space-y-0.5">
            {visibleItems.map(({ to, end, icon: Icon, labelKey }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-[#f3ecdb] text-[#1f3d3a] shadow-sm'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon size={17} />
                <span className="truncate">{t(labelKey as never)}</span>
              </NavLink>
            ))}
          </nav>

          <div className="shrink-0 border-t border-white/10 p-2">
            <Link
              to={adminSidebarFooterItem.to}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-3 text-sm font-bold text-[#f3ecdb] transition hover:bg-white/15"
            >
              <FooterIcon size={18} />
              {t(adminSidebarFooterItem.labelKey as never)}
            </Link>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-gray-100 bg-white/95 px-4 backdrop-blur md:gap-4 md:px-6">
            <button
              type="button"
              className="rounded-lg border border-gray-200 p-2 md:hidden cursor-pointer"
              onClick={() => setSidebarOpen((open) => !open)}
              aria-label={t('admin.toggleSidebar')}
            >
              <Menu size={18} />
            </button>

            <div className="flex min-w-0 flex-1 items-center gap-3">
              <img
                src="/logo_diyar.svg"
                alt=""
                aria-hidden
                className="hidden h-8 w-8 rounded-lg border border-gray-100 p-1 md:block"
              />
              <div className="min-w-0 hidden sm:block">
                <p className="truncate text-sm font-extrabold text-diyar-dark">
                  {t('admin.identityLabel')}
                </p>
                <p className="truncate text-xs text-gray-500">{t('admin.headerSubtitle')}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 md:gap-2">
              <LocaleSwitcher />
              <Link
                to="/admin/settings"
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:border-diyar-brown hover:text-diyar-brown"
                aria-label={t('admin.nav.settings')}
              >
                <Settings size={16} />
              </Link>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                aria-label={t('admin.logout')}
              >
                <LogOut size={16} />
                <span className="hidden md:inline">{t('admin.logout')}</span>
              </button>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 md:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
