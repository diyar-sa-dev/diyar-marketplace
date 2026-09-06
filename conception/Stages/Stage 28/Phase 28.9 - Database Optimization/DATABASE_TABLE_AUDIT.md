# Database Table Audit — Phase 28.9

**Date:** 2026-08-27  
**Authoritative baseline:** Phase 28.2 `_db_schema_inventory.json` (123 tables, 93 migrations, 209 FKs)  
**28.9 tooling:** `backend/scripts/stage29-db-table-audit.php` → `_db_table_audit.json`

---

## Summary

| Metric | Value |
|--------|-------|
| Total tables | **123** |
| Migrations | 93 |
| Foreign keys | 209 |
| Tables with Eloquent models | ~115 |
| Tables removed | **0** |
| Tables flagged for deletion | **0** |

---

## Classification summary

| Classification | Approx. count | Description |
|----------------|---------------|-------------|
| **ACTIVE** | ~100 | Model-backed, production workflows |
| **ACTIVE-HIGH-TRAFFIC** | ~8 | Catalog, orders, analytics events at scale |
| **ACTIVE-LOW-TRAFFIC** | ~10 | B2B RFQs, affiliate clicks, etc. |
| **AUDIT/HISTORICAL** | ~5 | `admin_audit_logs`, webhook events, search events |
| **SUPPORTING** | ~7 | `jobs`, `failed_jobs`, `cache`, `sessions`, permissions |
| **LEGACY** | 0 proven | None identified with evidence |
| **SUSPECT** | 0 | None meeting cleanup criteria |
| **UNREFERENCED** | 0 proven | All tables trace to migrations + models or infra |
| **UNKNOWN** | ~9 | Domain map incomplete — **not deleted** |

---

## Domain ownership map

| Domain | Representative tables |
|--------|----------------------|
| **IDENTITY** | `users`, `roles`, `role_user`, `personal_access_tokens`, `addresses` |
| **VENDORS** | `vendor_accounts`, `vendor_team_members`, `vendor_coupons`, `vendor_payouts` |
| **CATALOG** | `categories`, `products`, `product_*`, `media_files` |
| **CART** | `carts`, `cart_items`, `wishlists`, `wishlist_items` |
| **COMMERCE** | `orders`, `order_items`, `vendor_orders` |
| **PAYMENTS** | `payments`, `payment_attempts`, `financial_transactions` |
| **SHIPPING** | `shipments`, `shipping_*`, `vendor_shipping_settings` |
| **RETURNS** | `return_requests`, `refunds`, `vendor_return_policies` |
| **SERVICES** | `services`, `service_bookings`, `service_requests`, `service_offers` |
| **REVIEWS** | `product_reviews`, `store_reviews`, `provider_reviews` |
| **COUPONS** | `vendor_coupons`, `coupon_redemptions` |
| **NOTIFICATIONS** | `notifications`, `user_notifications`, `notification_deliveries` |
| **CHAT** | `conversations`, `messages`, `conversation_participants` |
| **AFFILIATE** | `affiliate_*` (accounts, links, commissions, clicks, attributions) |
| **LOYALTY** | `loyalty_accounts`, `loyalty_transactions`, `loyalty_rules` |
| **B2B** | `b2b_companies`, `b2b_rfqs`, `b2b_leads`, portfolio images |
| **ANALYTICS** | `analytics_events`, `search_query_events` |
| **FINANCE** | `commission_rules`, platform/vendor finance ledgers |
| **ADMIN** | `admin_audit_logs`, `admin_permissions`, `system_settings` |
| **CMS** | `blog_*`, `projects` |
| **AI/ASSISTANT** | `assistant_conversations`, `assistant_messages` |

**Decision:** Logical domain map only — **no physical database split**, no microservices.

---

## Cleanup investigation result

All 123 tables investigated against 14-point removal policy:

| Check | Result |
|-------|--------|
| Model references | All production tables have model or Laravel infra purpose |
| Raw SQL references | Phase 28.2 compatibility scan — no orphan tables |
| FK dependencies | 209 FKs — no dangling parents |
| Audit/legal retention | Audit tables retained by design |

**Verdict:** No table meets removal threshold. Goal achieved: *every table has a justified purpose* — not *reduce table count*.

---

## UNKNOWN tables (document only)

Heuristic domain map did not assign ~9 tables (e.g. junction/support tables). Examples: `affiliate_attributions`, `role_user`, Laravel infra.  
**Action:** Extend domain map in documentation; **DO NOT DROP**.

---

## High-traffic tables (monitor)

| Table | Why |
|-------|-----|
| `products` | Public catalog — OPT-DB-001 applied |
| `orders`, `order_items` | Checkout + history |
| `analytics_events` | Dashboard aggregation |
| `messages` | Chat realtime |
| `notifications` | User feeds |

See `_db_table_audit.json` and Phase 28.2 inventory for per-table indexes and row estimates.
