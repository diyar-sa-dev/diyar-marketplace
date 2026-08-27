# API N+1 Audit — Phase 28.10

**Date:** 2026-08-27  
**Status:** PASS — no confirmed high-impact N+1 after fixes

---

## Verified (query-count tests)

| Workflow | Test | Result |
|----------|------|--------|
| Product list | CatalogQueryPerformanceTest | 0 per-card review queries |
| Order list | OrderListQueryCountTest | ≤4 vendor_order SELECTs |
| Checkout preview | CheckoutShippingQueryCountTest | Sub-linear |
| Vendor analytics | VendorAnalyticsTest | ≤12 queries |
| Admin notifications | NotificationDeliveryStateMachineTest | ≤12 queries |

---

## Fixed in 28.10

| Location | Before | After |
|----------|--------|-------|
| OrderCreationService | 2 product queries × line items | Reuse cart product map |
| CartService + CartItemResource | 1 `exists()` per cart line for wishlist | `withUserSaved` batch subquery |

---

## Documented (no production evidence of N+1)

| Area | Notes |
|------|-------|
| ProductCardResource | Uses `withCount`/`withUserSaved` when via `cardQuery()` |
| VendorPublicResource | Lazy fallback if relations not loaded — controller should eager-load |
| Admin lists | PHP serialization often > SQL cost |

---

## Conclusion

**Zero confirmed high-impact N+1** on optimized paths. Remaining gaps are P3 without measured regression.
