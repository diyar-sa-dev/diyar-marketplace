import { type LazyExoticComponent, type ComponentType, lazy } from 'react';

/** Storefront pages — loaded on demand per route. */
export const HomePage = lazy(() => import('../pages/HomePage.tsx'));
export const CategoryPage = lazy(() => import('../pages/CategoryPage.tsx'));
export const ProductDetailsPage = lazy(() => import('../pages/ProductDetailsPage.tsx'));
export const CheckoutPage = lazy(() => import('../pages/CheckoutPage.tsx'));
export const OrderPaymentPage = lazy(() => import('../pages/OrderPaymentPage.tsx'));
export const LocalPaymentSimulatorPage = lazy(() => import('../pages/LocalPaymentSimulatorPage.tsx'));
export const OrdersPage = lazy(() => import('../pages/OrdersPage.tsx'));
export const LoyaltyPage = lazy(() => import('../pages/LoyaltyPage.tsx'));
export const SearchPage = lazy(() => import('../pages/SearchPage.tsx'));
export const BlogArticlePage = lazy(() => import('../pages/BlogArticlePage.tsx'));
export const BlogPage = lazy(() => import('../pages/BlogPage.tsx'));
export const ProfilePage = lazy(() => import('../pages/ProfilePage.tsx'));
export const ServiceRequestsPage = lazy(() => import('../pages/ServiceRequestsPage.tsx'));
export const ServiceBookingsPage = lazy(() => import('../pages/ServiceBookingsPage.tsx'));
export const WishlistPage = lazy(() => import('../pages/WishlistPage.tsx'));
export const ReviewsPage = lazy(() => import('../pages/ReviewsPage.tsx'));
export const CustomerReviewDetailPage = lazy(() => import('../pages/CustomerReviewDetailPage.tsx'));
export const PersonalInfoPage = lazy(() => import('../pages/PersonalInfoPage.tsx'));
export const AddressesPage = lazy(() => import('../pages/AddressesPage.tsx'));
export const SecurityPage = lazy(() => import('../pages/SecurityPage.tsx'));
export const PasswordResetPage = lazy(() => import('../pages/PasswordResetPage.tsx'));
export const NotificationsPage = lazy(() => import('../pages/NotificationsPage.tsx'));
export const NotificationSettingsPage = lazy(() => import('../pages/NotificationSettingsPage.tsx'));
export const LanguagePage = lazy(() => import('../pages/LanguagePage.tsx'));
export const AuthPage = lazy(() => import('../pages/AuthPage.tsx'));
export const StorePage = lazy(() => import('../pages/StorePage.tsx'));
export const ProviderPage = lazy(() => import('../pages/ProviderPage.tsx'));
export const B2BPage = lazy(() => import('../pages/B2BPage.tsx'));
export const B2BCompanyPage = lazy(() => import('../pages/B2BCompanyPage.tsx'));
export const ServicePage = lazy(() => import('../pages/ServicePage.tsx'));
export const ServicesPage = lazy(() => import('../pages/ServicesPage.tsx'));
export const AIDesignerPage = lazy(() => import('../pages/AIDesignerPage.tsx'));
export const ChatPage = lazy(() => import('../pages/ChatPage.tsx'));
export const ForbiddenPage = lazy(() => import('../pages/errors/ForbiddenPage.tsx'));
export const NotFoundPage = lazy(() => import('../pages/errors/NotFoundPage.tsx'));
export const TeamInvitePage = lazy(() => import('../pages/TeamInvitePage.tsx'));
export const PendingAccountPage = lazy(() => import('../pages/account/PendingAccountPage.tsx'));
export const SuspendedAccountPage = lazy(() => import('../pages/account/SuspendedAccountPage.tsx'));

/** Vendor / provider / affiliate dashboard — separate chunk, loaded only on /dashboard/*. */
export const DashboardLayout = lazy(() => import('../layouts/DashboardLayout.tsx'));
export const DashboardIndex = lazy(() => import('../pages/dashboard/DashboardIndex.tsx'));
export const VendorDashboardEntry = lazy(() => import('../pages/dashboard/VendorDashboardEntry.tsx'));
export const VendorOrdersPage = lazy(() => import('../pages/dashboard/vendor/VendorOrdersPage.tsx'));
export const VendorPreordersPage = lazy(() => import('../pages/dashboard/vendor/VendorPreordersPage.tsx'));
export const VendorReturnsPage = lazy(() => import('../pages/dashboard/vendor/VendorReturnsPage.tsx'));
export const VendorProducts = lazy(() => import('../pages/dashboard/VendorProducts.tsx'));
export const ServiceClientRequests = lazy(() => import('../pages/dashboard/ServiceClientRequests.tsx'));
export const ServiceClientRequestDetails = lazy(() => import('../pages/dashboard/ServiceClientRequestDetails.tsx'));
export const VendorTeam = lazy(() => import('../pages/dashboard/VendorTeam.tsx'));
export const VendorReviewsInbox = lazy(() => import('../pages/dashboard/VendorReviewsInbox.tsx'));
export const VendorMessages = lazy(() => import('../pages/dashboard/VendorMessages.tsx'));
export const VendorFinance = lazy(() => import('../pages/dashboard/VendorFinance.tsx'));
export const VendorAnalyticsPage = lazy(() => import('../pages/dashboard/VendorAnalyticsPage.tsx'));
export const ProviderAnalyticsPage = lazy(() => import('../pages/dashboard/ProviderAnalyticsPage.tsx'));
export const VendorCoupons = lazy(() => import('../pages/dashboard/VendorCoupons.tsx'));
export const VendorSettings = lazy(() => import('../pages/dashboard/VendorSettings.tsx'));
export const PartnerB2bProfilePage = lazy(() => import('../pages/dashboard/PartnerB2bProfilePage.tsx'));
export const ServiceDashboard = lazy(() => import('../pages/dashboard/ServiceDashboard.tsx'));
export const ServiceBookings = lazy(() => import('../pages/dashboard/ServiceBookings.tsx'));
export const ServiceReviewsInbox = lazy(() => import('../pages/dashboard/ServiceReviewsInbox.tsx'));
export const ServiceServices = lazy(() => import('../pages/dashboard/ServiceServices.tsx'));
export const ServiceFinance = lazy(() => import('../pages/dashboard/ServiceFinance.tsx'));
export const ServiceSettings = lazy(() => import('../pages/dashboard/ServiceSettings.tsx'));
export const ProviderMessages = lazy(() => import('../pages/dashboard/ProviderMessages.tsx'));
export const AffiliateDashboard = lazy(() => import('../pages/dashboard/AffiliateDashboard.tsx'));
export const AffiliateProducts = lazy(() => import('../pages/dashboard/AffiliateProducts.tsx'));
export const AffiliateLinks = lazy(() => import('../pages/dashboard/AffiliateLinks.tsx'));
export const AffiliateReports = lazy(() => import('../pages/dashboard/AffiliateReports.tsx'));
export const AffiliatePayouts = lazy(() => import('../pages/dashboard/AffiliatePayouts.tsx'));
export const AffiliateSettings = lazy(() => import('../pages/dashboard/AffiliateSettings.tsx'));
export const DashboardNotifications = lazy(() => import('../pages/dashboard/Notifications.tsx'));

/** Heavy chrome widgets — defer until header renders authenticated UI. */
export const NotificationBellDropdown = lazy(() =>
  import('../components/notifications/NotificationBellDropdown.tsx').then((module) => ({
    default: module.NotificationBellDropdown,
  })),
);
export const ChatMessagesLink = lazy(() =>
  import('../components/chat/ChatMessagesLink.tsx').then((module) => ({
    default: module.ChatMessagesLink,
  })),
);

/** Modals — defer until first open. */
export const FilterModal = lazy(() =>
  import('../components/modals/FilterModal.tsx').then((module) => ({ default: module.FilterModal })),
);
export const CartSidebar = lazy(() =>
  import('../components/modals/CartSidebar.tsx').then((module) => ({ default: module.CartSidebar })),
);
export const ImageSearchModal = lazy(() =>
  import('../components/modals/ImageSearchModal.tsx').then((module) => ({ default: module.ImageSearchModal })),
);
export const RequestServiceModal = lazy(() =>
  import('../components/modals/RequestServiceModal.tsx').then((module) => ({
    default: module.RequestServiceModal,
  })),
);
export const SidebarMenu = lazy(() =>
  import('../components/layout/SidebarMenu.tsx').then((module) => ({ default: module.SidebarMenu })),
);

export type LazyPage = LazyExoticComponent<ComponentType<object>>;
