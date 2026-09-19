# Stage 30.7 — Face 2 Certification

**Date:** 2026-09-19  
**Status:** **VERIFIED WITH LIMITATIONS**

---

## Adversarial review

| Area | Finding | Mitigation |
|------|---------|------------|
| Malformed UUID | Rejected domain + API | `productId.test`, `test_invalid_product_uuid_rejected` |
| Legacy integer ID | Rejected save + parse | `serialization.uuid.test`, `test_legacy_integer_product_id_rejected` |
| Hidden/deleted product | 422 on save if UUID not publicly visible | Existing `Product::publiclyVisible()` batch check |
| Search storm | 300ms debounce; Query key includes query+page | `useRoomDesignerProductSearch` |
| Stale search | TanStack Query key isolation | Same hook |
| Full catalog preload | **Blocked** — 12/page browse or search | Constants + hook |
| Duplicate add | Allowed (distinct item ids) | By design |
| N+1 on picker | Single list request | **VERIFIED** by design; no per-row product fetch in list |
| Add flow N+1 | One detail fetch per user selection | Acceptable UX tradeoff |
| RTL world coords | No X/Z flip in placement | `defaultPlacement` uses room meters only |
| Persistence UUID round-trip | JSON serialize/parse test | `serialization.uuid.test` |
| 30.1–30.6 regression | 71 Vitest + 12 PHPUnit room tests | **PASS** |
| Feature flag | No new entry in Sidebar mock | CatalogPanel `enabled` prop; API still gated |
| IDOR | Unchanged 30.6 policy | Not re-broken |

---

## Limitations

| Item | Impact |
|------|--------|
| CatalogPanel not wired into `SidebarAiStudioModal` | Manual/integration wiring for E2E |
| Stale saved items when product delisted | Item remains in document; UI refresh for “missing product” badge deferred |
| Playwright E2E | **NOT RUN** |
| Production perf under large catalog | **NOT VERIFIED** |

---

## Certification

**VERIFIED WITH LIMITATIONS** — UUID catalog integration, server alignment, picker pagination/search, and spatial add path are evidenced by automated tests. Full storefront wiring and stale-product UX remain for a follow-up UI stage.
