import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminGuestRoute } from './components/AdminGuestRoute.tsx';
import { ProtectedAdminRoute } from './components/ProtectedAdminRoute.tsx';
import AdminLayout from './layouts/AdminLayout.tsx';
import { AdminPageSkeleton } from './components/AdminPageSkeleton.tsx';
import AdminLoginPage from './pages/AdminLoginPage.tsx';

const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage.tsx'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage.tsx'));
const AdminUserDetailPage = lazy(() => import('./pages/AdminUserDetailPage.tsx'));
const AdminVendorsPage = lazy(() => import('./pages/AdminVendorsPage.tsx'));
const AdminVendorDetailPage = lazy(() => import('./pages/AdminVendorDetailPage.tsx'));
const AdminProvidersPage = lazy(() => import('./pages/AdminProvidersPage.tsx'));
const AdminProviderDetailPage = lazy(() => import('./pages/AdminProviderDetailPage.tsx'));
const AdminCategoriesPage = lazy(() => import('./pages/AdminCategoriesPage.tsx'));
const AdminBlogArticlesPage = lazy(() => import('./pages/AdminBlogArticlesPage.tsx'));
const AdminProjectsPage = lazy(() => import('./pages/AdminProjectsPage.tsx'));
const AdminB2bCompaniesPage = lazy(() => import('./pages/AdminB2bCompaniesPage.tsx'));
const AdminFinancePage = lazy(() => import('./pages/AdminFinancePage.tsx'));
const AdminAffiliateHubPage = lazy(() => import('./pages/AdminAffiliateHubPage.tsx'));
const AdminAuditPage = lazy(() => import('./pages/AdminAuditPage.tsx'));
const AdminChatHubPage = lazy(() => import('./pages/AdminChatHubPage.tsx'));
const AdminAnalyticsPage = lazy(() => import('./pages/AdminAnalyticsPage.tsx'));
const AdminSettingsPage = lazy(() => import('./pages/AdminSettingsPage.tsx'));
const AdminPaymentsPage = lazy(() => import('./pages/AdminPaymentsPage.tsx'));
const AdminPaymentDetailPage = lazy(() => import('./pages/AdminPaymentDetailPage.tsx'));

function AdminRouteFallback() {
  return <AdminPageSkeleton />;
}

export default function AdminShell() {
  return (
    <Routes>
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
        <Route index element={<Suspense fallback={<AdminRouteFallback />}><AdminDashboardPage /></Suspense>} />
        <Route path="users" element={<Suspense fallback={<AdminRouteFallback />}><AdminUsersPage /></Suspense>} />
        <Route path="users/:userId" element={<Suspense fallback={<AdminRouteFallback />}><AdminUserDetailPage /></Suspense>} />
        <Route path="vendors" element={<Suspense fallback={<AdminRouteFallback />}><AdminVendorsPage /></Suspense>} />
        <Route path="vendors/:vendorId" element={<Suspense fallback={<AdminRouteFallback />}><AdminVendorDetailPage /></Suspense>} />
        <Route path="providers" element={<Suspense fallback={<AdminRouteFallback />}><AdminProvidersPage /></Suspense>} />
        <Route path="providers/:providerId" element={<Suspense fallback={<AdminRouteFallback />}><AdminProviderDetailPage /></Suspense>} />
        <Route path="affiliate" element={<Suspense fallback={<AdminRouteFallback />}><AdminAffiliateHubPage /></Suspense>} />
        <Route path="categories" element={<Suspense fallback={<AdminRouteFallback />}><AdminCategoriesPage /></Suspense>} />
        <Route path="payments" element={<Suspense fallback={<AdminRouteFallback />}><AdminPaymentsPage /></Suspense>} />
        <Route path="payments/:paymentId" element={<Suspense fallback={<AdminRouteFallback />}><AdminPaymentDetailPage /></Suspense>} />
        <Route path="blog/articles" element={<Suspense fallback={<AdminRouteFallback />}><AdminBlogArticlesPage /></Suspense>} />
        <Route path="projects" element={<Suspense fallback={<AdminRouteFallback />}><AdminProjectsPage /></Suspense>} />
        <Route path="b2b/companies" element={<Suspense fallback={<AdminRouteFallback />}><AdminB2bCompaniesPage /></Suspense>} />
        <Route path="finance" element={<Suspense fallback={<AdminRouteFallback />}><AdminFinancePage /></Suspense>} />
        <Route path="payouts" element={<Navigate to="/admin/finance" replace />} />
        <Route path="transactions" element={<Navigate to="/admin/finance" replace />} />
        <Route path="audit" element={<Suspense fallback={<AdminRouteFallback />}><AdminAuditPage /></Suspense>} />
        <Route path="chat" element={<Suspense fallback={<AdminRouteFallback />}><AdminChatHubPage /></Suspense>} />
        <Route path="analytics" element={<Suspense fallback={<AdminRouteFallback />}><AdminAnalyticsPage /></Suspense>} />
        <Route path="analytics/funnel" element={<Navigate to="/admin/analytics#funnel" replace />} />
        <Route path="analytics/cohorts" element={<Navigate to="/admin/analytics#cohorts" replace />} />
        <Route path="analytics/search" element={<Navigate to="/admin/analytics#search" replace />} />
        <Route path="settings" element={<Suspense fallback={<AdminRouteFallback />}><AdminSettingsPage /></Suspense>} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}
