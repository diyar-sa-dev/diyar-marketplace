import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../components/routes/ProtectedRoute.tsx';
import { CustomerProfileRoute } from '../components/routes/CustomerProfileRoute.tsx';
import { GuestRoute } from '../components/routes/GuestRoute.tsx';
import { AccountStatusRoute } from '../components/routes/AccountStatusRoute.tsx';
import { MarketplaceCommerceRoute } from '../components/routing/MarketplaceCommerceRoute.tsx';
import { LazyRoute, PageRouteFallback } from './LazyRoute.tsx';
import {
  AIDesignerPage,
  AddressesPage,
  AuthPage,
  B2BCompanyPage,
  B2BPage,
  BlogArticlePage,
  BlogPage,
  CategoryPage,
  ChatPage,
  CheckoutPage,
  CustomerReviewDetailPage,
  ForbiddenPage,
  HomePage,
  LanguagePage,
  LocalPaymentSimulatorPage,
  LoyaltyPage,
  NotFoundPage,
  NotificationSettingsPage,
  NotificationsPage,
  OrderPaymentPage,
  OrdersPage,
  PasswordResetPage,
  PendingAccountPage,
  PersonalInfoPage,
  ProductDetailsPage,
  ProfilePage,
  ProviderPage,
  ReviewsPage,
  SearchPage,
  SecurityPage,
  ServiceBookingsPage,
  ServicePage,
  ServiceRequestsPage,
  ServicesPage,
  StorePage,
  SuspendedAccountPage,
  TeamInvitePage,
  WishlistPage,
} from './lazyPages.ts';

const DashboardRoutes = lazy(() => import('./DashboardRoutes.tsx'));

export default function StorefrontRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LazyRoute><HomePage /></LazyRoute>} />
      <Route path="/team-invite" element={<ProtectedRoute><LazyRoute><TeamInvitePage /></LazyRoute></ProtectedRoute>} />
      <Route path="/auth" element={<GuestRoute><LazyRoute><AuthPage /></LazyRoute></GuestRoute>} />
      <Route path="/account/pending" element={<AccountStatusRoute allowed="pending"><LazyRoute><PendingAccountPage /></LazyRoute></AccountStatusRoute>} />
      <Route path="/account/suspended" element={<AccountStatusRoute allowed="suspended"><LazyRoute><SuspendedAccountPage /></LazyRoute></AccountStatusRoute>} />
      <Route path="/category/:id" element={<LazyRoute><CategoryPage /></LazyRoute>} />
      <Route path="/store/:id" element={<LazyRoute><StorePage /></LazyRoute>} />
      <Route path="/provider/:id" element={<LazyRoute><ProviderPage /></LazyRoute>} />
      <Route path="/b2b" element={<LazyRoute><B2BPage /></LazyRoute>} />
      <Route path="/b2b/:id" element={<LazyRoute><B2BCompanyPage /></LazyRoute>} />
      <Route path="/ai-designer" element={<LazyRoute><AIDesignerPage /></LazyRoute>} />
      <Route path="/chat" element={<ProtectedRoute><LazyRoute><ChatPage /></LazyRoute></ProtectedRoute>} />
      <Route path="/services" element={<LazyRoute><ServicesPage /></LazyRoute>} />
      <Route path="/service/:id" element={<LazyRoute><ServicePage /></LazyRoute>} />
      <Route path="/product/:id" element={<LazyRoute><ProductDetailsPage /></LazyRoute>} />
      <Route path="/checkout" element={<ProtectedRoute><MarketplaceCommerceRoute><LazyRoute><CheckoutPage /></LazyRoute></MarketplaceCommerceRoute></ProtectedRoute>} />
      <Route path="/checkout/payment/:orderId/simulate" element={<ProtectedRoute><MarketplaceCommerceRoute><LazyRoute><LocalPaymentSimulatorPage /></LazyRoute></MarketplaceCommerceRoute></ProtectedRoute>} />
      <Route path="/checkout/payment/:orderId" element={<ProtectedRoute><MarketplaceCommerceRoute><LazyRoute><OrderPaymentPage /></LazyRoute></MarketplaceCommerceRoute></ProtectedRoute>} />
      <Route path="/orders" element={<CustomerProfileRoute><LazyRoute><OrdersPage /></LazyRoute></CustomerProfileRoute>} />
      <Route path="/loyalty" element={<LazyRoute><LoyaltyPage /></LazyRoute>} />
      <Route path="/search" element={<LazyRoute><SearchPage /></LazyRoute>} />
      <Route path="/blog/tag/:tagSlug" element={<LazyRoute><BlogPage /></LazyRoute>} />
      <Route path="/blog/:slug" element={<LazyRoute><BlogArticlePage /></LazyRoute>} />
      <Route path="/blog" element={<LazyRoute><BlogPage /></LazyRoute>} />
      <Route path="/profile" element={<CustomerProfileRoute><LazyRoute><ProfilePage /></LazyRoute></CustomerProfileRoute>} />
      <Route path="/profile/service-bookings" element={<CustomerProfileRoute><LazyRoute><ServiceBookingsPage /></LazyRoute></CustomerProfileRoute>} />
      <Route path="/profile/service-requests" element={<CustomerProfileRoute><LazyRoute><ServiceRequestsPage /></LazyRoute></CustomerProfileRoute>} />
      <Route path="/profile/security/reset-password" element={<ProtectedRoute><LazyRoute><PasswordResetPage /></LazyRoute></ProtectedRoute>} />
      <Route path="/profile/security" element={<ProtectedRoute><LazyRoute><SecurityPage /></LazyRoute></ProtectedRoute>} />
      <Route path="/profile/personal-info" element={<CustomerProfileRoute><LazyRoute><PersonalInfoPage /></LazyRoute></CustomerProfileRoute>} />
      <Route path="/profile/addresses" element={<CustomerProfileRoute><LazyRoute><AddressesPage /></LazyRoute></CustomerProfileRoute>} />
      <Route path="/profile/reviews" element={<CustomerProfileRoute><LazyRoute><ReviewsPage /></LazyRoute></CustomerProfileRoute>} />
      <Route path="/profile/reviews/:type/:id" element={<CustomerProfileRoute><LazyRoute><CustomerReviewDetailPage /></LazyRoute></CustomerProfileRoute>} />
      <Route path="/profile/notifications" element={<CustomerProfileRoute><LazyRoute><NotificationsPage /></LazyRoute></CustomerProfileRoute>} />
      <Route path="/profile/notification-settings" element={<CustomerProfileRoute><LazyRoute><NotificationSettingsPage /></LazyRoute></CustomerProfileRoute>} />
      <Route path="/profile/language" element={<CustomerProfileRoute><LazyRoute><LanguagePage /></LazyRoute></CustomerProfileRoute>} />
      <Route path="/wishlist" element={<CustomerProfileRoute><LazyRoute><WishlistPage /></LazyRoute></CustomerProfileRoute>} />
      <Route path="/403" element={<LazyRoute><ForbiddenPage /></LazyRoute>} />

      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageRouteFallback />}>
              <DashboardRoutes />
            </Suspense>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<LazyRoute><NotFoundPage /></LazyRoute>} />
    </Routes>
  );
}
