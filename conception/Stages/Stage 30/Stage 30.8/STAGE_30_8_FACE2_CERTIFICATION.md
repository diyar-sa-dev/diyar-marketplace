# Stage 30.8 — Face 2 Certification

**Date:** 2026-09-19  
**Status:** **VERIFIED WITH LIMITATIONS**

## Face 2 checklist

| # | Question | Answer | Evidence |
|---|----------|--------|----------|
| 1 | Another user's design? | **No** — 404 | `test_non_owner_cannot_add_design_to_cart` |
| 2 | Client manipulate product IDs? | **No** — server reads DB document | Service design; no product list in request |
| 3 | Client manipulate price? | **No** | `CartService::addItem` uses live `sale_price` |
| 4 | Client manipulate stock? | **No** | Stock checks in `CartService` |
| 5 | Duplicate instances → quantities? | **Yes** | `test_duplicate_room_instances_aggregate_cart_quantity` |
| 6 | Stale/missing products? | **Skipped safely** | `test_missing_product_is_skipped`, OOS test |
| 7 | Concurrent requests corrupt cart? | **Same as cart** — locked rows | Reuses `CartService` transactions; **NOT load-tested** |
| 8 | Stock race? | **Existing cart semantics** | No new reservation layer |
| 9 | Bounded? | **Yes** — max 100 items in document | Stage 30.6 validator |
| 10 | N+1 prevented for instances? | **Yes** — aggregate before add | Query count test |
| 11 | Cart canonical? | **Yes** — `CartResource` | Controller response |
| 12 | Feature flag? | **Yes** — same middleware group | Route group |
| 13 | Cart unchanged? | **Yes** — no cart code modified | Git scope |
| 14 | Regression 30.1–30.7? | **74 Vitest + 20 PHPUnit** | CI-local run |

## Limitations

- Double-submit adds quantities twice (cart-native behavior) — modal disables while `isSubmitting`
- `CartService::addItem` still loads each unique product individually (O(unique), acceptable ≤100)
- Review modal not wired to Sidebar shell
- No Playwright E2E

## Next stage

**30.9 — Mobile UX** per roadmap.
