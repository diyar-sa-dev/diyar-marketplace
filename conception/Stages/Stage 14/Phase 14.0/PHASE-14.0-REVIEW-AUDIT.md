# Phase 14.0 — Review Audit

> **Status:** **Complete**  
> **Method:** Codebase inspection — models, migrations, services, routes, tests, frontend.

---

## Audit matrix

| Check | Product | Store | Provider/Service |
|-------|---------|-------|------------------|
| Persisted model | ✅ `ProductReview` | ✅ `StoreReview` | ✅ `ProviderReview` |
| Migration / table | ✅ | ✅ | ✅ |
| Rating + comment | ✅ | ✅ | ✅ |
| Eligibility rules | ✅ verified purchase | ✅ delivered order | ✅ completed + paid booking |
| Duplicate prevention | ✅ unique user+product | ✅ unique user+order | ✅ unique booking |
| Self-review block | ✅ vendor product | ✅ vendor store | ✅ provider owner |
| Public aggregates | ✅ dynamic + cached | ✅ on vendor | ✅ cached on provider/service |
| Moderation column | ❌ none | ❌ none | ⚠️ `status` enum — always Published on create |
| Admin moderation API | ❌ | ❌ | ❌ |
| Tests | ✅ strong | ✅ | ✅ + self-review added |

---

## Changes made in this task

1. **`CustomerReviewHistoryService`** — wired provider/service reviews into summary, pagination, and pending opportunities.
2. **`ProviderReviewAndDirectBookingTest::provider_cannot_review_own_service_booking`** — self-review guard test.
3. **Documentation** — this audit (no duplicate review architecture).

---

## Intentionally not changed

- No frontend moderation dashboard
- No new moderation state machine (enum exists for future use)
- No redesign of customer/provider review UI

---

## Future scope

- Admin moderation endpoints (approve/hide/reject)
- Hidden reviews excluded from aggregates (partially supported via `ProviderReviewStatus` query filters)
- Unified moderation for product/store reviews
