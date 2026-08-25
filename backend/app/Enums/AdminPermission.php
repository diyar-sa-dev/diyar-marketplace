<?php

namespace App\Enums;

enum AdminPermission: string
{
    case PanelAccess = 'panel.access';
    case AuditView = 'audit.view';

    case UsersView = 'users.view';
    case UsersUpdate = 'users.update';
    case UsersSuspend = 'users.suspend';
    case RolesView = 'roles.view';
    case RolesManage = 'roles.manage';

    case VendorsView = 'vendors.view';
    case VendorsSuspend = 'vendors.suspend';
    case ProvidersView = 'providers.view';
    case ProvidersSuspend = 'providers.suspend';

    case CategoriesView = 'categories.view';
    case CategoriesManage = 'categories.manage';
    case ProductsView = 'products.view';
    case ProductsUpdate = 'products.update';
    case InventoryView = 'inventory.view';
    case InventoryAdjust = 'inventory.adjust';

    case OrdersView = 'orders.view';
    case OrdersAction = 'orders.action';
    case PaymentsView = 'payments.view';
    case RefundsView = 'refunds.view';
    case RefundsApprove = 'refunds.approve';
    case ShippingView = 'shipping.view';

    case CommissionsView = 'commissions.view';
    case BalancesView = 'balances.view';
    case PayoutsView = 'payouts.view';
    case PayoutsApprove = 'payouts.approve';
    case PayoutsProcess = 'payouts.process';

    case CouponsView = 'coupons.view';
    case CouponsManage = 'coupons.manage';
    case ReviewsView = 'reviews.view';
    case ReviewsModerate = 'reviews.moderate';

    case ServicesView = 'services.view';
    case ServiceRequestsView = 'service_requests.view';
    case BookingsView = 'bookings.view';
    case NotificationsView = 'notifications.view';

    case AffiliateView = 'affiliate.view';
    case AffiliateManage = 'affiliate.manage';
    case AffiliatePayoutsProcess = 'affiliate.payouts.process';

    case SettingsView = 'settings.view';
    case SettingsUpdate = 'settings.update';

    case BlogView = 'blog.view';
    case BlogManage = 'blog.manage';
    case ProjectsView = 'projects.view';
    case ProjectsManage = 'projects.manage';

    case B2bView = 'b2b.view';
    case B2bManage = 'b2b.manage';
    case B2bLeadsView = 'b2b.leads.view';

    case LoyaltyView = 'loyalty.view';
    case LoyaltyManage = 'loyalty.manage';
    case LoyaltyAdjust = 'loyalty.adjust';

    /** @return list<self> */
    public static function all(): array
    {
        return self::cases();
    }

    public function group(): string
    {
        return match ($this) {
            self::PanelAccess, self::AuditView => 'system',
            self::UsersView, self::UsersUpdate, self::UsersSuspend, self::RolesView, self::RolesManage => 'identity',
            self::VendorsView, self::VendorsSuspend, self::ProvidersView, self::ProvidersSuspend => 'people',
            self::CategoriesView, self::CategoriesManage, self::ProductsView, self::ProductsUpdate, self::InventoryView, self::InventoryAdjust => 'catalog',
            self::OrdersView, self::OrdersAction, self::PaymentsView, self::RefundsView, self::RefundsApprove, self::ShippingView => 'commerce',
            self::CommissionsView, self::BalancesView, self::PayoutsView, self::PayoutsApprove, self::PayoutsProcess => 'finance',
            self::CouponsView, self::CouponsManage => 'coupons',
            self::ReviewsView, self::ReviewsModerate => 'reviews',
            self::ServicesView, self::ServiceRequestsView, self::BookingsView => 'services',
            self::NotificationsView => 'notifications',
            self::AffiliateView, self::AffiliateManage, self::AffiliatePayoutsProcess => 'affiliate',
            self::SettingsView, self::SettingsUpdate => 'settings',
            self::BlogView, self::BlogManage => 'blog',
            self::ProjectsView, self::ProjectsManage => 'projects',
            self::B2bView, self::B2bManage, self::B2bLeadsView => 'b2b',
            self::LoyaltyView, self::LoyaltyManage, self::LoyaltyAdjust => 'loyalty',
        };
    }

    public function labelKey(): string
    {
        return 'admin.permissions.'.$this->value;
    }
}
