/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Bookmark, User, Search, Menu, SlidersHorizontal, Home as HomeIcon, Grid, Camera, LogOut } from 'lucide-react';
import { Footer } from './components/Sections.tsx';
import { FilterModal } from './components/FilterModal.tsx';
import { CartSidebar } from './components/CartSidebar.tsx';
import { ImageSearchModal } from './components/ImageSearchModal.tsx';
import { SidebarMenu } from './components/SidebarMenu.tsx';
import { AnnouncementBar } from './components/AnnouncementBar.tsx';
import { FloatingContactBar } from './components/FloatingContactBar.tsx';
import HomePage from './pages/HomePage.tsx';
import CategoryPage from './pages/CategoryPage.tsx';
import ProductDetailsPage from './pages/ProductDetailsPage.tsx';
import CheckoutPage from './pages/CheckoutPage.tsx';
import OrdersPage from './pages/OrdersPage.tsx';
import LoyaltyPage from './pages/LoyaltyPage.tsx';
import SearchPage from './pages/SearchPage.tsx';
import ProfilePage from './pages/ProfilePage.tsx';
import WishlistPage from './pages/WishlistPage.tsx';
import ReviewsPage from './pages/ReviewsPage.tsx';
import PersonalInfoPage from './pages/PersonalInfoPage.tsx';
import AddressesPage from './pages/AddressesPage.tsx';

import SecurityPage from './pages/SecurityPage.tsx';

import NotificationsPage from './pages/NotificationsPage.tsx';
import LanguagePage from './pages/LanguagePage.tsx';
import AuthPage from './pages/AuthPage.tsx';
import StorePage from './pages/StorePage.tsx';
import ProviderPage from './pages/ProviderPage.tsx';
import ServicePage from './pages/ServicePage.tsx';

import DashboardLayout from './layouts/DashboardLayout.tsx';
import DashboardIndex from './pages/dashboard/DashboardIndex.tsx';
import VendorDashboard from './pages/dashboard/VendorDashboard.tsx';
import VendorOrders from './pages/dashboard/VendorOrders.tsx';
import VendorProducts from './pages/dashboard/VendorProducts.tsx';
import VendorTeam from './pages/dashboard/VendorTeam.tsx';
import VendorFinance from './pages/dashboard/VendorFinance.tsx';
import VendorSettings from './pages/dashboard/VendorSettings.tsx';
import ServiceDashboard from './pages/dashboard/ServiceDashboard.tsx';
import ServiceBookings from './pages/dashboard/ServiceBookings.tsx';
import ServiceServices from './pages/dashboard/ServiceServices.tsx';
import ServiceFinance from './pages/dashboard/ServiceFinance.tsx';
import ServiceSettings from './pages/dashboard/ServiceSettings.tsx';
import AffiliateDashboard from './pages/dashboard/AffiliateDashboard.tsx';
import AffiliateProducts from './pages/dashboard/AffiliateProducts.tsx';
import AffiliateLinks from './pages/dashboard/AffiliateLinks.tsx';
import AffiliateReports from './pages/dashboard/AffiliateReports.tsx';
import AffiliatePayouts from './pages/dashboard/AffiliatePayouts.tsx';
import AffiliateSettings from './pages/dashboard/AffiliateSettings.tsx';
import Notifications from './pages/dashboard/Notifications.tsx';
import { assetUrl } from './utils/assetUrl.ts';

function MobileBottomNav({ onOpenCart, isLoggedIn }: { onOpenCart: () => void, isLoggedIn: boolean }) {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isCategory = location.pathname.startsWith('/category');
  
  if (['/auth', '/dashboard'].some(path => location.pathname.startsWith(path))) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white flex justify-around items-center h-[70px] z-50 px-2 pb-safe shadow-[0_-5px_15px_rgba(0,0,0,0.08)]">
      <Link to="/" className={`flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition ${isHome ? 'text-diyar-dark' : 'text-gray-400 hover:text-diyar-brown'}`}>
        <HomeIcon size={22} className="mb-1" />
        <span className="text-[11px] font-bold">الرئيسية</span>
      </Link>
      <Link to="/category/all" className={`flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition ${isCategory ? 'text-diyar-dark' : 'text-gray-400 hover:text-diyar-brown'}`}>
        <Grid size={22} className="mb-1" />
        <span className="text-[11px] font-medium">التصنيفات</span>
      </Link>
      <div 
        className="flex flex-col items-center justify-center flex-1 h-full text-gray-400 hover:text-diyar-brown cursor-pointer transition"
        onClick={onOpenCart}
      >
        <div className="relative">
          <ShoppingCart size={22} className="mb-1" />
          <span className="absolute -top-1.5 -right-2 bg-diyar-dark text-diyar-cream text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">2</span>
        </div>
        <span className="text-[11px] font-medium">السلة</span>
      </div>
      <Link to="/wishlist" className={`flex flex-col items-center justify-center flex-1 h-full text-gray-400 hover:text-diyar-brown cursor-pointer transition ${location.pathname === '/wishlist' ? 'text-diyar-dark' : ''}`}>
        <Bookmark size={22} className="mb-1" />
        <span className="text-[11px] font-medium">المحفوظات</span>
      </Link>
      <Link to={isLoggedIn ? "/profile" : "/auth"} className={`flex flex-col items-center justify-center flex-1 h-full text-gray-400 hover:text-diyar-brown cursor-pointer transition ${location.pathname.startsWith('/profile') ? 'text-diyar-dark' : ''}`}>
        <User size={22} className="mb-1" />
        <span className="text-[11px] font-medium">حسابي</span>
      </Link>
    </div>
  );
}

export default function App() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isImageSearchOpen, setIsImageSearchOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
    navigate('/');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const isAuthPage = location.pathname.startsWith('/auth');
  const isDashboardPage = location.pathname.startsWith('/dashboard');

  return (
    <div className="min-h-screen bg-white font-sans text-diyar-dark pb-[70px] md:pb-0" dir="rtl">
      {!(isAuthPage || isDashboardPage) && <AnnouncementBar />}
      {!(isAuthPage || isDashboardPage) && (
        <header className={`bg-white/95 backdrop-blur-md sticky top-0 z-50 pt-safe transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
          <div className="max-w-7xl mx-auto px-4 py-1.5 md:px-6 md:py-2.5 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 md:gap-5">
            <div className="flex items-center w-full md:w-auto order-1 justify-between md:justify-start gap-4">
              <div className="flex items-center gap-3 md:gap-4">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="text-diyar-dark hover:bg-gray-100 rounded-full p-2 hidden md:flex items-center justify-center transition-colors -mr-2"
                >
                  <Menu size={24} />
                </button>
                <Link to="/">
                  <img src={assetUrl("/logo_diyar.svg")} alt="DIYAR" className="h-7 md:h-9" />
                </Link>
              </div>
              <div className="flex items-center gap-3 md:hidden">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="text-diyar-dark bg-gray-100 hover:bg-gray-200 rounded-full w-9 h-9 flex items-center justify-center transition-colors"
                >
                  <Menu size={20} />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSearchSubmit} className="flex-1 w-full md:w-auto bg-gray-100 rounded-full px-4 py-2 flex items-center gap-2 order-3 md:order-2 md:mx-4">
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
              <input 
                type="text" 
                placeholder="بحث عن أثاث، متاجر، خدمات..." 
                className="bg-transparent border-none outline-none w-full text-diyar-dark placeholder:text-gray-400 text-sm h-7"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setIsImageSearchOpen(true)}
                className="text-gray-400 hover:text-diyar-brown transition shrink-0 ml-1"
              >
                <Camera className="w-5 h-5" />
              </button>
              <div className="px-2 flex items-center gap-2 cursor-pointer text-diyar-brown hover:text-diyar-dark transition shrink-0" onClick={() => setIsFilterOpen(true)}>
                 <SlidersHorizontal className="w-4 h-4 md:w-5 md:h-5" />
                 <span className="text-sm font-medium hidden sm:block">فلاتر</span>
              </div>
            </form>
            
            <div className="hidden md:flex items-center gap-5 order-2 md:order-3 text-diyar-dark">
              <Link to="/wishlist" title="المحفوظات">
                <Bookmark className="w-6 h-6 cursor-pointer hover:text-diyar-brown transition" />
              </Link>
              <div className="relative" onClick={() => setIsCartOpen(true)}>
                <ShoppingCart className="w-6 h-6 cursor-pointer hover:text-diyar-brown transition" />
                <span className="absolute -top-1.5 -right-2 bg-diyar-brown text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-white">2</span>
              </div>
              
              {isLoggedIn ? (
                <div className="flex items-center gap-4 pr-3">
                  <Link to="/profile" className="flex items-center gap-3 group cursor-pointer">
                    <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-diyar-brown overflow-hidden">
                      <img src="https://ui-avatars.com/api/?name=محمد+أحمد&background=A98759&color=fff" alt="User" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-medium">مرحباً بك</p>
                      <p className="text-sm font-bold text-diyar-dark group-hover:text-diyar-brown transition leading-none mt-1">محمد أحمد</p>
                    </div>
                  </Link>
                  <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition mr-2" title="تسجيل الخروج">
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <Link to="/auth" className="flex items-center pr-3 transition cursor-pointer">
                   <div className="w-9 h-9 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-diyar-dark hover:text-white transition-colors">
                     <User className="w-5 h-5" />
                   </div>
                </Link>
              )}
            </div>
          </div>
        </header>
      )}

      <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />  
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <SidebarMenu isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <ImageSearchModal isOpen={isImageSearchOpen} onClose={() => setIsImageSearchOpen(false)} />
      
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/category/:id" element={<CategoryPage />} />
        <Route path="/store/:id" element={<StorePage />} />
        <Route path="/provider/:id" element={<ProviderPage />} />
        <Route path="/service/:id" element={<ServicePage />} />
        <Route path="/product/:id" element={<ProductDetailsPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/loyalty" element={<LoyaltyPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/security" element={<SecurityPage />} />
        <Route path="/profile/personal-info" element={<PersonalInfoPage />} />
        <Route path="/profile/addresses" element={<AddressesPage />} />
        <Route path="/profile/reviews" element={<ReviewsPage />} />
        <Route path="/profile/notifications" element={<NotificationsPage />} />
        <Route path="/profile/language" element={<LanguagePage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardIndex />} />
          
          <Route path="vendor" element={<VendorDashboard />} />
          <Route path="vendor/orders" element={<VendorOrders />} />
          <Route path="vendor/products" element={<VendorProducts />} />
          <Route path="vendor/team" element={<VendorTeam />} />
          <Route path="vendor/finance" element={<VendorFinance />} />
          <Route path="vendor/settings" element={<VendorSettings />} />
          <Route path="vendor/notifications" element={<Notifications />} />
          
          <Route path="service" element={<ServiceDashboard />} />
          <Route path="service/bookings" element={<ServiceBookings />} />
          <Route path="service/services" element={<ServiceServices />} />
          <Route path="service/finance" element={<ServiceFinance />} />
          <Route path="service/settings" element={<ServiceSettings />} />
          <Route path="service/notifications" element={<Notifications />} />

          <Route path="affiliate" element={<AffiliateDashboard />} />
          <Route path="affiliate/products" element={<AffiliateProducts />} />
          <Route path="affiliate/links" element={<AffiliateLinks />} />
          <Route path="affiliate/reports" element={<AffiliateReports />} />
          <Route path="affiliate/payouts" element={<AffiliatePayouts />} />
          <Route path="affiliate/settings" element={<AffiliateSettings />} />
          <Route path="affiliate/notifications" element={<Notifications />} />
          <Route path="*" element={<div className="p-8 text-center text-gray-500 font-bold bg-white m-4 rounded-xl">هذه الصفحة قيد التطوير (Mockup)</div>} />
        </Route>
      </Routes>

      {!(isAuthPage || isDashboardPage) && <FloatingContactBar />}
      {!(isAuthPage || isDashboardPage) && <Footer />}
      {!(isAuthPage || isDashboardPage) && <MobileBottomNav onOpenCart={() => setIsCartOpen(true)} isLoggedIn={isLoggedIn} />}
    </div>
  );
}



