# Phase 28.3 — API Coverage Matrix

**Date:** 2026-08-27  
**Basis:** Feature test file audit + route inventory (480 routes)

Legend: **YES** = behavioral tests exist · **PARTIAL** = some paths · **NO** = not found · **N/A** = domain absent

| Domain | Endpoint coverage | Auth | AuthZ / IDOR | Validation | Error contract | Idempotency | Edge cases |
|--------|-------------------|------|--------------|------------|----------------|-------------|------------|
| **Auth** | YES | YES | YES | YES | YES | N/A | YES (pending user, OTP) |
| **Profile** | YES | YES | PARTIAL | YES | YES | N/A | YES (phone change) |
| **Catalog** | YES | PARTIAL | YES | YES | YES | N/A | YES (availability, IDOR) |
| **Search** | YES | N/A | YES | YES | YES | N/A | YES (security/injection) |
| **Cart** | YES | YES | PARTIAL | YES | YES | N/A | YES (qty limits) |
| **Checkout** | PARTIAL | YES | YES | YES | YES | PARTIAL | YES (self-purchase) |
| **Orders** | YES | YES | YES | YES | YES | YES | YES (cancel, auth) |
| **Payments** | YES | YES | YES | YES | YES | YES | YES (webhooks, concurrency) |
| **Shipping** | YES | YES | YES | PARTIAL | YES | N/A | YES (weight, multi-vendor) |
| **Returns** | YES | YES | YES | PARTIAL | YES | YES | YES (multi-vendor refund) |
| **Services** | YES | PARTIAL | YES | YES | YES | N/A | YES (RFQ workflow) |
| **Bookings** | YES | YES | YES | PARTIAL | YES | N/A | YES (direct booking) |
| **Reviews** | YES | YES | YES | YES | YES | N/A | YES (eligibility, integrity) |
| **Coupons** | YES | YES | YES | YES | YES | YES | YES (concurrency) |
| **Notifications** | YES | YES | PARTIAL | PARTIAL | YES | N/A | PARTIAL |
| **Chat** | YES | YES | YES | PARTIAL | YES | PARTIAL | YES (moderation, archive) |
| **Affiliate** | YES | YES | PARTIAL | PARTIAL | YES | PARTIAL | YES (commerce flow) |
| **B2B** | YES | YES | YES | YES | YES | N/A | YES (tenant isolation tests) |
| **Loyalty** | YES | YES | YES | YES | YES | YES | YES (hardening suite) |
| **Analytics** | PARTIAL | YES | YES | PARTIAL | YES | N/A | PARTIAL |
| **Admin** | YES | YES | YES | YES | YES | N/A | YES (isolation, permissions) |
| **Blog/CMS** | YES | PARTIAL | YES | YES | YES | N/A | YES (security tests) |
| **Health** | YES | N/A | N/A | N/A | YES | N/A | YES (live/ready) |
| **Uploads** | PARTIAL | YES | YES | YES | YES | N/A | YES (UploadSecurityTest) |
| **Finance** | YES | YES | YES | PARTIAL | YES | N/A | YES (ledger audit) |
| **Assistant/AI** | NO | PARTIAL | **NOT VERIFIED** | **NOT VERIFIED** | **NOT VERIFIED** | N/A | NO |

---

## Feature test files by domain (count)

| Area | Test files (approx) |
|------|---------------------|
| `tests/Feature/Api/V1/*` | ~95 |
| `tests/Feature/Admin/*` | 8 |
| `tests/Feature/Chat/*` | 3 |
| `tests/Feature/Security/*` | 2 |
| `tests/Feature/Affiliate/*` | 1 |
| `tests/Feature/Loyalty/*` | 2 |
| `tests/Feature/Notifications/*` | 4 |

**Total Feature tests executed:** 696 (all PASS on SQLite)

---

## Coverage gaps (behavioral)

| Gap | Severity | Notes |
|-----|----------|-------|
| Assistant `/api/v1/assistant/chat` | P3 | Route exists; no Feature test found |
| Full pagination matrix per list endpoint | P3 | Spot-checked via catalog/orders tests |
| Every admin route (167) individually | P2 | Covered by permission + parity tests, not 1:1 |
| Marketer role isolated matrix | P3 | Tested via affiliate commerce |
| MySQL 8 full 696 Feature tests | P2 | Only 41-test subset run |

---

## Assertion patterns observed

Across Feature tests:

| Pattern | Usage |
|---------|-------|
| `assertUnauthorized` / `assertForbidden` | Widespread authZ |
| `assertJsonValidationErrors` | FormRequest validation |
| `assertJsonStructure` | Contract checks (health, lists) |
| `assertStatus(429)` | Rate limiting |
| `Idempotency-Key` header | Orders, payments |

---

## Matrix gate

```text
PARTIAL
```

Strong coverage on commerce, auth, admin, chat, loyalty. Gaps on assistant API and exhaustive pagination per endpoint.
