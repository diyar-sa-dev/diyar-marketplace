/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { Suspense, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Bookmark,
  User,
  Search,
  Menu,
  SlidersHorizontal,
  Home as HomeIcon,
  Grid,
  Camera,
  LogOut,
  Bell,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { Footer } from './components/layout/Footer.tsx';
import { AnnouncementBar } from './components/layout/AnnouncementBar.tsx';
import { FloatingContactBar } from './components/layout/FloatingContactBar.tsx';
import { UserAvatar } from './components/profile/UserAvatar.tsx';
import { SearchAutocomplete } from './components/search/SearchAutocomplete.tsx';
import StorefrontRoutes from './marketplace/StorefrontRoutes.tsx';
import {
  CartSidebar,
  ChatMessagesLink,
  FilterModal,
  ImageSearchModal,
  NotificationBellDropdown,
  RequestServiceModal,
  SidebarMenu,
} from './marketplace/lazyPages.ts';
import { useCart } from './hooks/cart/useCart.ts';
import { useAuth } from './hooks/auth/useAuth.ts';
import { useToast } from './hooks/useToast.ts';
import { useLocale } from './hooks/useLocale.ts';
import { AccountStatusGuard } from './components/routes/AccountStatusGuard.tsx';
import { MarketplaceMaintenanceGate } from './components/routing/MarketplaceMaintenanceGate.tsx';
import {
  ADMIN_PANEL_PATH,
  isAccountHubPath,
  resolveAccountHubPath,
  resolveChatHubPath,
  resolveDashboardEntryPath,
  resolveNotificationsHubPath,
  shouldShowAdminPanelLink,
  shouldShowStorefrontDashboardLink,
} from './lib/auth/roles.ts';
import { shouldHideMarketplaceCommerce } from './lib/marketplaceCommerce.ts';

function HeaderWidgetFallback() {
  return <span className="inline-block w-8 h-8" aria-hidden />;
}

function MobileBottomNav({
  onOpenCart,
  isLoggedIn,
  accountHubHref,
  accountHubIsExternal,
  isAccountActive,
}: {
  onOpenCart: () => void;
  isLoggedIn: boolean;
  accountHubHref: string;
  accountHubIsExternal: boolean;
  isAccountActive: boolean;
}) {
  const location = useLocation();
  const { count } = useCart();
  const { t } = useLocale();
  const isHome = location.pathname === '/';
  const isCategory = location.pathname.startsWith('/category');

  if (['/auth', '/dashboard'].some((path) => location.pathname.startsWith(path))) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white flex justify-around items-center h-17.5 z-50 px-2 pb-safe shadow-[0_-5px_15px_rgba(0,0,0,0.08)]">
      <Link
        to="/"
        className={`flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition ${isHome ? 'text-diyar-dark' : 'text-gray-400 hover:text-diyar-dark'}`}
      >
        <HomeIcon size={22} className="mb-1" />
        <span className="text-[11px] font-bold">{t('layout.nav.home')}</span>
      </Link>
      <Link
        to="/category/all"
        className={`flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition ${isCategory ? 'text-diyar-dark' : 'text-gray-400 hover:text-diyar-dark'}`}
      >
        <Grid size={22} className="mb-1" />
        <span className="text-[11px] font-medium">{t('layout.nav.categories')}</span>
      </Link>
      <div
        className="flex flex-col items-center justify-center flex-1 h-full text-gray-400 hover:text-diyar-dark cursor-pointer transition"
        onClick={onOpenCart}
      >
        <div className="relative">
          <ShoppingCart size={22} className="mb-1" />
          {count > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-diyar-dark text-diyar-cream text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {count}
            </span>
          )}
        </div>
        <span className="text-[11px] font-medium">{t('layout.nav.cart')}</span>
      </div>
      <Link
        to="/wishlist"
        className={`flex flex-col items-center justify-center flex-1 h-full text-gray-400 hover:text-diyar-dark cursor-pointer transition ${location.pathname === '/wishlist' ? 'text-diyar-dark' : ''}`}
      >
        <Bookmark size={22} className="mb-1" />
        <span className="text-[11px] font-medium">{t('layout.nav.wishlist')}</span>
      </Link>
      {isLoggedIn && accountHubIsExternal ? (
        <a
          href={accountHubHref}
          className={`flex flex-col items-center justify-center flex-1 h-full text-gray-400 hover:text-diyar-dark cursor-pointer transition ${isAccountActive ? 'text-diyar-dark' : ''}`}
        >
          <User size={22} className="mb-1" />
          <span className="text-[11px] font-medium">{t('layout.nav.myAccount')}</span>
        </a>
      ) : (
        <Link
          to={isLoggedIn ? accountHubHref : '/auth'}
          className={`flex flex-col items-center justify-center flex-1 h-full text-gray-400 hover:text-diyar-dark cursor-pointer transition ${isAccountActive ? 'text-diyar-dark' : ''}`}
        >
          <User size={22} className="mb-1" />
          <span className="text-[11px] font-medium">{t('layout.nav.myAccount')}</span>
        </Link>
      )}
    </div>
  );
}

export default function MarketplaceShell() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isImageSearchOpen, setIsImageSearchOpen] = useState(false);
  const [isRequestServiceOpen, setIsRequestServiceOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { count: cartCount } = useCart();
  const { isAuthenticated, logout, isLoading, user } = useAuth();
  const { toast } = useToast();
  const { dir, t } = useLocale();
  const dashboardPath = resolveDashboardEntryPath(user?.roles);
  const accountHubPath = resolveAccountHubPath(user?.roles);
  const accountHubHref = accountHubPath;
  const accountHubIsExternal = false;
  const notificationsHubPath = resolveNotificationsHubPath(user?.roles);
  const isAccountActive = isAccountHubPath(location.pathname, location.search, user?.roles);
  const chatHubPath = resolveChatHubPath(user?.roles);
  const showDashboardLink = shouldShowStorefrontDashboardLink(
    isAuthenticated,
    user?.status,
    user?.roles,
  );
  const hideStoreCommerce = shouldHideMarketplaceCommerce(user?.roles);
  const showAdminPanelLink = shouldShowAdminPanelLink(
    isAuthenticated,
    user?.status,
    user?.roles,
  );

  useEffect(() => {
    // reset scroll to top on every navigation (so pages don't open mid-scroll)
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleLogout = async () => {
    const result = await logout();
    toast.success(result.message ?? 'ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø®Ø±ÙˆØ¬ Ø¨Ù†Ø¬Ø§Ø­.');
    navigate('/');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  useEffect(() => {
    let lastY = window.scrollY;
    const handleScroll = () => {
      const currentY = window.scrollY;
      // ignore tiny scroll jitter
      if (Math.abs(currentY - lastY) < 8) return;
      // show when scrolling up or near the top, hide when scrolling down
      setIsVisible(currentY < lastY || currentY < 80);
      lastY = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isAuthPage = location.pathname.startsWith('/auth');
  const isDashboardPage = location.pathname.startsWith('/dashboard');
  const isAccountStatusPage =
    location.pathname.startsWith('/account/pending') ||
    location.pathname.startsWith('/account/suspended');
  const isStatusPage =
    location.pathname === '/403' || location.pathname === '/404' || isAccountStatusPage;
  const isHomePage = location.pathname === '/';
  const hideMarketplaceChrome = isAuthPage || isDashboardPage || isStatusPage;

  useEffect(() => {
    if (hideMarketplaceChrome) {
      setIsCartOpen(false);
      setIsSidebarOpen(false);
    }
  }, [hideMarketplaceChrome]);

  if (isLoading && !hideMarketplaceChrome) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white" dir={dir}>
        <div className="w-8 h-8 border-2 border-diyar-brown/30 border-t-diyar-brown rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-diyar-dark pb-17.5 md:pb-0" dir={dir}>
      {!hideMarketplaceChrome && <AnnouncementBar />}
      {!hideMarketplaceChrome && (
        <div
          className={`sticky top-0 z-50 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full md:translate-y-[-120%]'} w-full flex justify-center ${isHomePage ? 'h-0 overflow-visible' : ''}`}
        >
          <div
            className={`w-full flex justify-center left-0 right-0 pointer-events-none ${isHomePage ? 'absolute top-0 mt-2 md:mt-4' : 'relative mt-2 md:mt-4 mb-2 md:mb-4'}`}
          >
            <header className="max-w-350 w-full px-3 md:px-4 pointer-events-auto">
              <div className="bg-white/95 backdrop-blur-md rounded-4xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-nowrap items-center justify-between p-2 lg:px-4 lg:py-3 gap-3 w-full">
                {/* Right Group: Menu, Logo, Navigation Links */}
                <div className="flex items-center gap-3 md:gap-6 Order-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsSidebarOpen(true)}
                      className="text-diyar-dark bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-full w-10 h-10 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Menu size={20} />
                    </button>
                    <Link to="/" className="cursor-pointer">
                      <img src="/logo_diyar.svg" alt="DIYAR" className="h-7 md:h-8 mr-2 lg:mr-0" />
                    </Link>
                  </div>

                  {/* Navigation Links - Desktop Only */}
                  <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-[13px] font-medium">
                    <Link
                      to="/"
                      className="text-gray-600 hover:text-diyar-dark px-3 py-2 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      {t('layout.nav.home')}
                    </Link>
                    {showDashboardLink && (
                      <Link
                        to={dashboardPath}
                        className={`text-gray-600 hover:text-diyar-dark px-3 py-2 transition-colors whitespace-nowrap cursor-pointer ${
                          isDashboardPage ? 'text-diyar-dark font-bold' : ''
                        }`}
                      >
                        {t('layout.nav.dashboard')}
                      </Link>
                    )}
                    {showAdminPanelLink && (
                      <Link
                        to={ADMIN_PANEL_PATH}
                        className="text-gray-600 hover:text-diyar-dark px-3 py-2 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        {t('layout.nav.adminPanel')}
                      </Link>
                    )}
                    <Link
                      to="/services"
                      className="text-gray-600 hover:text-diyar-dark px-3 py-2 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      {t('layout.nav.services')}
                    </Link>
                    <Link
                      to="/b2b"
                      className="text-gray-600 hover:text-diyar-dark px-3 py-2 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      {t('layout.nav.b2b')}
                    </Link>
                    <Link
                      to="/ai-designer"
                      className="text-gray-600 hover:text-diyar-dark px-3 py-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                    >
                      {t('layout.nav.personalAssistant')}
                    </Link>
                  </nav>
                </div>

                {/* Middle Group: Search */}
                <form
                  onSubmit={handleSearchSubmit}
                  className="hidden md:flex flex-1 md:max-w-xl bg-white border border-gray-200 rounded-full px-4 py-2 items-center gap-2 md:order-2"
                >
                  <SearchAutocomplete
                    className="flex-1 min-w-0"
                    value={searchQuery}
                    onChange={setSearchQuery}
                    imageSearchDisabled
                    onImageSearchClick={() => setIsImageSearchOpen(true)}
                  />
                  <div
                    className="px-2 flex items-center gap-2 cursor-pointer text-diyar-dark hover:text-diyar-dark/80 transition shrink-0 border-r border-gray-200"
                    onClick={() => setIsFilterOpen(true)}
                  >
                    <SlidersHorizontal className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="text-sm font-medium hidden sm:block">{t('layout.nav.filters')}</span>
                  </div>
                </form>

                {/* Left Group: Profile, Icons, CTA */}
                <div className="flex items-center justify-end gap-2 lg:gap-3 order-2 md:order-3 w-auto">
                  {/* Action Icons */}
                  <div className="flex items-center gap-1.5 lg:gap-2">
                    <Link
                      to="/search"
                      className="md:hidden w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-600 hover:bg-diyar-dark hover:text-diyar-cream hover:border-diyar-dark transition-colors cursor-pointer"
                    >
                      <Search className="w-5 h-5" />
                    </Link>
                    {isAuthenticated ? (
                      accountHubIsExternal ? (
                        <a
                          href={accountHubHref}
                          className="hidden md:flex w-10 h-10 rounded-full border border-gray-100 items-center justify-center overflow-hidden hover:ring-2 hover:ring-diyar-brown/30 transition-all cursor-pointer"
                          title={t('common.myAccount')}
                        >
                          <UserAvatar name={user?.name} avatarUrl={user?.avatar_url} size="sm" />
                        </a>
                      ) : (
                        <Link
                          to={accountHubHref}
                          className="hidden md:flex w-10 h-10 rounded-full border border-gray-100 items-center justify-center overflow-hidden hover:ring-2 hover:ring-diyar-brown/30 transition-all cursor-pointer"
                          title={t('common.myAccount')}
                        >
                          <UserAvatar name={user?.name} avatarUrl={user?.avatar_url} size="sm" />
                        </Link>
                      )
                    ) : (
                      <Link
                        to="/auth"
                        className="hidden md:flex w-10 h-10 rounded-full border border-gray-100 items-center justify-center text-gray-600 hover:bg-diyar-dark hover:text-diyar-cream hover:border-diyar-dark transition-colors cursor-pointer"
                        title={t('common.myAccount')}
                      >
                        <User size={18} />
                      </Link>
                    )}
                    {!hideStoreCommerce ? (
                    <div
                      className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center relative cursor-pointer text-gray-600 hover:bg-diyar-dark hover:text-diyar-cream hover:border-diyar-dark transition-colors"
                      onClick={() => setIsCartOpen(true)}
                    >
                      <ShoppingCart className="w-5 h-5" />
                      {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-diyar-dark text-diyar-cream text-[10px] items-center justify-center border border-white font-bold rounded-full w-4 h-4 flex">
                          {cartCount}
                        </span>
                      )}
                    </div>
                    ) : null}
                    {isAuthenticated ? (
                      <Suspense fallback={<HeaderWidgetFallback />}>
                        <ChatMessagesLink to={chatHubPath} variant="header" />
                      </Suspense>
                    ) : null}
                    {isAuthenticated ? (
                      <Suspense fallback={<HeaderWidgetFallback />}>
                        <NotificationBellDropdown
                          viewAllPath={notificationsHubPath}
                          open={isNotificationsOpen}
                          onToggle={() => setIsNotificationsOpen((open) => !open)}
                          onClose={() => setIsNotificationsOpen(false)}
                          variant="header"
                        />
                      </Suspense>
                    ) : (
                      <Link
                        to="/auth"
                        className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center relative cursor-pointer text-gray-600 hover:bg-diyar-dark hover:text-diyar-cream hover:border-diyar-dark transition-colors"
                        title={t('common.notifications')}
                      >
                        <Bell className="w-5 h-5" />
                      </Link>
                    )}
                  </div>

                  {/* CTA Button */}
                  {!hideStoreCommerce ? (
                  <button
                    onClick={() => setIsRequestServiceOpen(true)}
                    className="hidden md:flex text-sm font-bold bg-diyar-dark text-diyar-cream px-5 py-2.5 rounded-2xl hover:bg-diyar-dark/90 transition-colors items-center gap-2 shrink-0 cursor-pointer"
                  >
                    {t('layout.nav.requestService')}
                  </button>
                  ) : null}
                </div>
              </div>
            </header>
          </div>
        </div>
      )}

      {!hideMarketplaceChrome && isFilterOpen ? (
        <Suspense fallback={null}>
          <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
        </Suspense>
      ) : null}
      {!hideMarketplaceChrome && isCartOpen ? (
        <Suspense fallback={null}>
          <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </Suspense>
      ) : null}
      {!hideMarketplaceChrome && isSidebarOpen ? (
        <Suspense fallback={null}>
          <SidebarMenu isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        </Suspense>
      ) : null}
      {!hideMarketplaceChrome && isImageSearchOpen ? (
        <Suspense fallback={null}>
          <ImageSearchModal
            isOpen={isImageSearchOpen}
            onClose={() => setIsImageSearchOpen(false)}
            disabled
          />
        </Suspense>
      ) : null}
      {!hideMarketplaceChrome && isRequestServiceOpen ? (
        <Suspense fallback={null}>
          <RequestServiceModal
            isOpen={isRequestServiceOpen}
            onClose={() => setIsRequestServiceOpen(false)}
          />
        </Suspense>
      ) : null}

      <AccountStatusGuard>
        <MarketplaceMaintenanceGate>
          <StorefrontRoutes />
        </MarketplaceMaintenanceGate>
      </AccountStatusGuard>

      {!hideMarketplaceChrome && <FloatingContactBar />}
      {!hideMarketplaceChrome && <Footer />}
      {!hideMarketplaceChrome && (
        <MobileBottomNav
          onOpenCart={() => setIsCartOpen(true)}
          isLoggedIn={isAuthenticated}
          accountHubHref={accountHubHref}
          accountHubIsExternal={accountHubIsExternal}
          isAccountActive={isAccountActive}
        />
      )}
    </div>
  );
}
