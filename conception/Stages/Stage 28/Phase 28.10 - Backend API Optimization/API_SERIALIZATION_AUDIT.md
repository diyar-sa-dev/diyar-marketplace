# API Serialization Audit — Phase 28.10

**Status:** PASS with documented fallbacks

| Resource | Risk | Mitigation |
|----------|------|------------|
| ProductCardResource | rating/saved fallback queries | cardQuery uses withCount/withUserSaved |
| CartItemResource | user_saved N+1 | **FIXED** withUserSaved on load |
| OrderResource | nested vendor orders | Controller eager-loads |
| VendorPublicResource | lazy relation fallback | P3 — require controller eager-load |

No response fields removed. Checkout preview adds `product_slug` per line (additive, used internally for order creation).
