# Performance Audit — Admin Panel

**Date:** 2026-08-22

## N+1 mitigation

| Resource | Eager loads | Status |
|----------|-------------|--------|
| Orders | `user` | ✅ |
| Products | `vendorAccount`, `category`, `inventory`, `affiliateSetting`, `images` | ✅ |
| Return requests | `user`, `vendorOrder`, `order`, `refund`, `items` | ✅ |
| Payments | — | ⬜ review |
| Payouts | — | ⬜ review |

## Dashboard

| Widget | Method | Status |
|--------|--------|--------|
| OperationsOverview | `count()` queries | ✅ |
| NeedsAttention | `count()` queries | ✅ |
| BusinessOverview | `count()` + sum aggregate | ✅ |
| RecentActivity | `limit(5)` queries | ✅ |

## Indexes

Existing migrations already define operational indexes on:

- `orders (user_id, status)`, vendor orders `(vendor_account_id, status)`
- `return_requests (status, created_at)`, `(vendor_order_id, status)`
- `products (vendor_account_id, status)`, `(category_id, status)`
- `admin_audit_logs (action)`, `(actor_id, created_at)`, `(resource_type, resource_id, created_at)`
- `vendor_payouts (status, requested_at)`
- `affiliate_payouts (affiliate_profile_id, status, requested_at)`

No additional index migration required for Phase 18.4; spot-check query plans if list pages slow down.

## Settings cache

`EffectiveConfigService` — 1h TTL; invalidated on `SettingsChanged`. Verified in `SystemSettingServiceTest`.

## Remaining

- [ ] Debugbar/query log on order list with 50+ rows
- [ ] Confirm no unbounded relationship selects in Filament forms
