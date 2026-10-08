# DIYAR — COMPREHENSIVE ROUTE SECURITY INVENTORY
# FULL-STACK API & ROUTE SECURITY MATRIX

**Document Type:** Authoritative Route Security Inventory & Coverage Accounting  
**Date:** 2026-10-08  
**Scope:** Total Registered Routes: 528  
**Target Environment:** Local VPS Production Simulation (`diyar-vps-sim`)  
**Security Standard:** OWASP API Security Top 10 (2023) & Laravel Hardening Invariants  

---

## 1. Executive Summary & Inventory Distribution

This registry maps every registered route in the DIYAR marketplace backend across HTTP methods, controller actions, authentication guards, role/permission requirements, read/write classification, and security audit scope.

### Total Routes: **528**

| Domain / Subsystem | Total Routes | Read Routes | Write Routes | Protected Routes | Public Routes |
|---|---:|---:|---:|---:|---:|
| **Admin Control Plane** | 185 | 94 | 91 | 184 | 1 |
| **Authentication & Identity** | 14 | 2 | 12 | 2 | 12 |
| **Cart & Basket** | 7 | 1 | 6 | 1 | 6 |
| **Catalog, Products & Categories** | 17 | 10 | 7 | 8 | 9 |
| **Checkout, Orders & Returns** | 15 | 7 | 8 | 15 | 0 |
| **Communications & WebSockets** | 1 | 0 | 1 | 1 | 0 |
| **Content, FAQ & Reviews** | 5 | 4 | 1 | 1 | 4 |
| **Customer Profile & Addresses** | 53 | 18 | 35 | 53 | 0 |
| **Search & Discovery** | 2 | 1 | 1 | 0 | 2 |
| **Services & Service Providers** | 6 | 3 | 3 | 3 | 3 |
| **System & Utility** | 212 | 101 | 111 | 180 | 32 |
| **Vendors & Stores** | 9 | 6 | 3 | 5 | 4 |
| **Visual Tools & Room Designer** | 2 | 2 | 0 | 2 | 0 |
| **TOTAL** | **528** | **249** | **279** | **455** | **73** |

---

## 2. Route Inventory by Domain

### 2.AdminControlPlane Admin Control Plane (185 routes)

| Method | URI | Controller Action | Guard | Required Role / Permission | R/W | Audit Status |
|---|---|---|---|---|:---:|:---:|
| `GET|HEAD` | `api/v1/admin/affiliate/attributions` | `Admin\Controllers\AdminAffiliateAttributionController@index` | `admin` | Role: admin | Perm: affiliate.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/affiliate/attributions/{affiliateAttribution}` | `Admin\Controllers\AdminAffiliateAttributionController@show` | `admin` | Role: admin | Perm: affiliate.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/affiliate/clicks` | `Admin\Controllers\AdminAffiliateClickController@index` | `admin` | Role: admin | Perm: affiliate.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/affiliate/clicks/{affiliateClick}` | `Admin\Controllers\AdminAffiliateClickController@show` | `admin` | Role: admin | Perm: affiliate.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/affiliate/commissions` | `Admin\Controllers\AdminAffiliateCommissionController@index` | `admin` | Role: admin | Perm: commissions.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/affiliate/commissions/{affiliateCommission}` | `Admin\Controllers\AdminAffiliateCommissionController@show` | `admin` | Role: admin | Perm: commissions.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/affiliate/links` | `Admin\Controllers\AdminAffiliateLinkController@index` | `admin` | Role: admin | Perm: affiliate.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/affiliate/links/{affiliateLink}` | `Admin\Controllers\AdminAffiliateLinkController@show` | `admin` | Role: admin | Perm: affiliate.view | Read | PASS (Audited) |
| `POST` | `api/v1/admin/affiliate/links/{affiliateLink}/disable` | `Admin\Controllers\AdminAffiliateLinkController@disable` | `admin` | Role: admin | Perm: affiliate.manage | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/affiliate/payouts` | `Admin\Controllers\AdminAffiliatePayoutController@index` | `admin` | Role: admin | Perm: affiliate.view | Read | PASS (Audited) |
| `POST` | `api/v1/admin/affiliate/payouts/{affiliatePayout}/approve` | `Admin\Controllers\AdminAffiliatePayoutController@approve` | `admin` | Role: admin | Perm: affiliate.payouts.process | Write | PASS (Audited) |
| `POST` | `api/v1/admin/affiliate/payouts/{affiliatePayout}/mark-paid` | `Admin\Controllers\AdminAffiliatePayoutController@markPaid` | `admin` | Role: admin | Perm: affiliate.payouts.process | Write | PASS (Audited) |
| `POST` | `api/v1/admin/affiliate/payouts/{affiliatePayout}/mark-processing` | `Admin\Controllers\AdminAffiliatePayoutController@markProcessing` | `admin` | Role: admin | Perm: affiliate.payouts.process | Write | PASS (Audited) |
| `POST` | `api/v1/admin/affiliate/payouts/{affiliatePayout}/processing` | `Admin\Controllers\AdminAffiliatePayoutController@markProcessing` | `admin` | Role: admin | Perm: affiliate.payouts.process | Write | PASS (Audited) |
| `POST` | `api/v1/admin/affiliate/payouts/{affiliatePayout}/reject` | `Admin\Controllers\AdminAffiliatePayoutController@reject` | `admin` | Role: admin | Perm: affiliate.payouts.process | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/affiliate/profiles` | `Admin\Controllers\AdminAffiliateProfileController@index` | `admin` | Role: admin | Perm: affiliate.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/affiliate/profiles/{affiliateProfile}` | `Admin\Controllers\AdminAffiliateProfileController@show` | `admin` | Role: admin | Perm: affiliate.view | Read | PASS (Audited) |
| `POST` | `api/v1/admin/affiliate/profiles/{affiliateProfile}/activate` | `Admin\Controllers\AdminAffiliateProfileController@activate` | `admin` | Role: admin | Perm: affiliate.manage | Write | PASS (Audited) |
| `POST` | `api/v1/admin/affiliate/profiles/{affiliateProfile}/suspend` | `Admin\Controllers\AdminAffiliateProfileController@suspend` | `admin` | Role: admin | Perm: affiliate.manage | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/analytics/cohorts` | `Admin\Controllers\AdminAnalyticsController@cohorts` | `admin` | Role: admin | Perm: analytics.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/analytics/export` | `Admin\Controllers\AdminAnalyticsController@export` | `admin` | Role: admin | Perm: analytics.export | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/analytics/funnel` | `Admin\Controllers\AdminAnalyticsController@funnel` | `admin` | Role: admin | Perm: analytics.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/analytics/overview` | `Admin\Controllers\AdminAnalyticsController@overview` | `admin` | Role: admin | Perm: analytics.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/analytics/sales` | `Admin\Controllers\AdminAnalyticsController@sales` | `admin` | Role: admin | Perm: analytics.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/analytics/search` | `Admin\Controllers\AdminAnalyticsController@search` | `admin` | Role: admin | Perm: search.analytics.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/announcement` | `Admin\Controllers\AdminAnnouncementController@show` | `admin` | Role: admin | Perm: settings.view | Read | PASS (Audited) |
| `PATCH` | `api/v1/admin/announcement` | `Admin\Controllers\AdminAnnouncementController@update` | `admin` | Role: admin | Perm: settings.update | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/audit-logs` | `Admin\Controllers\AdminAuditLogController@index` | `admin` | Role: admin | Perm: audit.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/audit-logs/{auditLog}` | `Admin\Controllers\AdminAuditLogController@show` | `admin` | Role: admin | Perm: audit.view | Read | PASS (Audited) |
| `POST` | `api/v1/admin/auth/login` | `Admin\Controllers\AdminAuthController@login` | _public_ | - | Write | PASS (Audited) |
| `POST` | `api/v1/admin/auth/logout` | `Admin\Controllers\AdminAuthController@logout` | `admin` | Role: admin | Perm: N/A | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/b2b/categories` | `Admin\Controllers\AdminB2bCompanyController@categories` | `admin` | Role: admin | Perm: b2b.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/b2b/companies` | `Admin\Controllers\AdminB2bCompanyController@index` | `admin` | Role: admin | Perm: b2b.view | Read | PASS (Audited) |
| `POST` | `api/v1/admin/b2b/companies` | `Admin\Controllers\AdminB2bCompanyController@store` | `admin` | Role: admin | Perm: b2b.manage | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/b2b/companies/{company}` | `Admin\Controllers\AdminB2bCompanyController@show` | `admin` | Role: admin | Perm: b2b.view | Read | PASS (Audited) |
| `PATCH` | `api/v1/admin/b2b/companies/{company}` | `Admin\Controllers\AdminB2bCompanyController@update` | `admin` | Role: admin | Perm: b2b.manage | Write | PASS (Audited) |
| `DELETE` | `api/v1/admin/b2b/companies/{company}` | `Admin\Controllers\AdminB2bCompanyController@destroy` | `admin` | Role: admin | Perm: b2b.manage | Write | PASS (Audited) |
| `POST` | `api/v1/admin/b2b/companies/{company}/archive` | `Admin\Controllers\AdminB2bCompanyController@archive` | `admin` | Role: admin | Perm: b2b.manage | Write | PASS (Audited) |
| `POST` | `api/v1/admin/b2b/companies/{company}/feature` | `Admin\Controllers\AdminB2bCompanyController@feature` | `admin` | Role: admin | Perm: b2b.manage | Write | PASS (Audited) |
| `POST` | `api/v1/admin/b2b/companies/{company}/publish` | `Admin\Controllers\AdminB2bCompanyController@publish` | `admin` | Role: admin | Perm: b2b.manage | Write | PASS (Audited) |
| `POST` | `api/v1/admin/b2b/companies/{company}/reject-verification` | `Admin\Controllers\AdminB2bCompanyController@rejectVerification` | `admin` | Role: admin | Perm: b2b.manage | Write | PASS (Audited) |
| `POST` | `api/v1/admin/b2b/companies/{company}/unfeature` | `Admin\Controllers\AdminB2bCompanyController@unfeature` | `admin` | Role: admin | Perm: b2b.manage | Write | PASS (Audited) |
| `POST` | `api/v1/admin/b2b/companies/{company}/unpublish` | `Admin\Controllers\AdminB2bCompanyController@unpublish` | `admin` | Role: admin | Perm: b2b.manage | Write | PASS (Audited) |
| `POST` | `api/v1/admin/b2b/companies/{company}/verify` | `Admin\Controllers\AdminB2bCompanyController@verify` | `admin` | Role: admin | Perm: b2b.manage | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/b2b/leads` | `Admin\Controllers\AdminB2bCompanyController@leads` | `admin` | Role: admin | Perm: b2b.leads.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/b2b/leads/{lead}` | `Admin\Controllers\AdminB2bCompanyController@showLead` | `admin` | Role: admin | Perm: b2b.leads.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/b2b/tags` | `Admin\Controllers\AdminB2bCompanyController@tags` | `admin` | Role: admin | Perm: b2b.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/blog/articles` | `Admin\Controllers\AdminBlogArticleController@index` | `admin` | Role: admin | Perm: blog.view | Read | PASS (Audited) |
| `POST` | `api/v1/admin/blog/articles` | `Admin\Controllers\AdminBlogArticleController@store` | `admin` | Role: admin | Perm: blog.manage | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/blog/articles/{article}` | `Admin\Controllers\AdminBlogArticleController@show` | `admin` | Role: admin | Perm: blog.view | Read | PASS (Audited) |
| `PATCH` | `api/v1/admin/blog/articles/{article}` | `Admin\Controllers\AdminBlogArticleController@update` | `admin` | Role: admin | Perm: blog.manage | Write | PASS (Audited) |
| `DELETE` | `api/v1/admin/blog/articles/{article}` | `Admin\Controllers\AdminBlogArticleController@destroy` | `admin` | Role: admin | Perm: blog.manage | Write | PASS (Audited) |
| `POST` | `api/v1/admin/blog/articles/{article}/archive` | `Admin\Controllers\AdminBlogArticleController@archive` | `admin` | Role: admin | Perm: blog.manage | Write | PASS (Audited) |
| `POST` | `api/v1/admin/blog/articles/{article}/publish` | `Admin\Controllers\AdminBlogArticleController@publish` | `admin` | Role: admin | Perm: blog.manage | Write | PASS (Audited) |
| `POST` | `api/v1/admin/blog/articles/{article}/unpublish` | `Admin\Controllers\AdminBlogArticleController@unpublish` | `admin` | Role: admin | Perm: blog.manage | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/blog/categories` | `Admin\Controllers\AdminBlogCategoryController@index` | `admin` | Role: admin | Perm: blog.view | Read | PASS (Audited) |
| `POST` | `api/v1/admin/blog/categories` | `Admin\Controllers\AdminBlogCategoryController@store` | `admin` | Role: admin | Perm: blog.manage | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/blog/categories/{category}` | `Admin\Controllers\AdminBlogCategoryController@show` | `admin` | Role: admin | Perm: blog.view | Read | PASS (Audited) |
| `PATCH` | `api/v1/admin/blog/categories/{category}` | `Admin\Controllers\AdminBlogCategoryController@update` | `admin` | Role: admin | Perm: blog.manage | Write | PASS (Audited) |
| `DELETE` | `api/v1/admin/blog/categories/{category}` | `Admin\Controllers\AdminBlogCategoryController@destroy` | `admin` | Role: admin | Perm: blog.manage | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/blog/tags` | `Admin\Controllers\AdminBlogTagController@index` | `admin` | Role: admin | Perm: blog.view | Read | PASS (Audited) |
| `POST` | `api/v1/admin/blog/tags` | `Admin\Controllers\AdminBlogTagController@store` | `admin` | Role: admin | Perm: blog.manage | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/blog/tags/{tag}` | `Admin\Controllers\AdminBlogTagController@show` | `admin` | Role: admin | Perm: blog.view | Read | PASS (Audited) |
| `PATCH` | `api/v1/admin/blog/tags/{tag}` | `Admin\Controllers\AdminBlogTagController@update` | `admin` | Role: admin | Perm: blog.manage | Write | PASS (Audited) |
| `DELETE` | `api/v1/admin/blog/tags/{tag}` | `Admin\Controllers\AdminBlogTagController@destroy` | `admin` | Role: admin | Perm: blog.manage | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/categories` | `Admin\Controllers\CategoryController@index` | `admin` | Role: admin | Perm: categories.view | Read | PASS (Audited) |
| `POST` | `api/v1/admin/categories` | `Admin\Controllers\CategoryController@store` | `admin` | Role: admin | Perm: categories.manage | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/categories/{category}` | `Admin\Controllers\CategoryController@show` | `admin` | Role: admin | Perm: categories.view | Read | PASS (Audited) |
| `PATCH` | `api/v1/admin/categories/{category}` | `Admin\Controllers\CategoryController@update` | `admin` | Role: admin | Perm: categories.manage | Write | PASS (Audited) |
| `DELETE` | `api/v1/admin/categories/{category}` | `Admin\Controllers\CategoryController@destroy` | `admin` | Role: admin | Perm: categories.manage | Write | PASS (Audited) |
| `POST` | `api/v1/admin/categories/{category}/image` | `Admin\Controllers\CategoryController@uploadImage` | `admin` | Role: admin | Perm: categories.manage | Write | PASS (Audited) |
| `DELETE` | `api/v1/admin/categories/{category}/image` | `Admin\Controllers\CategoryController@deleteImage` | `admin` | Role: admin | Perm: categories.manage | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/chat/conversations` | `Admin\Controllers\AdminChatController@indexConversations` | `admin` | Role: admin | Perm: chat.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/chat/conversations/{conversation}` | `Admin\Controllers\AdminChatController@showConversation` | `admin` | Role: admin | Perm: chat.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/chat/conversations/{conversation}/messages` | `Admin\Controllers\AdminChatController@indexMessages` | `admin` | Role: admin | Perm: chat.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/chat/reports` | `Admin\Controllers\AdminChatController@indexReports` | `admin` | Role: admin | Perm: chat.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/chat/reports/{report}` | `Admin\Controllers\AdminChatController@showReport` | `admin` | Role: admin | Perm: chat.view | Read | PASS (Audited) |
| `PATCH` | `api/v1/admin/chat/reports/{report}` | `Admin\Controllers\AdminChatController@updateReport` | `admin` | Role: admin | Perm: chat.moderate | Write | PASS (Audited) |
| `POST` | `api/v1/admin/cms/media/image` | `Admin\Controllers\AdminCmsMediaController@uploadImage` | `admin` | Role: admin | Perm: N/A | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/coupons` | `Admin\Controllers\AdminCouponController@index` | `admin` | Role: admin | Perm: coupons.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/coupons/{coupon}` | `Admin\Controllers\AdminCouponController@show` | `admin` | Role: admin | Perm: coupons.view | Read | PASS (Audited) |
| `POST` | `api/v1/admin/coupons/{coupon}/activate` | `Admin\Controllers\AdminCouponController@activate` | `admin` | Role: admin | Perm: coupons.manage | Write | PASS (Audited) |
| `POST` | `api/v1/admin/coupons/{coupon}/deactivate` | `Admin\Controllers\AdminCouponController@deactivate` | `admin` | Role: admin | Perm: coupons.manage | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/dashboard` | `Admin\Controllers\AdminDashboardController@show` | `admin` | Role: admin | Perm: panel.access | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/feedback` | `Admin\Controllers\AdminWebsiteFeedbackController@index` | `admin` | Role: admin | Perm: feedback.view | Read | PASS (Audited) |
| `DELETE` | `api/v1/admin/feedback/{websiteFeedback}` | `Admin\Controllers\AdminWebsiteFeedbackController@destroy` | `admin` | Role: admin | Perm: feedback.manage | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/finance/report` | `Admin\Controllers\AdminFinanceController@exportReport` | `admin` | Role: admin | Perm: balances.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/finance/summary` | `Admin\Controllers\AdminFinanceController@summary` | `admin` | Role: admin | Perm: balances.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/inventory/movements` | `Admin\Controllers\AdminInventoryController@movements` | `admin` | Role: admin | Perm: inventory.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/inventory/products` | `Admin\Controllers\AdminInventoryController@products` | `admin` | Role: admin | Perm: inventory.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/loyalty/customers/{user}` | `Admin\Controllers\AdminLoyaltyController@showCustomer` | `admin` | Role: admin | Perm: loyalty.view | Read | PASS (Audited) |
| `POST` | `api/v1/admin/loyalty/customers/{user}/adjust` | `Admin\Controllers\AdminLoyaltyController@adjust` | `admin` | Role: admin | Perm: loyalty.adjust | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/notifications` | `Admin\Controllers\AdminNotificationController@index` | `admin` | Role: admin | Perm: notifications.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/notifications/broadcasts` | `Admin\Controllers\AdminNotificationBroadcastController@index` | `admin` | Role: admin | Perm: notifications.view | Read | PASS (Audited) |
| `POST` | `api/v1/admin/notifications/broadcasts` | `Admin\Controllers\AdminNotificationBroadcastController@store` | `admin` | Role: admin | Perm: notifications.manage | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/notifications/broadcasts/{broadcast}` | `Admin\Controllers\AdminNotificationBroadcastController@show` | `admin` | Role: admin | Perm: notifications.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/notifications/deliveries` | `Admin\Controllers\AdminNotificationController@deliveries` | `admin` | Role: admin | Perm: notifications.view | Read | PASS (Audited) |
| `POST` | `api/v1/admin/notifications/deliveries/{delivery}/retry` | `Admin\Controllers\AdminNotificationController@retryDelivery` | `admin` | Role: admin | Perm: notifications.manage | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/notifications/{notification}` | `Admin\Controllers\AdminNotificationController@show` | `admin` | Role: admin | Perm: notifications.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/orders` | `Admin\Controllers\AdminOrderController@index` | `admin` | Role: admin | Perm: orders.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/orders/{order}` | `Admin\Controllers\AdminOrderController@show` | `admin` | Role: admin | Perm: orders.view | Read | PASS (Audited) |
| `POST` | `api/v1/admin/orders/{order}/cancel` | `Admin\Controllers\AdminOrderController@cancel` | `admin` | Role: admin | Perm: orders.action | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/payments` | `Admin\Controllers\AdminPaymentController@index` | `admin` | Role: admin | Perm: payments.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/payments/{payment}` | `Admin\Controllers\AdminPaymentController@show` | `admin` | Role: admin | Perm: payments.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/payouts` | `Admin\Controllers\AdminPayoutController@index` | `admin` | Role: admin | Perm: payouts.view | Read | PASS (Audited) |
| `POST` | `api/v1/admin/payouts/{payout}/approve` | `Admin\Controllers\AdminPayoutController@approve` | `admin` | Role: admin | Perm: payouts.approve | Write | PASS (Audited) |
| `POST` | `api/v1/admin/payouts/{payout}/mark-paid` | `Admin\Controllers\AdminPayoutController@markPaid` | `admin` | Role: admin | Perm: payouts.process | Write | PASS (Audited) |
| `POST` | `api/v1/admin/payouts/{payout}/reject` | `Admin\Controllers\AdminPayoutController@reject` | `admin` | Role: admin | Perm: payouts.approve | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/permissions` | `Admin\Controllers\AdminPermissionController@index` | `admin` | Role: admin | Perm: roles.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/products` | `Admin\Controllers\AdminProductController@index` | `admin` | Role: admin | Perm: products.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/products/{product}` | `Admin\Controllers\AdminProductController@show` | `admin` | Role: admin | Perm: products.view | Read | PASS (Audited) |
| `POST` | `api/v1/admin/products/{product}/activate` | `Admin\Controllers\AdminProductController@activate` | `admin` | Role: admin | Perm: products.update | Write | PASS (Audited) |
| `POST` | `api/v1/admin/products/{product}/deactivate` | `Admin\Controllers\AdminProductController@deactivate` | `admin` | Role: admin | Perm: products.update | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/projects` | `Admin\Controllers\AdminProjectController@index` | `admin` | Role: admin | Perm: projects.view | Read | PASS (Audited) |
| `POST` | `api/v1/admin/projects` | `Admin\Controllers\AdminProjectController@store` | `admin` | Role: admin | Perm: projects.manage | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/projects/{project}` | `Admin\Controllers\AdminProjectController@show` | `admin` | Role: admin | Perm: projects.view | Read | PASS (Audited) |
| `PATCH` | `api/v1/admin/projects/{project}` | `Admin\Controllers\AdminProjectController@update` | `admin` | Role: admin | Perm: projects.manage | Write | PASS (Audited) |
| `DELETE` | `api/v1/admin/projects/{project}` | `Admin\Controllers\AdminProjectController@destroy` | `admin` | Role: admin | Perm: projects.manage | Write | PASS (Audited) |
| `POST` | `api/v1/admin/projects/{project}/archive` | `Admin\Controllers\AdminProjectController@archive` | `admin` | Role: admin | Perm: projects.manage | Write | PASS (Audited) |
| `POST` | `api/v1/admin/projects/{project}/publish` | `Admin\Controllers\AdminProjectController@publish` | `admin` | Role: admin | Perm: projects.manage | Write | PASS (Audited) |
| `POST` | `api/v1/admin/projects/{project}/unpublish` | `Admin\Controllers\AdminProjectController@unpublish` | `admin` | Role: admin | Perm: projects.manage | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/provider-accounts` | `Admin\Controllers\AdminProviderAccountController@index` | `admin` | Role: admin | Perm: providers.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/provider-accounts/{providerAccount}` | `Admin\Controllers\AdminProviderAccountController@show` | `admin` | Role: admin | Perm: providers.view | Read | PASS (Audited) |
| `POST` | `api/v1/admin/provider-accounts/{providerAccount}/activate` | `Admin\Controllers\AdminProviderAccountController@activate` | `admin` | Role: admin | Perm: providers.suspend | Write | PASS (Audited) |
| `POST` | `api/v1/admin/provider-accounts/{providerAccount}/suspend` | `Admin\Controllers\AdminProviderAccountController@suspend` | `admin` | Role: admin | Perm: providers.suspend | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/provider/payouts` | `Admin\Controllers\AdminProviderPayoutController@index` | `admin` | Role: admin | Perm: payouts.view | Read | PASS (Audited) |
| `POST` | `api/v1/admin/provider/payouts/{providerPayout}/approve` | `Admin\Controllers\AdminProviderPayoutController@approve` | `admin` | Role: admin | Perm: payouts.approve | Write | PASS (Audited) |
| `POST` | `api/v1/admin/provider/payouts/{providerPayout}/mark-paid` | `Admin\Controllers\AdminProviderPayoutController@markPaid` | `admin` | Role: admin | Perm: payouts.process | Write | PASS (Audited) |
| `POST` | `api/v1/admin/provider/payouts/{providerPayout}/reject` | `Admin\Controllers\AdminProviderPayoutController@reject` | `admin` | Role: admin | Perm: payouts.approve | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/reports/summary` | `Admin\Controllers\AdminReportController@summary` | `admin` | Role: admin | Perm: panel.access | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/return-requests` | `Admin\Controllers\AdminReturnController@index` | `admin` | Role: admin | Perm: refunds.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/return-requests/{returnRequest}` | `Admin\Controllers\AdminReturnController@show` | `admin` | Role: admin | Perm: refunds.view | Read | PASS (Audited) |
| `POST` | `api/v1/admin/return-requests/{returnRequest}/approve` | `Admin\Controllers\AdminReturnController@approve` | `admin` | Role: admin | Perm: refunds.approve | Write | PASS (Audited) |
| `POST` | `api/v1/admin/return-requests/{returnRequest}/mark-inspected` | `Admin\Controllers\AdminReturnController@markInspected` | `admin` | Role: admin | Perm: refunds.approve | Write | PASS (Audited) |
| `POST` | `api/v1/admin/return-requests/{returnRequest}/mark-received` | `Admin\Controllers\AdminReturnController@markReceived` | `admin` | Role: admin | Perm: refunds.approve | Write | PASS (Audited) |
| `POST` | `api/v1/admin/return-requests/{returnRequest}/process-refund` | `Admin\Controllers\AdminReturnController@processRefund` | `admin` | Role: admin | Perm: refunds.approve | Write | PASS (Audited) |
| `POST` | `api/v1/admin/return-requests/{returnRequest}/reject` | `Admin\Controllers\AdminReturnController@reject` | `admin` | Role: admin | Perm: refunds.approve | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/reviews/products` | `Admin\Controllers\AdminReviewController@productReviews` | `admin` | Role: admin | Perm: reviews.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/reviews/providers` | `Admin\Controllers\AdminReviewController@providerReviews` | `admin` | Role: admin | Perm: reviews.view | Read | PASS (Audited) |
| `POST` | `api/v1/admin/reviews/providers/{providerReview}/hide` | `Admin\Controllers\AdminReviewController@hideProviderReview` | `admin` | Role: admin | Perm: reviews.moderate | Write | PASS (Audited) |
| `POST` | `api/v1/admin/reviews/providers/{providerReview}/unhide` | `Admin\Controllers\AdminReviewController@unhideProviderReview` | `admin` | Role: admin | Perm: reviews.moderate | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/reviews/stores` | `Admin\Controllers\AdminReviewController@storeReviews` | `admin` | Role: admin | Perm: reviews.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/roles` | `Admin\Controllers\AdminRoleController@index` | `admin` | Role: admin | Perm: roles.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/roles/{role}` | `Admin\Controllers\AdminRoleController@show` | `admin` | Role: admin | Perm: roles.view | Read | PASS (Audited) |
| `PUT` | `api/v1/admin/roles/{role}/permissions` | `Admin\Controllers\AdminRoleController@syncPermissions` | `admin` | Role: admin | Perm: roles.manage | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/service-bookings` | `Admin\Controllers\AdminServiceBookingController@index` | `admin` | Role: admin | Perm: bookings.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/service-bookings/{serviceBooking}` | `Admin\Controllers\AdminServiceBookingController@show` | `admin` | Role: admin | Perm: bookings.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/service-requests` | `Admin\Controllers\AdminServiceRequestController@index` | `admin` | Role: admin | Perm: service_requests.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/service-requests/{serviceRequest}` | `Admin\Controllers\AdminServiceRequestController@show` | `admin` | Role: admin | Perm: service_requests.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/session` | `Admin\Controllers\AdminSessionController@show` | `admin` | Role: admin | Perm: N/A | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/settings` | `Admin\Controllers\AdminSystemSettingController@index` | `admin` | Role: admin | Perm: settings.view | Read | PASS (Audited) |
| `PATCH` | `api/v1/admin/settings` | `Admin\Controllers\AdminSystemSettingController@update` | `admin` | Role: admin | Perm: settings.update | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/shipments` | `Admin\Controllers\AdminShipmentController@index` | `admin` | Role: admin | Perm: shipping.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/shipments/{shipment}` | `Admin\Controllers\AdminShipmentController@show` | `admin` | Role: admin | Perm: shipping.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/shipping/carriers` | `Admin\Controllers\AdminShippingConfigurationController@carriers` | `admin` | Role: admin | Perm: shipping.view | Read | PASS (Audited) |
| `POST` | `api/v1/admin/shipping/carriers` | `Admin\Controllers\AdminShippingConfigurationController@storeCarrier` | `admin` | Role: admin | Perm: shipping.manage | Write | PASS (Audited) |
| `PATCH` | `api/v1/admin/shipping/carriers/{carrier}` | `Admin\Controllers\AdminShippingConfigurationController@updateCarrier` | `admin` | Role: admin | Perm: shipping.manage | Write | PASS (Audited) |
| `DELETE` | `api/v1/admin/shipping/carriers/{carrier}` | `Admin\Controllers\AdminShippingConfigurationController@destroyCarrier` | `admin` | Role: admin | Perm: shipping.manage | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/shipping/methods` | `Admin\Controllers\AdminShippingConfigurationController@methods` | `admin` | Role: admin | Perm: shipping.view | Read | PASS (Audited) |
| `POST` | `api/v1/admin/shipping/methods` | `Admin\Controllers\AdminShippingConfigurationController@storeMethod` | `admin` | Role: admin | Perm: shipping.manage | Write | PASS (Audited) |
| `PATCH` | `api/v1/admin/shipping/methods/{method}` | `Admin\Controllers\AdminShippingConfigurationController@updateMethod` | `admin` | Role: admin | Perm: shipping.manage | Write | PASS (Audited) |
| `DELETE` | `api/v1/admin/shipping/methods/{method}` | `Admin\Controllers\AdminShippingConfigurationController@destroyMethod` | `admin` | Role: admin | Perm: shipping.manage | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/shipping/rate-rules` | `Admin\Controllers\AdminShippingConfigurationController@rateRules` | `admin` | Role: admin | Perm: shipping.view | Read | PASS (Audited) |
| `POST` | `api/v1/admin/shipping/rate-rules` | `Admin\Controllers\AdminShippingConfigurationController@storeRateRule` | `admin` | Role: admin | Perm: shipping.manage | Write | PASS (Audited) |
| `PATCH` | `api/v1/admin/shipping/rate-rules/{rateRule}` | `Admin\Controllers\AdminShippingConfigurationController@updateRateRule` | `admin` | Role: admin | Perm: shipping.manage | Write | PASS (Audited) |
| `DELETE` | `api/v1/admin/shipping/rate-rules/{rateRule}` | `Admin\Controllers\AdminShippingConfigurationController@destroyRateRule` | `admin` | Role: admin | Perm: shipping.manage | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/shipping/vendor-profiles` | `Admin\Controllers\AdminShippingConfigurationController@vendorProfiles` | `admin` | Role: admin | Perm: shipping.view | Read | PASS (Audited) |
| `POST` | `api/v1/admin/shipping/vendor-profiles` | `Admin\Controllers\AdminShippingConfigurationController@storeVendorProfile` | `admin` | Role: admin | Perm: shipping.manage | Write | PASS (Audited) |
| `PATCH` | `api/v1/admin/shipping/vendor-profiles/{profile}` | `Admin\Controllers\AdminShippingConfigurationController@updateVendorProfile` | `admin` | Role: admin | Perm: shipping.manage | Write | PASS (Audited) |
| `DELETE` | `api/v1/admin/shipping/vendor-profiles/{profile}` | `Admin\Controllers\AdminShippingConfigurationController@destroyVendorProfile` | `admin` | Role: admin | Perm: shipping.manage | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/shipping/zones` | `Admin\Controllers\AdminShippingConfigurationController@zones` | `admin` | Role: admin | Perm: shipping.view | Read | PASS (Audited) |
| `POST` | `api/v1/admin/shipping/zones` | `Admin\Controllers\AdminShippingConfigurationController@storeZone` | `admin` | Role: admin | Perm: shipping.manage | Write | PASS (Audited) |
| `PATCH` | `api/v1/admin/shipping/zones/{zone}` | `Admin\Controllers\AdminShippingConfigurationController@updateZone` | `admin` | Role: admin | Perm: shipping.manage | Write | PASS (Audited) |
| `DELETE` | `api/v1/admin/shipping/zones/{zone}` | `Admin\Controllers\AdminShippingConfigurationController@destroyZone` | `admin` | Role: admin | Perm: shipping.manage | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/system/health` | `Admin\Controllers\AdminOperationalHealthController@show` | `admin` | Role: admin | Perm: system.health.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/transactions` | `Admin\Controllers\AdminFinancialTransactionController@index` | `admin` | Role: admin | Perm: balances.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/transactions/{transaction}` | `Admin\Controllers\AdminFinancialTransactionController@show` | `admin` | Role: admin | Perm: balances.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/users` | `Admin\Controllers\AdminUserController@index` | `admin` | Role: admin | Perm: users.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/users/{user}` | `Admin\Controllers\AdminUserController@show` | `admin` | Role: admin | Perm: users.view | Read | PASS (Audited) |
| `POST` | `api/v1/admin/users/{user}/activate` | `Admin\Controllers\AdminUserController@activate` | `admin` | Role: admin | Perm: users.update | Write | PASS (Audited) |
| `POST` | `api/v1/admin/users/{user}/suspend` | `Admin\Controllers\AdminUserController@suspend` | `admin` | Role: admin | Perm: users.suspend | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/vendor-accounts` | `Admin\Controllers\AdminVendorAccountController@index` | `admin` | Role: admin | Perm: vendors.view | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/admin/vendor-accounts/{vendorAccount}` | `Admin\Controllers\AdminVendorAccountController@show` | `admin` | Role: admin | Perm: vendors.view | Read | PASS (Audited) |
| `POST` | `api/v1/admin/vendor-accounts/{vendorAccount}/activate` | `Admin\Controllers\AdminVendorAccountController@activate` | `admin` | Role: admin | Perm: vendors.suspend | Write | PASS (Audited) |
| `POST` | `api/v1/admin/vendor-accounts/{vendorAccount}/suspend` | `Admin\Controllers\AdminVendorAccountController@suspend` | `admin` | Role: admin | Perm: vendors.suspend | Write | PASS (Audited) |

### 2.AuthenticationIdentity Authentication & Identity (14 routes)

| Method | URI | Controller Action | Guard | Required Role / Permission | R/W | Audit Status |
|---|---|---|---|---|:---:|:---:|
| `POST` | `api/v1/auth/forgot-password` | `Identity\Controllers\AuthController@forgotPassword` | _public_ | - | Write | PASS (Audited) |
| `POST` | `api/v1/auth/login` | `Identity\Controllers\AuthController@login` | _public_ | - | Write | PASS (Audited) |
| `POST` | `api/v1/auth/logout` | `Identity\Controllers\AuthController@logout` | `sanctum` | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/auth/me` | `Identity\Controllers\AuthController@me` | `sanctum` | - | Read | PASS (Audited) |
| `POST` | `api/v1/auth/register` | `Identity\Controllers\AuthController@register` | _public_ | - | Write | PASS (Audited) |
| `POST` | `api/v1/auth/resend-email-otp` | `Identity\Controllers\AuthController@resendEmailOtp` | _public_ | - | Write | PASS (Audited) |
| `POST` | `api/v1/auth/resend-otp` | `Identity\Controllers\AuthController@resendOtp` | _public_ | - | Write | PASS (Audited) |
| `POST` | `api/v1/auth/resend-two-factor` | `Identity\Controllers\AuthController@resendTwoFactor` | _public_ | - | Write | PASS (Audited) |
| `POST` | `api/v1/auth/reset-password` | `Identity\Controllers\AuthController@resetPassword` | _public_ | - | Write | PASS (Audited) |
| `POST` | `api/v1/auth/verify-email-otp` | `Identity\Controllers\AuthController@verifyEmailOtp` | _public_ | - | Write | PASS (Audited) |
| `POST` | `api/v1/auth/verify-otp` | `Identity\Controllers\AuthController@verifyOtp` | _public_ | - | Write | PASS (Audited) |
| `POST` | `api/v1/auth/verify-password-reset-otp` | `Identity\Controllers\AuthController@verifyPasswordResetOtp` | _public_ | - | Write | PASS (Audited) |
| `POST` | `api/v1/auth/verify-two-factor` | `Identity\Controllers\AuthController@verifyTwoFactor` | _public_ | - | Write | PASS (Audited) |
| `GET|HEAD` | `sanctum/csrf-cookie` | `Closure` | _public_ | - | Read | PASS (Audited) |

### 2.CartBasket Cart & Basket (7 routes)

| Method | URI | Controller Action | Guard | Required Role / Permission | R/W | Audit Status |
|---|---|---|---|---|:---:|:---:|
| `GET|HEAD` | `api/v1/cart` | `Cart\Controllers\CartController@show` | _public_ | - | Read | PASS (Audited) |
| `DELETE` | `api/v1/cart` | `Cart\Controllers\CartController@clear` | _public_ | - | Write | PASS (Audited) |
| `POST` | `api/v1/cart/items` | `Cart\Controllers\CartController@storeItem` | _public_ | - | Write | PASS (Audited) |
| `PATCH` | `api/v1/cart/items/{item}` | `Cart\Controllers\CartController@updateItem` | _public_ | - | Write | PASS (Audited) |
| `DELETE` | `api/v1/cart/items/{item}` | `Cart\Controllers\CartController@destroyItem` | _public_ | - | Write | PASS (Audited) |
| `POST` | `api/v1/cart/merge` | `Cart\Controllers\CartController@merge` | `sanctum` | - | Write | PASS (Audited) |
| `POST` | `api/v1/cart/validate` | `Cart\Controllers\CartController@validateCart` | _public_ | - | Write | PASS (Audited) |

### 2.CatalogProductsCategories Catalog, Products & Categories (17 routes)

| Method | URI | Controller Action | Guard | Required Role / Permission | R/W | Audit Status |
|---|---|---|---|---|:---:|:---:|
| `GET|HEAD` | `api/v1/catalog/search` | `Search\Controllers\CatalogSearchController` | _public_ | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/catalog/search/filter-suggestions` | `Search\Controllers\FilterSuggestionsController` | _public_ | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/catalog/search/suggestions` | `Search\Controllers\CatalogSearchSuggestionsController` | _public_ | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/categories` | `Catalog\Controllers\CategoryController@index` | _public_ | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/categories/{slug}` | `Catalog\Controllers\CategoryController@show` | _public_ | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/categories/{slug}/items` | `Catalog\Controllers\CategoryController@items` | _public_ | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/products` | `Catalog\Controllers\ProductController@index` | _public_ | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/products/{id}` | `Catalog\Controllers\ProductController@show` | _public_ | - | Read | PASS (Audited) |
| `POST` | `api/v1/products/{id}/like` | `Catalog\Controllers\ProductEngagementController@toggleLike` | `sanctum` | - | Write | PASS (Audited) |
| `POST` | `api/v1/products/{id}/preorder` | `Catalog\Controllers\ProductPreorderController@store` | `sanctum` | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/products/{id}/preorder` | `Catalog\Controllers\ProductPreorderController@status` | `sanctum` | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/products/{id}/reviews` | `Catalog\Controllers\ProductEngagementController@reviews` | _public_ | - | Read | PASS (Audited) |
| `POST` | `api/v1/products/{id}/reviews` | `Catalog\Controllers\ProductEngagementController@storeReview` | `sanctum` | - | Write | PASS (Audited) |
| `PATCH` | `api/v1/products/{id}/reviews` | `Catalog\Controllers\ProductEngagementController@updateReview` | `sanctum` | - | Write | PASS (Audited) |
| `DELETE` | `api/v1/products/{id}/reviews` | `Catalog\Controllers\ProductEngagementController@destroyReview` | `sanctum` | - | Write | PASS (Audited) |
| `POST` | `api/v1/products/{id}/wishlist` | `Catalog\Controllers\ProductEngagementController@toggleWishlist` | `sanctum` | - | Write | PASS (Audited) |
| `POST` | `api/v1/products/{product}/try-in-room` | `TryInRoom\Controllers\TryInRoomController@storeForProduct` | `sanctum` | - | Write | PASS (Audited) |

### 2.CheckoutOrdersReturns Checkout, Orders & Returns (15 routes)

| Method | URI | Controller Action | Guard | Required Role / Permission | R/W | Audit Status |
|---|---|---|---|---|:---:|:---:|
| `POST` | `api/v1/checkout/preview` | `Checkout\Controllers\CheckoutController@preview` | `sanctum` | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/orders` | `Orders\Controllers\OrderController@index` | `sanctum` | - | Read | PASS (Audited) |
| `POST` | `api/v1/orders` | `Orders\Controllers\OrderController@store` | `sanctum` | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/orders/{order}` | `Orders\Controllers\OrderController@show` | `sanctum` | - | Read | PASS (Audited) |
| `POST` | `api/v1/orders/{order}/cancel` | `Orders\Controllers\OrderController@cancel` | `sanctum` | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/orders/{order}/payment` | `Payments\Controllers\PaymentController@show` | `sanctum` | - | Read | PASS (Audited) |
| `POST` | `api/v1/orders/{order}/payment` | `Payments\Controllers\PaymentController@initiate` | `sanctum` | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/orders/{order}/payment/callback` | `Payments\Controllers\PaymentController@callback` | `sanctum` | - | Read | PASS (Audited) |
| `POST` | `api/v1/orders/{order}/payment/simulate` | `Payments\Controllers\PaymentController@simulate` | `sanctum` | - | Write | PASS (Audited) |
| `POST` | `api/v1/orders/{order}/payment/submit` | `Payments\Controllers\PaymentController@submit` | `sanctum` | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/orders/{order}/store-review-eligibility` | `Reviews\Controllers\OrderStoreReviewController@eligibility` | `sanctum` | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/returns` | `Returns\Controllers\ReturnController@index` | `sanctum` | - | Read | PASS (Audited) |
| `POST` | `api/v1/returns` | `Returns\Controllers\ReturnController@store` | `sanctum` | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/returns/{returnRequest}` | `Returns\Controllers\ReturnController@show` | `sanctum` | - | Read | PASS (Audited) |
| `POST` | `api/v1/returns/{returnRequest}/evidence` | `Returns\Controllers\ReturnController@storeEvidence` | `sanctum` | - | Write | PASS (Audited) |

### 2.CommunicationsWebSockets Communications & WebSockets (1 routes)

| Method | URI | Controller Action | Guard | Required Role / Permission | R/W | Audit Status |
|---|---|---|---|---|:---:|:---:|
| `GET|POST|HEAD` | `broadcasting/auth` | `Illuminate\Broadcasting\BroadcastController@authenticate` | `sanctum` | - | Write | PASS (Audited) |

### 2.ContentFAQReviews Content, FAQ & Reviews (5 routes)

| Method | URI | Controller Action | Guard | Required Role / Permission | R/W | Audit Status |
|---|---|---|---|---|:---:|:---:|
| `GET|HEAD` | `api/v1/blog/articles` | `Blog\Controllers\BlogArticleController@index` | _public_ | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/blog/articles/{slug}` | `Blog\Controllers\BlogArticleController@show` | _public_ | - | Read | PASS (Audited) |
| `POST` | `api/v1/blog/articles/{slug}/wishlist` | `Blog\Controllers\BlogEngagementController@toggleWishlist` | `sanctum` | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/blog/categories` | `Blog\Controllers\BlogCategoryController@index` | _public_ | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/blog/tags/{slug}` | `Blog\Controllers\BlogTagController@show` | _public_ | - | Read | PASS (Audited) |

### 2.CustomerProfileAddresses Customer Profile & Addresses (53 routes)

| Method | URI | Controller Action | Guard | Required Role / Permission | R/W | Audit Status |
|---|---|---|---|---|:---:|:---:|
| `GET|HEAD` | `api/v1/profile` | `Identity\Controllers\ProfileController@show` | `sanctum` | - | Read | PASS (Audited) |
| `PATCH` | `api/v1/profile` | `Identity\Controllers\ProfileController@update` | `sanctum` | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/profile/addresses` | `Identity\Controllers\AddressController@index` | `sanctum` | - | Read | PASS (Audited) |
| `POST` | `api/v1/profile/addresses` | `Identity\Controllers\AddressController@store` | `sanctum` | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/profile/addresses/{address}` | `Identity\Controllers\AddressController@show` | `sanctum` | - | Read | PASS (Audited) |
| `PATCH` | `api/v1/profile/addresses/{address}` | `Identity\Controllers\AddressController@update` | `sanctum` | - | Write | PASS (Audited) |
| `DELETE` | `api/v1/profile/addresses/{address}` | `Identity\Controllers\AddressController@destroy` | `sanctum` | - | Write | PASS (Audited) |
| `POST` | `api/v1/profile/addresses/{address}/default` | `Identity\Controllers\AddressController@setDefault` | `sanctum` | - | Write | PASS (Audited) |
| `POST` | `api/v1/profile/avatar` | `Identity\Controllers\ProfileController@uploadAvatar` | `sanctum` | - | Write | PASS (Audited) |
| `DELETE` | `api/v1/profile/avatar` | `Identity\Controllers\ProfileController@deleteAvatar` | `sanctum` | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/profile/chat/report-reasons` | `Chat\Controllers\MessageController@reportReasons` | `sanctum` | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/profile/conversations` | `Chat\Controllers\ConversationController@index` | `sanctum` | - | Read | PASS (Audited) |
| `POST` | `api/v1/profile/conversations` | `Chat\Controllers\ConversationController@store` | `sanctum` | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/profile/conversations/unread-count` | `Chat\Controllers\ConversationController@unreadCount` | `sanctum` | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/profile/conversations/{conversationId}/attachments/{attachmentId}` | `Chat\Controllers\AttachmentController@show` | `sanctum` | - | Read | PASS (Audited) |
| `PATCH` | `api/v1/profile/conversations/{conversationId}/messages/{messageId}` | `Chat\Controllers\MessageController@update` | `sanctum` | - | Write | PASS (Audited) |
| `DELETE` | `api/v1/profile/conversations/{conversationId}/messages/{messageId}` | `Chat\Controllers\MessageController@destroy` | `sanctum` | - | Write | PASS (Audited) |
| `POST` | `api/v1/profile/conversations/{conversationId}/messages/{messageId}/report` | `Chat\Controllers\MessageController@report` | `sanctum` | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/profile/conversations/{id}` | `Chat\Controllers\ConversationController@show` | `sanctum` | - | Read | PASS (Audited) |
| `DELETE` | `api/v1/profile/conversations/{id}` | `Chat\Controllers\ConversationController@destroy` | `sanctum` | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/profile/conversations/{id}/messages` | `Chat\Controllers\MessageController@index` | `sanctum` | - | Read | PASS (Audited) |
| `POST` | `api/v1/profile/conversations/{id}/messages` | `Chat\Controllers\MessageController@store` | `sanctum` | - | Write | PASS (Audited) |
| `PATCH` | `api/v1/profile/conversations/{id}/read` | `Chat\Controllers\ConversationController@markRead` | `sanctum` | - | Write | PASS (Audited) |
| `POST` | `api/v1/profile/conversations/{id}/typing` | `Chat\Controllers\ConversationController@typing` | `sanctum` | - | Write | PASS (Audited) |
| `POST` | `api/v1/profile/email/request-verification` | `Identity\Controllers\ProfileController@requestEmailVerification` | `sanctum` | - | Write | PASS (Audited) |
| `POST` | `api/v1/profile/email/resend-verification` | `Identity\Controllers\ProfileController@resendEmailVerification` | `sanctum` | - | Write | PASS (Audited) |
| `POST` | `api/v1/profile/email/verify` | `Identity\Controllers\ProfileController@verifyEmailVerification` | `sanctum` | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/profile/notification-preferences` | `Notifications\Controllers\NotificationPreferenceController@show` | `sanctum` | - | Read | PASS (Audited) |
| `PATCH` | `api/v1/profile/notification-preferences` | `Notifications\Controllers\NotificationPreferenceController@update` | `sanctum` | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/profile/notifications` | `Notifications\Controllers\NotificationController@index` | `sanctum` | - | Read | PASS (Audited) |
| `DELETE` | `api/v1/profile/notifications` | `Notifications\Controllers\NotificationController@destroyAll` | `sanctum` | - | Write | PASS (Audited) |
| `POST` | `api/v1/profile/notifications/devices` | `Notifications\Controllers\NotificationController@registerDevice` | `sanctum` | - | Write | PASS (Audited) |
| `PATCH` | `api/v1/profile/notifications/read-all` | `Notifications\Controllers\NotificationController@markAllRead` | `sanctum` | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/profile/notifications/unread-count` | `Notifications\Controllers\NotificationController@unreadCount` | `sanctum` | - | Read | PASS (Audited) |
| `DELETE` | `api/v1/profile/notifications/{notification}` | `Notifications\Controllers\NotificationController@destroy` | `sanctum` | - | Write | PASS (Audited) |
| `PATCH` | `api/v1/profile/notifications/{notification}/read` | `Notifications\Controllers\NotificationController@markRead` | `sanctum` | - | Write | PASS (Audited) |
| `PATCH` | `api/v1/profile/password` | `Identity\Controllers\ProfileController@updatePassword` | `sanctum` | - | Write | PASS (Audited) |
| `POST` | `api/v1/profile/phone/request-change` | `Identity\Controllers\ProfileController@requestPhoneChange` | `sanctum` | - | Write | PASS (Audited) |
| `POST` | `api/v1/profile/phone/resend-change` | `Identity\Controllers\ProfileController@resendPhoneChange` | `sanctum` | - | Write | PASS (Audited) |
| `POST` | `api/v1/profile/phone/verify-change` | `Identity\Controllers\ProfileController@verifyPhoneChange` | `sanctum` | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/profile/reviews` | `Reviews\Controllers\CustomerReviewController@index` | `sanctum` | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/profile/reviews/{type}/{id}` | `Reviews\Controllers\CustomerReviewController@show` | `sanctum` | - | Read | PASS (Audited) |
| `DELETE` | `api/v1/profile/security/devices/{fingerprint}` | `Identity\Controllers\ProfileSecuritySessionController@revokeDevice` | `sanctum` | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/profile/security/sessions` | `Identity\Controllers\ProfileSecuritySessionController@index` | `sanctum` | - | Read | PASS (Audited) |
| `POST` | `api/v1/profile/security/sessions/logout-others` | `Identity\Controllers\ProfileSecuritySessionController@logoutOthers` | `sanctum` | - | Write | PASS (Audited) |
| `DELETE` | `api/v1/profile/security/sessions/{session}` | `Identity\Controllers\ProfileSecuritySessionController@destroy` | `sanctum` | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/profile/security/two-factor` | `Identity\Controllers\ProfileTwoFactorController@show` | `sanctum` | - | Read | PASS (Audited) |
| `POST` | `api/v1/profile/security/two-factor/confirm` | `Identity\Controllers\ProfileTwoFactorController@confirm` | `sanctum` | - | Write | PASS (Audited) |
| `POST` | `api/v1/profile/security/two-factor/disable` | `Identity\Controllers\ProfileTwoFactorController@disable` | `sanctum` | - | Write | PASS (Audited) |
| `POST` | `api/v1/profile/security/two-factor/enable` | `Identity\Controllers\ProfileTwoFactorController@enable` | `sanctum` | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/profile/wishlist` | `Identity\Controllers\WishlistController@index` | `sanctum` | - | Read | PASS (Audited) |
| `DELETE` | `api/v1/profile/wishlist` | `Identity\Controllers\WishlistController@clear` | `sanctum` | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/profile/wishlist/summary` | `Identity\Controllers\WishlistController@summary` | `sanctum` | - | Read | PASS (Audited) |

### 2.SearchDiscovery Search & Discovery (2 routes)

| Method | URI | Controller Action | Guard | Required Role / Permission | R/W | Audit Status |
|---|---|---|---|---|:---:|:---:|
| `GET|HEAD` | `api/v1/search` | `Search\Controllers\CatalogSearchController` | _public_ | - | Read | PASS (Audited) |
| `POST` | `api/v1/search/visual` | `VisualSearch\Controllers\VisualSearchController` | _public_ | - | Write | PASS (Audited) |

### 2.ServicesServiceProviders Services & Service Providers (6 routes)

| Method | URI | Controller Action | Guard | Required Role / Permission | R/W | Audit Status |
|---|---|---|---|---|:---:|:---:|
| `GET|HEAD` | `api/v1/services` | `ServicesMarketplace\Controllers\ServiceController@index` | _public_ | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/services/{identifier}` | `ServicesMarketplace\Controllers\ServiceController@show` | _public_ | - | Read | PASS (Audited) |
| `POST` | `api/v1/services/{identifier}/booking-preview` | `ServicesMarketplace\Controllers\DirectServiceBookingController@preview` | `sanctum` | - | Write | PASS (Audited) |
| `POST` | `api/v1/services/{identifier}/direct-booking` | `ServicesMarketplace\Controllers\DirectServiceBookingController@store` | `sanctum` | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/services/{identifier}/related` | `ServicesMarketplace\Controllers\ServiceController@related` | _public_ | - | Read | PASS (Audited) |
| `POST` | `api/v1/services/{identifier}/wishlist` | `ServicesMarketplace\Controllers\ServiceEngagementController@toggleWishlist` | `sanctum` | - | Write | PASS (Audited) |

### 2.SystemUtility System & Utility (212 routes)

| Method | URI | Controller Action | Guard | Required Role / Permission | R/W | Audit Status |
|---|---|---|---|---|:---:|:---:|
| `GET|HEAD` | `/` | `Closure` | _public_ | - | Read | PASS (Audited) |
| `POST` | `api/v1/affiliate/referrals/click` | `Affiliate\Controllers\AffiliateReferralController@trackClick` | _public_ | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/affiliate/referrals/resolve` | `Affiliate\Controllers\AffiliateReferralController@resolve` | _public_ | - | Read | PASS (Audited) |
| `POST` | `api/v1/assistant/chat` | `Assistant\Controllers\AssistantChatController` | _public_ | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/b2b/categories` | `B2b\Controllers\B2bCompanyController@categories` | _public_ | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/b2b/companies` | `B2b\Controllers\B2bCompanyController@index` | _public_ | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/b2b/companies/{slug}` | `B2b\Controllers\B2bCompanyController@show` | _public_ | - | Read | PASS (Audited) |
| `POST` | `api/v1/b2b/companies/{slug}/leads` | `B2b\Controllers\B2bLeadController@store` | `sanctum` | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/b2b/companies/{slug}/reviews` | `B2b\Controllers\B2bCompanyReviewController@index` | _public_ | - | Read | PASS (Audited) |
| `POST` | `api/v1/b2b/companies/{slug}/reviews` | `B2b\Controllers\B2bCompanyReviewController@store` | `sanctum` | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/b2b/leads` | `B2b\Controllers\B2bLeadController@index` | `sanctum` | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/b2b/leads/{lead}` | `B2b\Controllers\B2bLeadController@show` | `sanctum` | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/affiliate` | `Affiliate\Controllers\AffiliateDashboardController@overview` | `sanctum` | Role: marketer | Perm: N/A | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/affiliate/finance/transactions` | `Affiliate\Controllers\AffiliatePayoutController@transactions` | `sanctum` | Role: marketer | Perm: N/A | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/affiliate/links` | `Affiliate\Controllers\AffiliateLinkController@index` | `sanctum` | Role: marketer | Perm: N/A | Read | PASS (Audited) |
| `POST` | `api/v1/dashboard/affiliate/links` | `Affiliate\Controllers\AffiliateLinkController@store` | `sanctum` | Role: marketer | Perm: N/A | Write | PASS (Audited) |
| `POST` | `api/v1/dashboard/affiliate/links/{link}/deactivate` | `Affiliate\Controllers\AffiliateLinkController@deactivate` | `sanctum` | Role: marketer | Perm: N/A | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/affiliate/payouts` | `Affiliate\Controllers\AffiliatePayoutController@index` | `sanctum` | Role: marketer | Perm: N/A | Read | PASS (Audited) |
| `POST` | `api/v1/dashboard/affiliate/payouts` | `Affiliate\Controllers\AffiliatePayoutController@store` | `sanctum` | Role: marketer | Perm: N/A | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/affiliate/platform-config` | `Affiliate\Controllers\AffiliatePlatformConfigController@show` | `sanctum` | Role: marketer | Perm: N/A | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/affiliate/products` | `Affiliate\Controllers\AffiliateProductController@index` | `sanctum` | Role: marketer | Perm: N/A | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/affiliate/reports` | `Affiliate\Controllers\AffiliateReportController@index` | `sanctum` | Role: marketer | Perm: N/A | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/affiliate/settings` | `Affiliate\Controllers\AffiliateSettingsController@show` | `sanctum` | Role: marketer | Perm: N/A | Read | PASS (Audited) |
| `PATCH` | `api/v1/dashboard/affiliate/settings` | `Affiliate\Controllers\AffiliateSettingsController@update` | `sanctum` | Role: marketer | Perm: N/A | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/provider/analytics/bookings` | `ServicesMarketplace\Controllers\ProviderAnalyticsController@bookings` | `sanctum` | Role: provider | Perm: N/A | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/provider/analytics/export` | `ServicesMarketplace\Controllers\ProviderAnalyticsController@export` | `sanctum` | Role: provider | Perm: N/A | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/provider/analytics/overview` | `ServicesMarketplace\Controllers\ProviderAnalyticsController@overview` | `sanctum` | Role: provider | Perm: N/A | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/provider/analytics/services` | `ServicesMarketplace\Controllers\ProviderAnalyticsController@services` | `sanctum` | Role: provider | Perm: N/A | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/provider/b2b/categories` | `B2b\Controllers\PartnerB2bCompanyController@categoriesProvider` | `sanctum` | Role: provider | Perm: N/A | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/provider/b2b/company` | `B2b\Controllers\PartnerB2bCompanyController@showProvider` | `sanctum` | Role: provider | Perm: N/A | Read | PASS (Audited) |
| `POST` | `api/v1/dashboard/provider/b2b/company` | `B2b\Controllers\PartnerB2bCompanyController@storeProvider` | `sanctum` | Role: provider | Perm: N/A | Write | PASS (Audited) |
| `PATCH` | `api/v1/dashboard/provider/b2b/company` | `B2b\Controllers\PartnerB2bCompanyController@updateProvider` | `sanctum` | Role: provider | Perm: N/A | Write | PASS (Audited) |
| `POST` | `api/v1/dashboard/provider/b2b/company/media` | `B2b\Controllers\PartnerB2bCompanyController@uploadProviderImage` | `sanctum` | Role: provider | Perm: N/A | Write | PASS (Audited) |
| `POST` | `api/v1/dashboard/provider/b2b/company/portfolio` | `B2b\Controllers\PartnerB2bCompanyController@uploadProviderPortfolio` | `sanctum` | Role: provider | Perm: N/A | Write | PASS (Audited) |
| `DELETE` | `api/v1/dashboard/provider/b2b/company/portfolio/{image}` | `B2b\Controllers\PartnerB2bCompanyController@deleteProviderPortfolio` | `sanctum` | Role: provider | Perm: N/A | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/provider/b2b/leads` | `B2b\Controllers\PartnerB2bLeadController@indexProvider` | `sanctum` | Role: provider | Perm: N/A | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/provider/b2b/leads/{lead}` | `B2b\Controllers\PartnerB2bLeadController@showProvider` | `sanctum` | Role: provider | Perm: N/A | Read | PASS (Audited) |
| `PATCH` | `api/v1/dashboard/provider/b2b/leads/{lead}` | `B2b\Controllers\PartnerB2bLeadController@updateProvider` | `sanctum` | Role: provider | Perm: N/A | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/provider/b2b/reviews` | `B2b\Controllers\PartnerB2bReviewController@indexProvider` | `sanctum` | Role: provider | Perm: N/A | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/provider/b2b/tags` | `B2b\Controllers\PartnerB2bCompanyController@tagsProvider` | `sanctum` | Role: provider | Perm: N/A | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/provider/bookings` | `ServicesMarketplace\Controllers\ServiceBookingController@providerIndex` | `sanctum` | Role: provider | Perm: N/A | Read | PASS (Audited) |
| `POST` | `api/v1/dashboard/provider/bookings/{serviceBooking}/cancel` | `ServicesMarketplace\Controllers\ServiceBookingController@cancel` | `sanctum` | Role: provider | Perm: N/A | Write | PASS (Audited) |
| `POST` | `api/v1/dashboard/provider/bookings/{serviceBooking}/complete` | `ServicesMarketplace\Controllers\ServiceBookingController@complete` | `sanctum` | Role: provider | Perm: N/A | Write | PASS (Audited) |
| `POST` | `api/v1/dashboard/provider/bookings/{serviceBooking}/confirm` | `ServicesMarketplace\Controllers\ServiceBookingController@confirm` | `sanctum` | Role: provider | Perm: N/A | Write | PASS (Audited) |
| `POST` | `api/v1/dashboard/provider/bookings/{serviceBooking}/propose-schedule` | `ServicesMarketplace\Controllers\ServiceBookingController@proposeSchedule` | `sanctum` | Role: provider | Perm: N/A | Write | PASS (Audited) |
| `POST` | `api/v1/dashboard/provider/bookings/{serviceBooking}/start` | `ServicesMarketplace\Controllers\ServiceBookingController@start` | `sanctum` | Role: provider | Perm: N/A | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/provider/finance/analytics` | `ServicesMarketplace\Controllers\ProviderFinanceController@analytics` | `sanctum` | Role: provider | Perm: N/A | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/provider/finance/export` | `ServicesMarketplace\Controllers\ProviderFinanceController@exportReport` | `sanctum` | Role: provider | Perm: N/A | Read | PASS (Audited) |
| `POST` | `api/v1/dashboard/provider/finance/payouts` | `ServicesMarketplace\Controllers\ProviderFinanceController@requestPayout` | `sanctum` | Role: provider | Perm: N/A | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/provider/finance/summary` | `ServicesMarketplace\Controllers\ProviderFinanceController@summary` | `sanctum` | Role: provider | Perm: N/A | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/provider/finance/transactions` | `ServicesMarketplace\Controllers\ProviderFinanceController@transactions` | `sanctum` | Role: provider | Perm: N/A | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/provider/reviews` | `ServicesMarketplace\Controllers\ProviderReviewController@providerInbox` | `sanctum` | Role: provider | Perm: N/A | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/provider/service-requests` | `ServicesMarketplace\Controllers\ServiceOfferController@providerInbox` | `sanctum` | Role: provider | Perm: N/A | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/provider/service-requests/{serviceRequest}` | `ServicesMarketplace\Controllers\ServiceOfferController@providerShow` | `sanctum` | Role: provider | Perm: N/A | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/provider/services` | `ServicesMarketplace\Controllers\ProviderController@ownServices` | `sanctum` | Role: provider | Perm: N/A | Read | PASS (Audited) |
| `POST` | `api/v1/dashboard/provider/services` | `ServicesMarketplace\Controllers\ProviderController@storeService` | `sanctum` | Role: provider | Perm: N/A | Write | PASS (Audited) |
| `PATCH` | `api/v1/dashboard/provider/services/{service}` | `ServicesMarketplace\Controllers\ProviderController@updateService` | `sanctum` | Role: provider | Perm: N/A | Write | PASS (Audited) |
| `DELETE` | `api/v1/dashboard/provider/services/{service}` | `ServicesMarketplace\Controllers\ProviderController@destroyService` | `sanctum` | Role: provider | Perm: N/A | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/provider/settings` | `ServicesMarketplace\Controllers\ProviderSettingsController@show` | `sanctum` | Role: provider | Perm: N/A | Read | PASS (Audited) |
| `PATCH` | `api/v1/dashboard/provider/settings/account` | `ServicesMarketplace\Controllers\ProviderSettingsController@updateAccount` | `sanctum` | Role: provider | Perm: N/A | Write | PASS (Audited) |
| `POST` | `api/v1/dashboard/provider/settings/avatar` | `ServicesMarketplace\Controllers\ProviderSettingsController@uploadAvatar` | `sanctum` | Role: provider | Perm: N/A | Write | PASS (Audited) |
| `DELETE` | `api/v1/dashboard/provider/settings/avatar` | `ServicesMarketplace\Controllers\ProviderSettingsController@deleteAvatar` | `sanctum` | Role: provider | Perm: N/A | Write | PASS (Audited) |
| `PATCH` | `api/v1/dashboard/provider/settings/bank-account` | `ServicesMarketplace\Controllers\ProviderSettingsController@updateBankAccount` | `sanctum` | Role: provider | Perm: N/A | Write | PASS (Audited) |
| `PATCH` | `api/v1/dashboard/provider/settings/notifications` | `ServicesMarketplace\Controllers\ProviderSettingsController@updateNotifications` | `sanctum` | Role: provider | Perm: N/A | Write | PASS (Audited) |
| `PATCH` | `api/v1/dashboard/provider/settings/password` | `ServicesMarketplace\Controllers\ProviderSettingsController@updatePassword` | `sanctum` | Role: provider | Perm: N/A | Write | PASS (Audited) |
| `PATCH` | `api/v1/dashboard/provider/settings/profile` | `ServicesMarketplace\Controllers\ProviderSettingsController@updateProfile` | `sanctum` | Role: provider | Perm: N/A | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/provider/settings/work-policy` | `ServicesMarketplace\Controllers\ProviderWorkPolicyController@show` | `sanctum` | Role: provider | Perm: N/A | Read | PASS (Audited) |
| `PUT` | `api/v1/dashboard/provider/settings/work-policy` | `ServicesMarketplace\Controllers\ProviderWorkPolicyController@update` | `sanctum` | Role: provider | Perm: N/A | Write | PASS (Audited) |
| `PUT` | `api/v1/dashboard/provider/settings/working-hours` | `ServicesMarketplace\Controllers\ProviderSettingsController@updateWorkingHours` | `sanctum` | Role: provider | Perm: N/A | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/vendor/access` | `Vendors\Controllers\VendorTeamController@access` | `sanctum` | Role: vendor | Perm: N/A | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/vendor/analytics/export` | `Vendors\Controllers\VendorAnalyticsController@export` | `sanctum` | Role: vendor | Perm: N/A | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/vendor/analytics/overview` | `Vendors\Controllers\VendorAnalyticsController@overview` | `sanctum` | Role: vendor | Perm: N/A | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/vendor/analytics/products` | `Vendors\Controllers\VendorAnalyticsController@products` | `sanctum` | Role: vendor | Perm: N/A | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/vendor/analytics/sales` | `Vendors\Controllers\VendorAnalyticsController@sales` | `sanctum` | Role: vendor | Perm: N/A | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/vendor/b2b/categories` | `B2b\Controllers\PartnerB2bCompanyController@categoriesVendor` | `sanctum` | Role: vendor | Perm: N/A | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/vendor/b2b/company` | `B2b\Controllers\PartnerB2bCompanyController@showVendor` | `sanctum` | Role: vendor | Perm: N/A | Read | PASS (Audited) |
| `POST` | `api/v1/dashboard/vendor/b2b/company` | `B2b\Controllers\PartnerB2bCompanyController@storeVendor` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `PATCH` | `api/v1/dashboard/vendor/b2b/company` | `B2b\Controllers\PartnerB2bCompanyController@updateVendor` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `POST` | `api/v1/dashboard/vendor/b2b/company/media` | `B2b\Controllers\PartnerB2bCompanyController@uploadVendorImage` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `POST` | `api/v1/dashboard/vendor/b2b/company/portfolio` | `B2b\Controllers\PartnerB2bCompanyController@uploadVendorPortfolio` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `DELETE` | `api/v1/dashboard/vendor/b2b/company/portfolio/{image}` | `B2b\Controllers\PartnerB2bCompanyController@deleteVendorPortfolio` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/vendor/b2b/leads` | `B2b\Controllers\PartnerB2bLeadController@indexVendor` | `sanctum` | Role: vendor | Perm: N/A | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/vendor/b2b/leads/{lead}` | `B2b\Controllers\PartnerB2bLeadController@showVendor` | `sanctum` | Role: vendor | Perm: N/A | Read | PASS (Audited) |
| `PATCH` | `api/v1/dashboard/vendor/b2b/leads/{lead}` | `B2b\Controllers\PartnerB2bLeadController@updateVendor` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/vendor/b2b/reviews` | `B2b\Controllers\PartnerB2bReviewController@indexVendor` | `sanctum` | Role: vendor | Perm: N/A | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/vendor/b2b/tags` | `B2b\Controllers\PartnerB2bCompanyController@tagsVendor` | `sanctum` | Role: vendor | Perm: N/A | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/vendor/coupons` | `Coupons\Controllers\VendorCouponController@index` | `sanctum` | Role: vendor | Perm: N/A | Read | PASS (Audited) |
| `POST` | `api/v1/dashboard/vendor/coupons` | `Coupons\Controllers\VendorCouponController@store` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/vendor/coupons/{vendorCoupon}` | `Coupons\Controllers\VendorCouponController@show` | `sanctum` | Role: vendor | Perm: N/A | Read | PASS (Audited) |
| `PATCH` | `api/v1/dashboard/vendor/coupons/{vendorCoupon}` | `Coupons\Controllers\VendorCouponController@update` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `POST` | `api/v1/dashboard/vendor/coupons/{vendorCoupon}/activate` | `Coupons\Controllers\VendorCouponController@activate` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `POST` | `api/v1/dashboard/vendor/coupons/{vendorCoupon}/deactivate` | `Coupons\Controllers\VendorCouponController@deactivate` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/vendor/finance/analytics` | `Vendors\Controllers\VendorFinanceController@analytics` | `sanctum` | Role: vendor | Perm: N/A | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/vendor/finance/payouts` | `Vendors\Controllers\VendorFinanceController@payouts` | `sanctum` | Role: vendor | Perm: N/A | Read | PASS (Audited) |
| `POST` | `api/v1/dashboard/vendor/finance/payouts` | `Vendors\Controllers\VendorFinanceController@requestPayout` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `POST` | `api/v1/dashboard/vendor/finance/payouts/{payout}/cancel` | `Vendors\Controllers\VendorFinanceController@cancelPayout` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/vendor/finance/report` | `Vendors\Controllers\VendorFinanceController@exportReport` | `sanctum` | Role: vendor | Perm: N/A | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/vendor/finance/summary` | `Vendors\Controllers\VendorFinanceController@summary` | `sanctum` | Role: vendor | Perm: N/A | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/vendor/finance/transactions` | `Vendors\Controllers\VendorFinanceController@transactions` | `sanctum` | Role: vendor | Perm: N/A | Read | PASS (Audited) |
| `PATCH` | `api/v1/dashboard/vendor/inventory/{product}` | `Vendors\Controllers\VendorInventoryController@adjust` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/vendor/orders` | `Orders\Controllers\VendorOrderController@index` | `sanctum` | Role: vendor | Perm: N/A | Read | PASS (Audited) |
| `POST` | `api/v1/dashboard/vendor/orders` | `Orders\Controllers\VendorOrderController@store` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/vendor/orders/{vendorOrder}` | `Orders\Controllers\VendorOrderController@show` | `sanctum` | Role: vendor | Perm: N/A | Read | PASS (Audited) |
| `POST` | `api/v1/dashboard/vendor/orders/{vendorOrder}/accept` | `Orders\Controllers\VendorOrderController@accept` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `POST` | `api/v1/dashboard/vendor/orders/{vendorOrder}/cancel` | `Orders\Controllers\VendorOrderController@cancel` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `POST` | `api/v1/dashboard/vendor/orders/{vendorOrder}/deliver` | `Orders\Controllers\VendorOrderController@deliver` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/vendor/orders/{vendorOrder}/invoice` | `Orders\Controllers\VendorOrderController@invoice` | `sanctum` | Role: vendor | Perm: N/A | Read | PASS (Audited) |
| `POST` | `api/v1/dashboard/vendor/orders/{vendorOrder}/process` | `Orders\Controllers\VendorOrderController@process` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `POST` | `api/v1/dashboard/vendor/orders/{vendorOrder}/ship` | `Orders\Controllers\VendorOrderController@ship` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/vendor/overview` | `Vendors\Controllers\VendorDashboardController@overview` | `sanctum` | Role: vendor | Perm: N/A | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/vendor/preorders` | `Vendors\Controllers\VendorPreorderController@index` | `sanctum` | Role: vendor | Perm: N/A | Read | PASS (Audited) |
| `POST` | `api/v1/dashboard/vendor/preorders/{preorder}/cancel` | `Vendors\Controllers\VendorPreorderController@cancel` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/vendor/products` | `Vendors\Controllers\VendorProductController@index` | `sanctum` | Role: vendor | Perm: N/A | Read | PASS (Audited) |
| `POST` | `api/v1/dashboard/vendor/products` | `Vendors\Controllers\VendorProductController@store` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/vendor/products/{product}` | `Vendors\Controllers\VendorProductController@show` | `sanctum` | Role: vendor | Perm: N/A | Read | PASS (Audited) |
| `PATCH` | `api/v1/dashboard/vendor/products/{product}` | `Vendors\Controllers\VendorProductController@update` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `DELETE` | `api/v1/dashboard/vendor/products/{product}` | `Vendors\Controllers\VendorProductController@destroy` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/vendor/products/{product}/affiliate` | `Affiliate\Controllers\VendorProductAffiliateController@show` | `sanctum` | Role: vendor | Perm: N/A | Read | PASS (Audited) |
| `PATCH` | `api/v1/dashboard/vendor/products/{product}/affiliate` | `Affiliate\Controllers\VendorProductAffiliateController@update` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `POST` | `api/v1/dashboard/vendor/products/{product}/images` | `Vendors\Controllers\VendorProductController@addImages` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `DELETE` | `api/v1/dashboard/vendor/products/{product}/images/{image}` | `Vendors\Controllers\VendorProductController@deleteImage` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/vendor/return-policy` | `Returns\Controllers\VendorReturnPolicyController@show` | `sanctum` | Role: vendor | Perm: N/A | Read | PASS (Audited) |
| `PUT` | `api/v1/dashboard/vendor/return-policy` | `Returns\Controllers\VendorReturnPolicyController@update` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/vendor/returns` | `Returns\Controllers\VendorReturnController@index` | `sanctum` | Role: vendor | Perm: N/A | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/vendor/returns/{returnRequest}` | `Returns\Controllers\VendorReturnController@show` | `sanctum` | Role: vendor | Perm: N/A | Read | PASS (Audited) |
| `POST` | `api/v1/dashboard/vendor/returns/{returnRequest}/approve` | `Returns\Controllers\VendorReturnController@approve` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `POST` | `api/v1/dashboard/vendor/returns/{returnRequest}/inspect` | `Returns\Controllers\VendorReturnController@inspect` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `POST` | `api/v1/dashboard/vendor/returns/{returnRequest}/received` | `Returns\Controllers\VendorReturnController@received` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `POST` | `api/v1/dashboard/vendor/returns/{returnRequest}/refund` | `Returns\Controllers\VendorReturnController@refund` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `POST` | `api/v1/dashboard/vendor/returns/{returnRequest}/reject` | `Returns\Controllers\VendorReturnController@reject` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `POST` | `api/v1/dashboard/vendor/returns/{returnRequest}/submit-review` | `Returns\Controllers\VendorReturnController@submitForReview` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/vendor/reviews/inbox` | `Vendors\Controllers\VendorReviewInboxController@index` | `sanctum` | Role: vendor | Perm: N/A | Read | PASS (Audited) |
| `POST` | `api/v1/dashboard/vendor/reviews/inbox/{type}/{reviewId}/reply` | `Vendors\Controllers\VendorReviewInboxController@reply` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/vendor/settings` | `Vendors\Controllers\VendorSettingsController@show` | `sanctum` | Role: vendor | Perm: N/A | Read | PASS (Audited) |
| `PATCH` | `api/v1/dashboard/vendor/settings` | `Vendors\Controllers\VendorSettingsController@update` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `PUT` | `api/v1/dashboard/vendor/settings/bank-account` | `Vendors\Controllers\VendorSettingsController@updateBankAccount` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `POST` | `api/v1/dashboard/vendor/settings/cover` | `Vendors\Controllers\VendorSettingsController@uploadCover` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `DELETE` | `api/v1/dashboard/vendor/settings/cover` | `Vendors\Controllers\VendorSettingsController@deleteCover` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `PUT` | `api/v1/dashboard/vendor/settings/legal` | `Vendors\Controllers\VendorSettingsController@updateLegal` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `POST` | `api/v1/dashboard/vendor/settings/logo` | `Vendors\Controllers\VendorSettingsController@uploadLogo` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `DELETE` | `api/v1/dashboard/vendor/settings/logo` | `Vendors\Controllers\VendorSettingsController@deleteLogo` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `PUT` | `api/v1/dashboard/vendor/settings/working-hours` | `Vendors\Controllers\VendorSettingsController@updateWorkingHours` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/vendor/shipping-settings` | `Shipping\Controllers\VendorShippingSettingsController@show` | `sanctum` | Role: vendor | Perm: N/A | Read | PASS (Audited) |
| `PUT` | `api/v1/dashboard/vendor/shipping-settings` | `Shipping\Controllers\VendorShippingSettingsController@update` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/dashboard/vendor/team` | `Vendors\Controllers\VendorTeamController@index` | `sanctum` | Role: vendor | Perm: N/A | Read | PASS (Audited) |
| `POST` | `api/v1/dashboard/vendor/team/invite` | `Vendors\Controllers\VendorTeamController@invite` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `PATCH` | `api/v1/dashboard/vendor/team/{member}` | `Vendors\Controllers\VendorTeamController@update` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `DELETE` | `api/v1/dashboard/vendor/team/{member}` | `Vendors\Controllers\VendorTeamController@destroy` | `sanctum` | Role: vendor | Perm: N/A | Write | PASS (Audited) |
| `POST` | `api/v1/feedback` | `Platform\Controllers\WebsiteFeedbackController@store` | _public_ | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/feedback/status` | `Platform\Controllers\WebsiteFeedbackController@status` | _public_ | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/health` | `Platform\Controllers\HealthController` | _public_ | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/health/live` | `Platform\Controllers\LiveHealthController` | _public_ | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/health/ready` | `Platform\Controllers\ReadinessController` | _public_ | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/loyalty` | `Loyalty\Controllers\LoyaltyController@show` | `sanctum` | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/loyalty/rewards` | `Loyalty\Controllers\LoyaltyController@rewards` | `sanctum` | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/loyalty/transactions` | `Loyalty\Controllers\LoyaltyController@transactions` | `sanctum` | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/platform/announcement` | `Platform\Controllers\PlatformAnnouncementController@show` | _public_ | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/platform/commerce` | `Platform\Controllers\PlatformCommerceController@show` | _public_ | - | Read | PASS (Audited) |
| `POST` | `api/v1/platform/consultation` | `Platform\Controllers\PlatformContactController@consultation` | _public_ | - | Write | PASS (Audited) |
| `POST` | `api/v1/platform/newsletter` | `Platform\Controllers\PlatformContactController@newsletter` | `sanctum` | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/platform/search` | `Platform\Controllers\PlatformSearchController@show` | _public_ | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/platform/theme` | `Platform\Controllers\PlatformThemeController@show` | _public_ | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/projects` | `Projects\Controllers\ProjectController@index` | _public_ | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/projects/{slug}` | `Projects\Controllers\ProjectController@show` | _public_ | - | Read | PASS (Audited) |
| `PATCH` | `api/v1/provider-reviews/{review}` | `ServicesMarketplace\Controllers\ProviderReviewController@update` | `sanctum` | - | Write | PASS (Audited) |
| `DELETE` | `api/v1/provider-reviews/{review}` | `ServicesMarketplace\Controllers\ProviderReviewController@destroy` | `sanctum` | - | Write | PASS (Audited) |
| `POST` | `api/v1/provider-reviews/{review}/response` | `ServicesMarketplace\Controllers\ProviderReviewController@respond` | `sanctum` | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/provider/accounts/{providerAccount}` | `Identity\Controllers\OwnershipController@showProviderAccount` | `sanctum` | Role: provider | Perm: N/A | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/providers/{slug}` | `ServicesMarketplace\Controllers\ProviderController@show` | _public_ | - | Read | PASS (Audited) |
| `POST` | `api/v1/providers/{slug}/follow` | `ServicesMarketplace\Controllers\ProviderFollowController@follow` | `sanctum` | - | Write | PASS (Audited) |
| `DELETE` | `api/v1/providers/{slug}/follow` | `ServicesMarketplace\Controllers\ProviderFollowController@unfollow` | `sanctum` | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/providers/{slug}/portfolio` | `ServicesMarketplace\Controllers\ProviderController@portfolio` | _public_ | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/providers/{slug}/reviews` | `ServicesMarketplace\Controllers\ProviderReviewController@index` | _public_ | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/providers/{slug}/services` | `ServicesMarketplace\Controllers\ProviderController@services` | _public_ | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/readiness` | `Platform\Controllers\ReadinessController` | _public_ | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/room-designs` | `RoomDesigner\Controllers\RoomDesignController@index` | `sanctum` | - | Read | PASS (Audited) |
| `POST` | `api/v1/room-designs` | `RoomDesigner\Controllers\RoomDesignController@store` | `sanctum` | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/room-designs/{roomDesign}` | `RoomDesigner\Controllers\RoomDesignController@show` | `sanctum` | - | Read | PASS (Audited) |
| `PUT` | `api/v1/room-designs/{roomDesign}` | `RoomDesigner\Controllers\RoomDesignController@update` | `sanctum` | - | Write | PASS (Audited) |
| `PATCH` | `api/v1/room-designs/{roomDesign}` | `RoomDesigner\Controllers\RoomDesignController@patch` | `sanctum` | - | Write | PASS (Audited) |
| `DELETE` | `api/v1/room-designs/{roomDesign}` | `RoomDesigner\Controllers\RoomDesignController@destroy` | `sanctum` | - | Write | PASS (Audited) |
| `POST` | `api/v1/room-designs/{roomDesign}/add-to-cart` | `RoomDesigner\Controllers\RoomDesignController@addToCart` | `sanctum` | - | Write | PASS (Audited) |
| `POST` | `api/v1/room-designs/{roomDesign}/suggest-layout` | `RoomDesigner\Controllers\RoomDesignController@suggestLayout` | `sanctum` | - | Write | PASS (Audited) |
| `POST` | `api/v1/room-designs/{roomDesign}/try-in-room` | `TryInRoom\Controllers\TryInRoomController@storeForRoomDesign` | `sanctum` | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/service-bookings` | `ServicesMarketplace\Controllers\ServiceBookingController@index` | `sanctum` | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/service-bookings/{serviceBooking}` | `ServicesMarketplace\Controllers\ServiceBookingController@show` | `sanctum` | - | Read | PASS (Audited) |
| `POST` | `api/v1/service-bookings/{serviceBooking}/accept-schedule` | `ServicesMarketplace\Controllers\ServiceBookingController@acceptSchedule` | `sanctum` | - | Write | PASS (Audited) |
| `POST` | `api/v1/service-bookings/{serviceBooking}/cancel` | `ServicesMarketplace\Controllers\ServiceBookingController@cancelAsCustomer` | `sanctum` | - | Write | PASS (Audited) |
| `POST` | `api/v1/service-bookings/{serviceBooking}/decline-schedule` | `ServicesMarketplace\Controllers\ServiceBookingController@declineSchedule` | `sanctum` | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/service-bookings/{serviceBooking}/payment` | `ServicesMarketplace\Controllers\ServiceBookingPaymentController@show` | `sanctum` | - | Read | PASS (Audited) |
| `POST` | `api/v1/service-bookings/{serviceBooking}/payment/simulate` | `ServicesMarketplace\Controllers\ServiceBookingPaymentController@simulate` | `sanctum` | - | Write | PASS (Audited) |
| `POST` | `api/v1/service-bookings/{serviceBooking}/review` | `ServicesMarketplace\Controllers\ProviderReviewController@store` | `sanctum` | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/service-categories` | `ServicesMarketplace\Controllers\ServiceCategoryController@index` | _public_ | - | Read | PASS (Audited) |
| `POST` | `api/v1/service-offers/{serviceOffer}/accept` | `ServicesMarketplace\Controllers\ServiceOfferController@accept` | `sanctum` | - | Write | PASS (Audited) |
| `POST` | `api/v1/service-offers/{serviceOffer}/reject` | `ServicesMarketplace\Controllers\ServiceOfferController@reject` | `sanctum` | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/service-requests` | `ServicesMarketplace\Controllers\ServiceRequestController@index` | `sanctum` | - | Read | PASS (Audited) |
| `POST` | `api/v1/service-requests` | `ServicesMarketplace\Controllers\ServiceRequestController@store` | `sanctum` | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/service-requests/{serviceRequest}` | `ServicesMarketplace\Controllers\ServiceRequestController@show` | `sanctum` | - | Read | PASS (Audited) |
| `POST` | `api/v1/service-requests/{serviceRequest}/attachments` | `ServicesMarketplace\Controllers\ServiceRequestController@storeAttachment` | `sanctum` | - | Write | PASS (Audited) |
| `POST` | `api/v1/service-requests/{serviceRequest}/cancel` | `ServicesMarketplace\Controllers\ServiceRequestController@cancel` | `sanctum` | - | Write | PASS (Audited) |
| `POST` | `api/v1/service-requests/{serviceRequest}/offers` | `ServicesMarketplace\Controllers\ServiceOfferController@store` | `sanctum` | - | Write | PASS (Audited) |
| `PATCH` | `api/v1/store-reviews/{review}` | `Reviews\Controllers\StoreReviewController@update` | `sanctum` | - | Write | PASS (Audited) |
| `DELETE` | `api/v1/store-reviews/{review}` | `Reviews\Controllers\StoreReviewController@destroy` | `sanctum` | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/storefront/home` | `Catalog\Controllers\HomeStorefrontController@show` | _public_ | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/team-invites/{token}` | `Vendors\Controllers\VendorTeamInviteController@show` | `sanctum` | - | Read | PASS (Audited) |
| `POST` | `api/v1/team-invites/{token}/accept` | `Vendors\Controllers\VendorTeamInviteController@accept` | `sanctum` | - | Write | PASS (Audited) |
| `POST` | `api/v1/team-invites/{token}/reject` | `Vendors\Controllers\VendorTeamInviteController@reject` | `sanctum` | - | Write | PASS (Audited) |
| `POST` | `api/v1/webhooks/payments/fake` | `Payments\Controllers\FakePaymentWebhookController` | _public_ | - | Write | PASS (Audited) |
| `POST` | `api/v1/webhooks/payments/myfatoorah` | `Payments\Controllers\PaymentWebhookController@myfatoorah` | _public_ | - | Write | PASS (Audited) |
| `GET|HEAD` | `storage/{path}` | `Closure` | _public_ | - | Read | PASS (Audited) |
| `PUT` | `storage/{path}` | `Closure` | _public_ | - | Write | PASS (Audited) |
| `GET|HEAD` | `up` | `Closure` | _public_ | - | Read | PASS (Audited) |

### 2.VendorsStores Vendors & Stores (9 routes)

| Method | URI | Controller Action | Guard | Required Role / Permission | R/W | Audit Status |
|---|---|---|---|---|:---:|:---:|
| `GET|HEAD` | `api/v1/vendor-orders/{vendorOrder}/items/{orderItem}/return-eligibility` | `Returns\Controllers\ReturnController@eligibility` | `sanctum` | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/vendor/accounts/{vendorAccount}` | `Identity\Controllers\OwnershipController@showVendorAccount` | `sanctum` | Role: vendor | Perm: N/A | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/vendors` | `Vendors\Controllers\VendorController@index` | _public_ | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/vendors/{slug}` | `Vendors\Controllers\VendorController@show` | _public_ | - | Read | PASS (Audited) |
| `POST` | `api/v1/vendors/{slug}/follow` | `Vendors\Controllers\VendorFollowController@follow` | `sanctum` | - | Write | PASS (Audited) |
| `DELETE` | `api/v1/vendors/{slug}/follow` | `Vendors\Controllers\VendorFollowController@unfollow` | `sanctum` | - | Write | PASS (Audited) |
| `GET|HEAD` | `api/v1/vendors/{slug}/products` | `Vendors\Controllers\VendorController@products` | _public_ | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/vendors/{slug}/reviews` | `Reviews\Controllers\StoreReviewController@index` | _public_ | - | Read | PASS (Audited) |
| `POST` | `api/v1/vendors/{slug}/reviews` | `Reviews\Controllers\StoreReviewController@store` | `sanctum` | - | Write | PASS (Audited) |

### 2.VisualToolsRoomDesigner Visual Tools & Room Designer (2 routes)

| Method | URI | Controller Action | Guard | Required Role / Permission | R/W | Audit Status |
|---|---|---|---|---|:---:|:---:|
| `GET|HEAD` | `api/v1/try-in-room/{tryInRoomJob}` | `TryInRoom\Controllers\TryInRoomController@show` | `sanctum` | - | Read | PASS (Audited) |
| `GET|HEAD` | `api/v1/try-in-room/{tryInRoomJob}/result` | `TryInRoom\Controllers\TryInRoomController@result` | `sanctum` | - | Read | PASS (Audited) |

