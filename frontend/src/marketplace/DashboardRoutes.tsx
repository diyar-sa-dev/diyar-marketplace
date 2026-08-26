import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../components/routes/ProtectedRoute.tsx';
import { RoleName } from '../lib/auth/roles.ts';
import { LazyRoute } from './LazyRoute.tsx';
import {
  AffiliateDashboard,
  AffiliateLinks,
  AffiliatePayouts,
  AffiliateProducts,
  AffiliateReports,
  AffiliateSettings,
  DashboardIndex,
  DashboardLayout,
  DashboardNotifications,
  NotFoundPage,
  PartnerB2bProfilePage,
  ProviderMessages,
  ServiceBookings,
  ServiceClientRequestDetails,
  ServiceClientRequests,
  ServiceDashboard,
  ServiceFinance,
  ServiceReviewsInbox,
  ServiceServices,
  ServiceSettings,
  VendorCoupons,
  VendorDashboardEntry,
  VendorFinance,
  VendorAnalyticsPage,
  ProviderAnalyticsPage,
  VendorMessages,
  VendorOrdersPage,
  VendorPreordersPage,
  VendorProducts,
  VendorReturnsPage,
  VendorReviewsInbox,
  VendorSettings,
  VendorTeam,
} from './lazyPages.ts';

/** Lazy-loaded /dashboard/* subtree — own <Routes> matches React Router v6 nesting rules. */
export default function DashboardRoutes() {
  return (
    <Routes>
      <Route
        element={
          <LazyRoute>
            <DashboardLayout />
          </LazyRoute>
        }
      >
        <Route index element={<LazyRoute><DashboardIndex /></LazyRoute>} />

        <Route path="vendor" element={<LazyRoute><VendorDashboardEntry /></LazyRoute>} />
        <Route path="vendor/orders" element={<ProtectedRoute roles={[RoleName.Vendor]}><LazyRoute><VendorOrdersPage /></LazyRoute></ProtectedRoute>} />
        <Route path="vendor/preorders" element={<ProtectedRoute roles={[RoleName.Vendor]}><LazyRoute><VendorPreordersPage /></LazyRoute></ProtectedRoute>} />
        <Route path="vendor/returns" element={<ProtectedRoute roles={[RoleName.Vendor]}><LazyRoute><VendorReturnsPage /></LazyRoute></ProtectedRoute>} />
        <Route path="vendor/products" element={<ProtectedRoute roles={[RoleName.Vendor]}><LazyRoute><VendorProducts /></LazyRoute></ProtectedRoute>} />
        <Route path="vendor/coupons" element={<ProtectedRoute roles={[RoleName.Vendor]}><LazyRoute><VendorCoupons /></LazyRoute></ProtectedRoute>} />
        <Route path="vendor/reviews" element={<ProtectedRoute roles={[RoleName.Vendor]}><LazyRoute><VendorReviewsInbox /></LazyRoute></ProtectedRoute>} />
        <Route path="vendor/messages" element={<ProtectedRoute roles={[RoleName.Vendor]}><LazyRoute><VendorMessages /></LazyRoute></ProtectedRoute>} />
        <Route path="vendor/team" element={<ProtectedRoute roles={[RoleName.Vendor]}><LazyRoute><VendorTeam /></LazyRoute></ProtectedRoute>} />
        <Route path="vendor/finance" element={<ProtectedRoute roles={[RoleName.Vendor]}><LazyRoute><VendorFinance /></LazyRoute></ProtectedRoute>} />
        <Route path="vendor/analytics" element={<ProtectedRoute roles={[RoleName.Vendor]}><LazyRoute><VendorAnalyticsPage /></LazyRoute></ProtectedRoute>} />
        <Route path="vendor/settings" element={<ProtectedRoute roles={[RoleName.Vendor]}><LazyRoute><VendorSettings /></LazyRoute></ProtectedRoute>} />
        <Route path="vendor/b2b" element={<ProtectedRoute roles={[RoleName.Vendor]}><LazyRoute><PartnerB2bProfilePage portal="vendor" /></LazyRoute></ProtectedRoute>} />
        <Route path="vendor/notifications" element={<ProtectedRoute roles={[RoleName.Vendor]}><LazyRoute><DashboardNotifications /></LazyRoute></ProtectedRoute>} />

        <Route path="service" element={<ProtectedRoute roles={[RoleName.Provider]}><LazyRoute><ServiceDashboard /></LazyRoute></ProtectedRoute>} />
        <Route path="service/client-requests" element={<ProtectedRoute roles={[RoleName.Provider]}><LazyRoute><ServiceClientRequests /></LazyRoute></ProtectedRoute>} />
        <Route path="service/client-requests/:id" element={<ProtectedRoute roles={[RoleName.Provider]}><LazyRoute><ServiceClientRequestDetails /></LazyRoute></ProtectedRoute>} />
        <Route path="service/bookings" element={<ProtectedRoute roles={[RoleName.Provider]}><LazyRoute><ServiceBookings /></LazyRoute></ProtectedRoute>} />
        <Route path="service/services" element={<ProtectedRoute roles={[RoleName.Provider]}><LazyRoute><ServiceServices /></LazyRoute></ProtectedRoute>} />
        <Route path="service/finance" element={<ProtectedRoute roles={[RoleName.Provider]}><LazyRoute><ServiceFinance /></LazyRoute></ProtectedRoute>} />
        <Route path="service/analytics" element={<ProtectedRoute roles={[RoleName.Provider]}><LazyRoute><ProviderAnalyticsPage /></LazyRoute></ProtectedRoute>} />
        <Route path="service/reviews" element={<ProtectedRoute roles={[RoleName.Provider]}><LazyRoute><ServiceReviewsInbox /></LazyRoute></ProtectedRoute>} />
        <Route path="service/messages" element={<ProtectedRoute roles={[RoleName.Provider]}><LazyRoute><ProviderMessages /></LazyRoute></ProtectedRoute>} />
        <Route path="service/settings" element={<ProtectedRoute roles={[RoleName.Provider]}><LazyRoute><ServiceSettings /></LazyRoute></ProtectedRoute>} />
        <Route path="service/b2b" element={<ProtectedRoute roles={[RoleName.Provider]}><LazyRoute><PartnerB2bProfilePage portal="provider" /></LazyRoute></ProtectedRoute>} />
        <Route path="service/notifications" element={<ProtectedRoute roles={[RoleName.Provider]}><LazyRoute><DashboardNotifications /></LazyRoute></ProtectedRoute>} />

        <Route path="affiliate" element={<ProtectedRoute roles={[RoleName.Marketer]}><LazyRoute><AffiliateDashboard /></LazyRoute></ProtectedRoute>} />
        <Route path="affiliate/products" element={<ProtectedRoute roles={[RoleName.Marketer]}><LazyRoute><AffiliateProducts /></LazyRoute></ProtectedRoute>} />
        <Route path="affiliate/links" element={<ProtectedRoute roles={[RoleName.Marketer]}><LazyRoute><AffiliateLinks /></LazyRoute></ProtectedRoute>} />
        <Route path="affiliate/reports" element={<ProtectedRoute roles={[RoleName.Marketer]}><LazyRoute><AffiliateReports /></LazyRoute></ProtectedRoute>} />
        <Route path="affiliate/payouts" element={<ProtectedRoute roles={[RoleName.Marketer]}><LazyRoute><AffiliatePayouts /></LazyRoute></ProtectedRoute>} />
        <Route path="affiliate/settings" element={<ProtectedRoute roles={[RoleName.Marketer]}><LazyRoute><AffiliateSettings /></LazyRoute></ProtectedRoute>} />
        <Route path="affiliate/notifications" element={<ProtectedRoute roles={[RoleName.Marketer]}><LazyRoute><DashboardNotifications /></LazyRoute></ProtectedRoute>} />

        <Route path="*" element={<LazyRoute><NotFoundPage /></LazyRoute>} />
      </Route>
    </Routes>
  );
}
