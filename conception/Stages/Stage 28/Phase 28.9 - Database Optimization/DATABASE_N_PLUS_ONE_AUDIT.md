# Database N+1 Audit — Phase 28.9

**Date:** 2026-08-27  
**Requirement:** Zero **known** N+1 in critical production workflows.

---

## Verified PASS (existing regression tests)

| Domain | Workflow | Test | Result |
|--------|----------|------|--------|
| **Catalog** | Product list cards | `CatalogQueryPerformanceTest` | **0** per-card review COUNT/AVG fallback queries |
| **Orders** | Order list | `OrderListQueryCountTest` | **≤4** vendor_order SELECTs for 3 orders |
| **Checkout** | Shipping preview | `CheckoutShippingQueryCountTest` | Sub-linear |
| **Notifications** | Delivery state machine | `NotificationDeliveryStateMachineTest` | Query count bounded |
| **Analytics (vendor)** | Dashboard load | `VendorAnalyticsTest` | `assertQueryCountAtMost` PASS |

---

## NOT VERIFIED (no query-count test)

| Domain | Workflow | Severity | Notes |
|--------|----------|----------|-------|
| Orders | Order detail + items | P3 | Feature tests pass; query count not asserted |
| Chat | Message list + participants | P3 | Realtime path not profiled |
| Admin | Multi-resource lists | P3 | OPT-API-002 suggests PHP overhead > SQL |
| B2B | Company + RFQ lists | P3 | Low traffic |
| Finance | Vendor ledger reports | P3 | Raw aggregates — batch acceptable |
| Affiliate | Dashboard aggregates | P3 | Raw SQL by design |

**28.9 action:** No N+1 fix applied without proof. Document for 28.10 profiling.

---

## Eager loading patterns (spot check)

| Service | Pattern | Assessment |
|---------|---------|------------|
| `ProductService::cardQuery()` | `with([...])` on cards | Appropriate — avoids N+1 |
| `OrderController` | Loads relations per policy | NOT VERIFIED count |
| `ConversationService` | Paginated messages | NOT VERIFIED |

**Principle:** Avoid blanket `with()` everywhere — current catalog approach is targeted.

---

## N+1 register

| ID | Domain | Before | After | Test | Status |
|----|--------|--------|-------|------|--------|
| N1-CAT-001 | Catalog list reviews | Per-card queries possible | 0 fallback queries | `CatalogQueryPerformanceTest` | **PASS** (pre-existing) |
| N1-CHK-001 | Checkout shipping | Linear risk | Bounded | `CheckoutShippingQueryCountTest` | **PASS** |
| N1-ORD-001 | Order list | Per-order vendor queries | ≤4 total | `OrderListQueryCountTest` | **PASS** |
| N1-CHT-001 | Chat messages | NOT VERIFIED | — | — | **OPEN** |

---

## Conclusion

No new N+1 regressions introduced by OPT-DB-001. Critical catalog and checkout paths remain clean per existing tests. Order/chat/admin paths need MySQL query-count tests in 28.10 for full certification.
