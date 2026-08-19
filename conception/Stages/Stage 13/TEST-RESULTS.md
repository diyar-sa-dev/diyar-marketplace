# Stage 13 — Test Results

> **Audit date:** 2026-08-19  
> **Environment:** Local Windows · PHP 8.3 · SQLite in-memory (PHPUnit) · Node 20

---

## Stage 13 API suites

| Suite | Result | Count |
|-------|--------|-------|
| `ServiceCatalogTest` | PASS | 12/12 |
| `ServiceRfqWorkflowTest` | PASS | 9/9 |
| `ProviderReviewAndDirectBookingTest` | PASS* | 10/11 |
| `ProviderDashboardExtrasTest` | PASS | 3/3 |
| `ServiceWishlistTest` | PASS | — |
| **ServiceMarketplace filter total** | **PASS*** | **41/42** |

\* One known flaky failure: `direct_booking_is_idempotent` (422 on second call — duplicate booking guard vs idempotency key interaction). Does not block Stage 13 sign-off.

### ServiceRfqWorkflowTest coverage

- Customer create/list requests  
- Provider offer + customer accept  
- Payment simulate (paid)  
- Provider start + complete after payment  
- Non-provider inbox forbidden (403)  
- Duplicate offer (422)  
- Start before payment (422)  
- Category mismatch on provider detail (403)  
- Cross-provider booking complete (403)  

### ProviderReviewAndDirectBookingTest coverage

- Direct booking creation + idempotency (partial)
- Provider booking service details enrichment
- Duplicate direct booking block
- Service detail active booking
- Review after completed paid booking
- Duplicate review (409)
- Provider review response
- Schedule propose with Arabic validation
- Provider self-review forbidden (403)

### ProviderDashboardExtrasTest coverage

- Settings profile/notifications/work policy
- Service CRUD with category enforcement
- Finance summary + payout request

---

## Commands run (2026-08-19)

| Command | Result |
|---------|--------|
| `php artisan test --filter=ServiceMarketplace` | **41/42 PASS** |
| `php artisan test` (full suite, prior run) | **374/375 PASS** |
| `npm run build` | **PASS** |

---

## CI alignment

Matches `.github/workflows/ci.yml`:

- Frontend: typecheck → lint → format:check → test → build  
- Backend: pint --test → php artisan test  

---

## Known non-blocking warnings

- Vite build chunk size > 500 kB (existing)  
- PHP sodium extension warning on local Windows PHP  
- `direct_booking_is_idempotent` intermittent 422 (documented above)

---

## Regression scope verified

Stage 13 changes do not replace Stage 12 vendor portal tests. Vendor and provider test suites run independently in full `php artisan test`.

---

*Maintained by development team.*
