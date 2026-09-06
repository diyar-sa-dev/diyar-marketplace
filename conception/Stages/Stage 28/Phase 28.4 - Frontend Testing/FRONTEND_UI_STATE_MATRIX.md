# Phase 28.4 — Frontend UI State Matrix

**Method:** Component inspection + Vitest/Playwright where available

---

## Shared components

| Component | Loading | Empty | Error | Source |
|-----------|---------|-------|-------|--------|
| `LoadingState.tsx` | Yes | — | — | Used across pages |
| `EmptyState.tsx` | — | Yes | — | Lists, cart |
| `ErrorState.tsx` | — | — | Yes | Retry pattern |
| `PageLoadingOverlay.tsx` | Yes | — | — | Page transitions |
| `TableSkeleton.tsx` | Yes | — | — | Admin tables |
| `AppErrorFallback.tsx` | — | — | Yes (500) | Root error boundary |

---

## Domain matrix (behavioral coverage)

| Screen | Loading | Success | Empty | Error | Unauthorized | Evidence |
|--------|---------|---------|-------|-------|--------------|----------|
| Product list | Yes | Yes | Partial | Partial | N/A | SearchPage patterns |
| Product detail | Yes | Yes | 404 | Partial | N/A | ProductDetailsPage |
| Cart sidebar | Yes | Yes | **Yes** | Partial | Guest prompt | `CartTest` vitest indirect; E2E customer |
| Checkout | Yes | Yes | Partial | **Yes** (coupon) | Protected | `checkoutCouponErrors.test.ts` |
| Orders | Yes | Yes | Empty hint | Partial | Protected | OrdersPage + E2E partial |
| Loyalty | Yes | Yes | Guest prompt | Partial | Guest/auth | **LoyaltyPage.test.tsx** + E2E |
| B2B company | Yes | Yes | Partial | Partial | RFQ gate | **B2BCompanyPage.test.tsx** |
| Blog article | Yes | Yes | — | Partial | N/A | **BlogArticlePage.test.tsx** |
| Notifications | Yes | Yes | **Yes** | Partial | Protected | messaging E2E |
| Chat | Yes | Yes | Select conv hint | **Yes** | Protected | messaging E2E |
| Vendor dashboard | Yes | Yes | Partial | Partial | Role guard | vendor-journey E2E |
| Admin lists | Skeleton | Yes | Partial | Partial | Admin auth | admin-journey E2E |

---

## Validation error rendering

| Area | Client validation | Server 422 display |
|------|-------------------|-------------------|
| Auth forms | Yes | Yes |
| Vendor product form | **vendorProductValidation.test.ts** | Yes |
| Checkout coupon | **checkoutCouponErrors.test.ts** | Yes |
| B2B forms | Page-level | Partial |

---

## Network failure UI

| Scenario | Verified |
|----------|----------|
| Chat load error message | Source (`ChatPage` i18n key) |
| Forced offline simulation | **NOT VERIFIED** in 28.4 |
| TanStack Query retry defaults | Source inspection |

---

## Gate

```text
PARTIAL
```

Happy path + several empty/error states covered. Systematic failure matrix per screen **NOT VERIFIED**.
