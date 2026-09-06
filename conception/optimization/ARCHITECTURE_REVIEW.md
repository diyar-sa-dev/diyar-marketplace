# Architecture Review

**Date:** 2026-08-29

## Current architecture

```text
React SPA (Vite) ──REST/Sanctum──► Laravel API (modular monolith)
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
                 MySQL 8           Redis 7          Storage
              (authoritative)   (cache/queue/rate)   (public disk)
                    │
              Queue workers (Supervisor)
                    │
              Nginx + PHP-FPM (Hostinger VPS)
```

## Domain map (simplified)

| Domain | Owner service(s) | Tables (primary) | Events/queues |
|--------|------------------|------------------|---------------|
| Identity | AuthService, RegistrationService | users, roles | — |
| Catalog | ProductService, CatalogSearchService | products, categories | cache invalidation |
| Cart/Checkout | CartService, CheckoutPreviewService | carts, cart_items | — |
| Orders | OrderService, PaymentFinalizationService | orders, vendor_orders | PaymentSucceeded |
| Payments | PaymentWebhookProcessor | payments, webhook_events | ProcessPaymentWebhookJob |
| Loyalty | LoyaltyLedgerService, LoyaltyRuleService | loyalty_* | PaymentSucceeded listener |
| Affiliate | AffiliateCommissionService | affiliate_* | PaymentSucceeded |
| Analytics | AdminAnalyticsService, VendorAnalyticsService | analytics_events | cache invalidation |
| Admin | AdminPermissionService, SystemSettingService | admin_*, system_settings | SettingsChanged |

## Coupling assessment

**Healthy:** Controllers thin; financial flows use transactions + idempotency; cache versioned not flushed.

**Watch:**
- `CustomerReviewHistoryService` spans 4 review types — high coupling
- Config read via both `EffectiveConfigService` and raw `config()` — dual path
- Homepage frontend fans out to many catalog endpoints — coupling to catalog API shape

## Circular dependencies

No critical service-provider cycles detected. Event listeners are one-way (PaymentSucceeded → loyalty/affiliate/notifications).

## God services (>400 lines)

1. CustomerReviewHistoryService (717)
2. ProductService (482)
3. FinancialPostingService (448)
4. AdminAnalyticsService (432)

**Recommendation:** Do not split preemptively. Refactor CustomerReviewHistoryService when review volume or feature velocity demands it.

## Architecture decision: keep modular monolith

Microservices **not justified** at current scale. Redis is performance dependency, not functional requirement for core checkout (array/sync fallbacks exist for dev).
