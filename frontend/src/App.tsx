/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
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
import { FilterModal } from './components/modals/FilterModal.tsx';
import { CartSidebar } from './components/modals/CartSidebar.tsx';
import { ImageSearchModal } from './components/modals/ImageSearchModal.tsx';
import { RequestServiceModal } from './components/modals/RequestServiceModal.tsx';
import { SidebarMenu } from './components/layout/SidebarMenu.tsx';
import { AnnouncementBar } from './components/layout/AnnouncementBar.tsx';
import { FloatingContactBar } from './components/layout/FloatingContactBar.tsx';
import { NotificationBellDropdown } from './components/notifications/NotificationBellDropdown.tsx';
import { ChatMessagesLink } from './components/chat/ChatMessagesLink.tsx';
import { UserAvatar } from './components/profile/UserAvatar.tsx';
import { useCart } from './hooks/cart/useCart.ts';
import { useAuth } from './hooks/auth/useAuth.ts';
import { useToast } from './hooks/useToast.ts';
import { useLocale } from './hooks/useLocale.ts';
import { ProtectedRoute } from './components/routes/ProtectedRoute.tsx';
import { CustomerProfileRoute } from './components/routes/CustomerProfileRoute.tsx';
import { GuestRoute } from './components/routes/GuestRoute.tsx';
import { AccountStatusRoute } from './components/routes/AccountStatusRoute.tsx';
import { AccountStatusGuard } from './components/routes/AccountStatusGuard.tsx';
import { MarketplaceCommerceRoute } from './components/routing/MarketplaceCommerceRoute.tsx';
import {
  RoleName,
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
import HomePage from './pages/HomePage.tsx';
import CategoryPage from './pages/CategoryPage.tsx';
import ProductDetailsPage from './pages/ProductDetailsPage.tsx';
import CheckoutPage from './pages/CheckoutPage.tsx';
import OrderPaymentPage from './pages/OrderPaymentPage.tsx';
import LocalPaymentSimulatorPage from './pages/LocalPaymentSimulatorPage.tsx';
import OrdersPage from './pages/OrdersPage.tsx';
import LoyaltyPage from './pages/LoyaltyPage.tsx';
import SearchPage from './pages/SearchPage.tsx';
import BlogArticlePage from './pages/BlogArticlePage.tsx';
import ProfilePage from './pages/ProfilePage.tsx';
import ServiceRequestsPage from './pages/ServiceRequestsPage.tsx';
import ServiceBookingsPage from './pages/ServiceBookingsPage.tsx';
import WishlistPage from './pages/WishlistPage.tsx';
import ReviewsPage from './pages/ReviewsPage.tsx';
import CustomerReviewDetailPage from './pages/CustomerReviewDetailPage.tsx';
import PersonalInfoPage from './pages/PersonalInfoPage.tsx';
import AddressesPage from './pages/AddressesPage.tsx';

import SecurityPage from './pages/SecurityPage.tsx';
import PasswordResetPage from './pages/PasswordResetPage.tsx';

import NotificationsPage from './pages/NotificationsPage.tsx';
import NotificationSettingsPage from './pages/NotificationSettingsPage.tsx';
import LanguagePage from './pages/LanguagePage.tsx';
import AuthPage from './pages/AuthPage.tsx';
import StorePage from './pages/StorePage.tsx';
import ProviderPage from './pages/ProviderPage.tsx';
import B2BPage from './pages/B2BPage.tsx';
import B2BCompanyPage from './pages/B2BCompanyPage.tsx';
import ServicePage from './pages/ServicePage.tsx';
import ServicesPage from './pages/ServicesPage.tsx';

import AIDesignerPage from './pages/AIDesignerPage.tsx';
import ChatPage from './pages/ChatPage.tsx';

import DashboardLayout from './layouts/DashboardLayout.tsx';
import DashboardIndex from './pages/dashboard/DashboardIndex.tsx';
import VendorDashboardEntry from './pages/dashboard/VendorDashboardEntry.tsx';
import VendorOrdersPage from './pages/dashboard/vendor/VendorOrdersPage.tsx';
import VendorPreordersPage from './pages/dashboard/vendor/VendorPreordersPage.tsx';
import VendorReturnsPage from './pages/dashboard/vendor/VendorReturnsPage.tsx';
import VendorProducts from './pages/dashboard/VendorProducts.tsx';
import ServiceClientRequests from './pages/dashboard/ServiceClientRequests.tsx';
import ServiceClientRequestDetails from './pages/dashboard/ServiceClientRequestDetails.tsx';
import VendorTeam from './pages/dashboard/VendorTeam.tsx';
import VendorReviewsInbox from './pages/dashboard/VendorReviewsInbox.tsx';
import VendorMessages from './pages/dashboard/VendorMessages.tsx';
import VendorFinance from './pages/dashboard/VendorFinance.tsx';
import VendorCoupons from './pages/dashboard/VendorCoupons.tsx';
import VendorSettings from './pages/dashboard/VendorSettings.tsx';
import ServiceDashboard from './pages/dashboard/ServiceDashboard.tsx';
import ServiceBookings from './pages/dashboard/ServiceBookings.tsx';
import ServiceReviewsInbox from './pages/dashboard/ServiceReviewsInbox.tsx';
import ServiceServices from './pages/dashboard/ServiceServices.tsx';
import ServiceFinance from './pages/dashboard/ServiceFinance.tsx';
import ServiceSettings from './pages/dashboard/ServiceSettings.tsx';
import ProviderMessages from './pages/dashboard/ProviderMessages.tsx';
import AffiliateDashboard from './pages/dashboard/AffiliateDashboard.tsx';
import AffiliateProducts from './pages/dashboard/AffiliateProducts.tsx';
import AffiliateLinks from './pages/dashboard/AffiliateLinks.tsx';
import AffiliateReports from './pages/dashboard/AffiliateReports.tsx';
import AffiliatePayouts from './pages/dashboard/AffiliatePayouts.tsx';
import AffiliateSettings from './pages/dashboard/AffiliateSettings.tsx';
import ForbiddenPage from './pages/errors/ForbiddenPage.tsx';
import NotFoundPage from './pages/errors/NotFoundPage.tsx';
import TeamInvitePage from './pages/TeamInvitePage.tsx';
import PendingAccountPage from './pages/account/PendingAccountPage.tsx';
import SuspendedAccountPage from './pages/account/SuspendedAccountPage.tsx';
import Notifications from './pages/dashboard/Notifications.tsx';
import { AdminGuestRoute } from './admin/components/AdminGuestRoute.tsx';
import { ProtectedAdminRoute } from './admin/components/ProtectedAdminRoute.tsx';
import AdminLayout from './admin/layouts/AdminLayout.tsx';
import { AdminPageSkeleton } from './admin/components/AdminPageSkeleton.tsx';
import AdminLoginPage from './admin/pages/AdminLoginPage.tsx';

const AdminDashboardPage = lazy(() => import('./admin/pages/AdminDashboardPage.tsx'));
const AdminUsersPage = lazy(() => import('./admin/pages/AdminUsersPage.tsx'));
const AdminUserDetailPage = lazy(() => import('./admin/pages/AdminUserDetailPage.tsx'));
const AdminVendorsPage = lazy(() => import('./admin/pages/AdminVendorsPage.tsx'));
const AdminVendorDetailPage = lazy(() => import('./admin/pages/AdminVendorDetailPage.tsx'));
const AdminProvidersPage = lazy(() => import('./admin/pages/AdminProvidersPage.tsx'));
const AdminProviderDetailPage = lazy(() => import('./admin/pages/AdminProviderDetailPage.tsx'));
const AdminCategoriesPage = lazy(() => import('./admin/pages/AdminCategoriesPage.tsx'));
const AdminOrdersPage = lazy(() => import('./admin/pages/AdminOrdersPage.tsx'));
const AdminOrderDetailPage = lazy(() => import('./admin/pages/AdminOrderDetailPage.tsx'));
const AdminProductsPage = lazy(() => import('./admin/pages/AdminProductsPage.tsx'));
const AdminFinancePage = lazy(() => import('./admin/pages/AdminFinancePage.tsx'));
const AdminAffiliateHubPage = lazy(() => import('./admin/pages/AdminAffiliateHubPage.tsx'));
const AdminAuditPage = lazy(() => import('./admin/pages/AdminAuditPage.tsx'));
const AdminSettingsPage = lazy(() => import('./admin/pages/AdminSettingsPage.tsx'));
const AdminPaymentsPage = lazy(() => import('./admin/pages/AdminPaymentsPage.tsx'));
const AdminRefundsPage = lazy(() => import('./admin/pages/AdminRefundsPage.tsx'));
const AdminCouponsPage = lazy(() => import('./admin/pages/AdminCouponsPage.tsx'));
const AdminReviewsPage = lazy(() => import('./admin/pages/AdminReviewsPage.tsx'));
const AdminProductDetailPage = lazy(() => import('./admin/pages/AdminProductDetailPage.tsx'));
const AdminRefundDetailPage = lazy(() => import('./admin/pages/AdminRefundDetailPage.tsx'));
const AdminPaymentDetailPage = lazy(() => import('./admin/pages/AdminPaymentDetailPage.tsx'));
const AdminCouponDetailPage = lazy(() => import('./admin/pages/AdminCouponDetailPage.tsx'));
const AdminOperationsHubPage = lazy(() => import('./admin/pages/AdminOperationsHubPage.tsx'));
const AdminServicesHubPage = lazy(() => import('./admin/pages/AdminServicesHubPage.tsx'));
const AdminRolesPage = lazy(() => import('./admin/pages/AdminRolesPage.tsx'));

function AdminRouteFallback() {
  return <AdminPageSkeleton />;
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

export default function App() {
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
  const isAdminPage = location.pathname.startsWith('/admin');
  const { count: cartCount } = useCart({ enabled: !isAdminPage });
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
    toast.success(result.message ?? 'تم تسجيل الخروج بنجاح.');
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
  const hideMarketplaceChrome = isAuthPage || isAdminPage || isDashboardPage || isStatusPage;

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
                  <button
                    type="submit"
                    className="text-diyar-dark hover:text-diyar-dark/80 transition shrink-0 cursor-pointer"
                  >
                    <Search className="w-5 h-5 shrink-0" />
                  </button>
                  <input
                    type="text"
                    placeholder={t('layout.nav.searchPlaceholder')}
                    className="bg-transparent border-none outline-none w-full text-diyar-dark placeholder:text-gray-400 text-sm h-7"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setIsImageSearchOpen(true)}
                    className="text-gray-400 hover:text-diyar-dark transition shrink-0 ml-1 cursor-pointer"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
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
                    {isAuthenticated && <ChatMessagesLink to={chatHubPath} variant="header" />}
                    {isAuthenticated ? (
                      <NotificationBellDropdown
                        viewAllPath={notificationsHubPath}
                        open={isNotificationsOpen}
                        onToggle={() => setIsNotificationsOpen((open) => !open)}
                        onClose={() => setIsNotificationsOpen(false)}
                        variant="header"
                      />
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

      {!hideMarketplaceChrome && (
        <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
      )}
      {!hideMarketplaceChrome && (
        <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      )}
      {!hideMarketplaceChrome && (
        <SidebarMenu isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      )}
      {!hideMarketplaceChrome && (
        <ImageSearchModal isOpen={isImageSearchOpen} onClose={() => setIsImageSearchOpen(false)} />
      )}
      {!hideMarketplaceChrome && (
        <RequestServiceModal
          isOpen={isRequestServiceOpen}
          onClose={() => setIsRequestServiceOpen(false)}
        />
      )}

      <AccountStatusGuard>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/team-invite"
            element={
              <ProtectedRoute>
                <TeamInvitePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/login"
            element={
              <AdminGuestRoute>
                <AdminLoginPage />
              </AdminGuestRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <AdminLayout />
              </ProtectedAdminRoute>
            }
          >
            <Route
              index
              element={
                <Suspense fallback={<AdminRouteFallback />}>
                  <AdminDashboardPage />
                </Suspense>
              }
            />
            <Route
              path="users"
              element={
                <Suspense fallback={<AdminRouteFallback />}>
                  <AdminUsersPage />
                </Suspense>
              }
            />
            <Route
              path="users/:userId"
              element={
                <Suspense fallback={<AdminRouteFallback />}>
                  <AdminUserDetailPage />
                </Suspense>
              }
            />
            <Route
              path="vendors"
              element={
                <Suspense fallback={<AdminRouteFallback />}>
                  <AdminVendorsPage />
                </Suspense>
              }
            />
            <Route
              path="vendors/:vendorId"
              element={
                <Suspense fallback={<AdminRouteFallback />}>
                  <AdminVendorDetailPage />
                </Suspense>
              }
            />
            <Route path="providers" element={<Suspense fallback={<AdminRouteFallback />}><AdminProvidersPage /></Suspense>} />
            <Route path="providers/:providerId" element={<Suspense fallback={<AdminRouteFallback />}><AdminProviderDetailPage /></Suspense>} />
            <Route path="affiliate" element={<Suspense fallback={<AdminRouteFallback />}><AdminAffiliateHubPage /></Suspense>} />
            <Route path="products" element={<Suspense fallback={<AdminRouteFallback />}><AdminProductsPage /></Suspense>} />
            <Route path="products/:productId" element={<Suspense fallback={<AdminRouteFallback />}><AdminProductDetailPage /></Suspense>} />
            <Route path="categories" element={<Suspense fallback={<AdminRouteFallback />}><AdminCategoriesPage /></Suspense>} />
            <Route path="orders" element={<Suspense fallback={<AdminRouteFallback />}><AdminOrdersPage /></Suspense>} />
            <Route path="orders/:orderId" element={<Suspense fallback={<AdminRouteFallback />}><AdminOrderDetailPage /></Suspense>} />
            <Route path="payments" element={<Suspense fallback={<AdminRouteFallback />}><AdminPaymentsPage /></Suspense>} />
            <Route path="payments/:paymentId" element={<Suspense fallback={<AdminRouteFallback />}><AdminPaymentDetailPage /></Suspense>} />
            <Route path="refunds" element={<Suspense fallback={<AdminRouteFallback />}><AdminRefundsPage /></Suspense>} />
            <Route path="refunds/:refundId" element={<Suspense fallback={<AdminRouteFallback />}><AdminRefundDetailPage /></Suspense>} />
            <Route path="coupons" element={<Suspense fallback={<AdminRouteFallback />}><AdminCouponsPage /></Suspense>} />
            <Route path="coupons/:couponId" element={<Suspense fallback={<AdminRouteFallback />}><AdminCouponDetailPage /></Suspense>} />
            <Route path="reviews" element={<Suspense fallback={<AdminRouteFallback />}><AdminReviewsPage /></Suspense>} />
            <Route path="operations" element={<Suspense fallback={<AdminRouteFallback />}><AdminOperationsHubPage /></Suspense>} />
            <Route path="services" element={<Suspense fallback={<AdminRouteFallback />}><AdminServicesHubPage /></Suspense>} />
            <Route path="roles" element={<Suspense fallback={<AdminRouteFallback />}><AdminRolesPage /></Suspense>} />
            <Route path="finance" element={<Suspense fallback={<AdminRouteFallback />}><AdminFinancePage /></Suspense>} />
            <Route path="payouts" element={<Navigate to="/admin/finance" replace />} />
            <Route path="transactions" element={<Navigate to="/admin/finance" replace />} />
            <Route path="audit" element={<Suspense fallback={<AdminRouteFallback />}><AdminAuditPage /></Suspense>} />
            <Route path="settings" element={<Suspense fallback={<AdminRouteFallback />}><AdminSettingsPage /></Suspense>} />
          </Route>
          <Route
            path="/auth"
            element={
              <GuestRoute>
                <AuthPage />
              </GuestRoute>
            }
          />
          <Route
            path="/account/pending"
            element={
              <AccountStatusRoute allowed="pending">
                <PendingAccountPage />
              </AccountStatusRoute>
            }
          />
          <Route
            path="/account/suspended"
            element={
              <AccountStatusRoute allowed="suspended">
                <SuspendedAccountPage />
              </AccountStatusRoute>
            }
          />
          <Route path="/category/:id" element={<CategoryPage />} />
          <Route path="/store/:id" element={<StorePage />} />
          <Route path="/provider/:id" element={<ProviderPage />} />
          <Route path="/b2b" element={<B2BPage />} />
          <Route path="/b2b/:id" element={<B2BCompanyPage />} />
          <Route path="/ai-designer" element={<AIDesignerPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/service/:id" element={<ServicePage />} />
          <Route path="/product/:id" element={<ProductDetailsPage />} />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <MarketplaceCommerceRoute>
                  <CheckoutPage />
                </MarketplaceCommerceRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout/payment/:orderId/simulate"
            element={
              <ProtectedRoute>
                <MarketplaceCommerceRoute>
                  <LocalPaymentSimulatorPage />
                </MarketplaceCommerceRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout/payment/:orderId"
            element={
              <ProtectedRoute>
                <MarketplaceCommerceRoute>
                  <OrderPaymentPage />
                </MarketplaceCommerceRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <CustomerProfileRoute>
                <OrdersPage />
              </CustomerProfileRoute>
            }
          />
          <Route path="/loyalty" element={<LoyaltyPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/blog/:id" element={<BlogArticlePage />} />
          <Route
            path="/profile"
            element={
              <CustomerProfileRoute>
                <ProfilePage />
              </CustomerProfileRoute>
            }
          />
          <Route
            path="/profile/service-bookings"
            element={
              <CustomerProfileRoute>
                <ServiceBookingsPage />
              </CustomerProfileRoute>
            }
          />
          <Route
            path="/profile/service-requests"
            element={
              <CustomerProfileRoute>
                <ServiceRequestsPage />
              </CustomerProfileRoute>
            }
          />
          <Route
            path="/profile/security/reset-password"
            element={
              <ProtectedRoute>
                <PasswordResetPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/security"
            element={
              <ProtectedRoute>
                <SecurityPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/personal-info"
            element={
              <CustomerProfileRoute>
                <PersonalInfoPage />
              </CustomerProfileRoute>
            }
          />
          <Route
            path="/profile/addresses"
            element={
              <CustomerProfileRoute>
                <AddressesPage />
              </CustomerProfileRoute>
            }
          />
          <Route
            path="/profile/reviews"
            element={
              <CustomerProfileRoute>
                <ReviewsPage />
              </CustomerProfileRoute>
            }
          />
          <Route
            path="/profile/reviews/:type/:id"
            element={
              <CustomerProfileRoute>
                <CustomerReviewDetailPage />
              </CustomerProfileRoute>
            }
          />
          <Route
            path="/profile/notifications"
            element={
              <CustomerProfileRoute>
                <NotificationsPage />
              </CustomerProfileRoute>
            }
          />
          <Route
            path="/profile/notification-settings"
            element={
              <CustomerProfileRoute>
                <NotificationSettingsPage />
              </CustomerProfileRoute>
            }
          />
          <Route
            path="/profile/language"
            element={
              <CustomerProfileRoute>
                <LanguagePage />
              </CustomerProfileRoute>
            }
          />
          <Route
            path="/wishlist"
            element={
              <CustomerProfileRoute>
                <WishlistPage />
              </CustomerProfileRoute>
            }
          />

          <Route path="/403" element={<ForbiddenPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardIndex />} />

            <Route path="vendor" element={<VendorDashboardEntry />} />
            <Route
              path="vendor/orders"
              element={
                <ProtectedRoute roles={[RoleName.Vendor]}>
                  <VendorOrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="vendor/preorders"
              element={
                <ProtectedRoute roles={[RoleName.Vendor]}>
                  <VendorPreordersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="vendor/returns"
              element={
                <ProtectedRoute roles={[RoleName.Vendor]}>
                  <VendorReturnsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="vendor/products"
              element={
                <ProtectedRoute roles={[RoleName.Vendor]}>
                  <VendorProducts />
                </ProtectedRoute>
              }
            />
            <Route
              path="vendor/coupons"
              element={
                <ProtectedRoute roles={[RoleName.Vendor]}>
                  <VendorCoupons />
                </ProtectedRoute>
              }
            />
            <Route
              path="vendor/reviews"
              element={
                <ProtectedRoute roles={[RoleName.Vendor]}>
                  <VendorReviewsInbox />
                </ProtectedRoute>
              }
            />
            <Route
              path="vendor/messages"
              element={
                <ProtectedRoute roles={[RoleName.Vendor]}>
                  <VendorMessages />
                </ProtectedRoute>
              }
            />
            <Route
              path="vendor/team"
              element={
                <ProtectedRoute roles={[RoleName.Vendor]}>
                  <VendorTeam />
                </ProtectedRoute>
              }
            />
            <Route
              path="vendor/finance"
              element={
                <ProtectedRoute roles={[RoleName.Vendor]}>
                  <VendorFinance />
                </ProtectedRoute>
              }
            />
            <Route
              path="vendor/settings"
              element={
                <ProtectedRoute roles={[RoleName.Vendor]}>
                  <VendorSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="vendor/notifications"
              element={
                <ProtectedRoute roles={[RoleName.Vendor]}>
                  <Notifications />
                </ProtectedRoute>
              }
            />

            <Route
              path="service"
              element={
                <ProtectedRoute roles={[RoleName.Provider]}>
                  <ServiceDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="service/client-requests"
              element={
                <ProtectedRoute roles={[RoleName.Provider]}>
                  <ServiceClientRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="service/client-requests/:id"
              element={
                <ProtectedRoute roles={[RoleName.Provider]}>
                  <ServiceClientRequestDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="service/bookings"
              element={
                <ProtectedRoute roles={[RoleName.Provider]}>
                  <ServiceBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="service/services"
              element={
                <ProtectedRoute roles={[RoleName.Provider]}>
                  <ServiceServices />
                </ProtectedRoute>
              }
            />
            <Route
              path="service/finance"
              element={
                <ProtectedRoute roles={[RoleName.Provider]}>
                  <ServiceFinance />
                </ProtectedRoute>
              }
            />
            <Route
              path="service/reviews"
              element={
                <ProtectedRoute roles={[RoleName.Provider]}>
                  <ServiceReviewsInbox />
                </ProtectedRoute>
              }
            />
            <Route
              path="service/messages"
              element={
                <ProtectedRoute roles={[RoleName.Provider]}>
                  <ProviderMessages />
                </ProtectedRoute>
              }
            />
            <Route
              path="service/settings"
              element={
                <ProtectedRoute roles={[RoleName.Provider]}>
                  <ServiceSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="service/notifications"
              element={
                <ProtectedRoute roles={[RoleName.Provider]}>
                  <Notifications />
                </ProtectedRoute>
              }
            />

            <Route
              path="affiliate"
              element={
                <ProtectedRoute roles={[RoleName.Marketer]}>
                  <AffiliateDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="affiliate/products"
              element={
                <ProtectedRoute roles={[RoleName.Marketer]}>
                  <AffiliateProducts />
                </ProtectedRoute>
              }
            />
            <Route
              path="affiliate/links"
              element={
                <ProtectedRoute roles={[RoleName.Marketer]}>
                  <AffiliateLinks />
                </ProtectedRoute>
              }
            />
            <Route
              path="affiliate/reports"
              element={
                <ProtectedRoute roles={[RoleName.Marketer]}>
                  <AffiliateReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="affiliate/payouts"
              element={
                <ProtectedRoute roles={[RoleName.Marketer]}>
                  <AffiliatePayouts />
                </ProtectedRoute>
              }
            />
            <Route
              path="affiliate/settings"
              element={
                <ProtectedRoute roles={[RoleName.Marketer]}>
                  <AffiliateSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="affiliate/notifications"
              element={
                <ProtectedRoute roles={[RoleName.Marketer]}>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
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
