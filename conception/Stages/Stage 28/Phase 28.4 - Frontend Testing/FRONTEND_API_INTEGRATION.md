# Phase 28.4 — Frontend ↔ API Integration

**Backend reference:** Phase 28.3 API inventory (480 routes)  
**Frontend API modules:** **56** files under `frontend/src/api/`

---

## HTTP client architecture

**File:** `frontend/src/api/client.ts`

| Feature | Implementation |
|---------|----------------|
| Base URL | `env.apiUrl` (Vite env) |
| Auth | `withCredentials: true` (Sanctum cookies) |
| CSRF | `X-XSRF-TOKEN` on mutating requests |
| Locale | `Accept-Language` from stored locale |
| Affiliate | `X-Affiliate-Session` when present |
| Timeout | 30s |
| 401 handling | `notifyUnauthorized()` → session events (except ignored auth probe URLs) |

**Error parsing:** `frontend/src/utils/errors.ts` — `parseApiError()` maps `{ success, message, errors }` envelope.

Vitest: **9 tests PASS** on error parsing.

---

## API module ↔ domain map

| Frontend module | Backend domain |
|-----------------|----------------|
| `auth.ts` | `/api/v1/auth/*` |
| `cart.ts`, `checkout.ts` | Cart, checkout preview |
| `orders.ts`, `payment.ts` | Orders, payments |
| `catalog.ts`, `catalogSearch.ts` | Products, search |
| `services.ts`, `serviceBookings.ts` | Services, bookings |
| `b2b.ts`, `partnerB2b.ts` | B2B |
| `loyalty.ts`, `affiliate.ts` | Loyalty, affiliate |
| `chat.ts`, `notifications.ts` | Chat, notifications |
| `adminAuth.ts`, `adminAnalytics.ts`, `adminCms.ts` | Admin |
| `assistant.ts` | `/api/v1/assistant/chat` |

---

## Contract alignment (inspected)

| Concern | Frontend handling | Evidence |
|---------|-------------------|----------|
| Pagination `{ items, meta }` | Mappers in catalog/admin hooks | Source + Vitest mappers |
| 422 validation | `parseApiError` → field errors | `errors.test.ts`, form pages |
| 401 session expiry | AuthContext + redirect | `AuthContext.test.tsx`, Playwright auth-isolation |
| 403 forbidden | `ForbiddenPage`, route guards | `OrderAuthorization` backend + UI `/403` |
| Idempotency headers | Checkout/order flows | Backend tests; frontend order API |
| FormData uploads | Strips JSON Content-Type | `client.ts` `prepareRequestBody` |

---

## Gaps

| Gap | ID |
|-----|-----|
| Assistant API — no Vitest/E2E | KI-028-037 (carried) |
| Per-endpoint contract matrix (480×56) | **NOT VERIFIED** exhaustively |
| 429 UI handling | Partial — rate limit mostly backend |
| 500/error boundary | `AppErrorFallback` exists — forced 500 UI **NOT VERIFIED** |

---

## Integration gate

```text
PARTIAL
```

Core commerce modules align with Phase 28.3 backend. Exhaustive endpoint-by-endpoint matrix **NOT VERIFIED**.
