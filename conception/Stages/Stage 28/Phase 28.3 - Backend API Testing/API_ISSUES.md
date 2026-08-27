# Phase 28.3 — API Issues Register

**Date:** 2026-08-27  
**Commit:** `92638a9`

---

## P0 — Critical production blockers

*None identified in Phase 28.3 with reproducible evidence.*

---

## P1 — Major production blocker / high risk

*None identified. No unauthorized 200 responses with cross-user data observed in executed tests.*

---

## P2 — Significant

### KI-028-030 — Full Feature suite not run on MySQL 8

| Field | Value |
|-------|-------|
| **Endpoint** | All 696 Feature tests |
| **Method** | N/A |
| **Environment** | MySQL 8.0.46 |
| **Severity** | P2 |
| **Category** | COMPATIBILITY |
| **Expected** | Same pass rate as SQLite |
| **Actual** | Only 41-test subset executed — **PASS** |
| **Impact** | Engine-specific API failures may exist undetected |
| **Status** | OPEN (updated from KI-028-024 PARTIAL) |
| **Next phase** | CI MySQL 8 Feature job |

### KI-028-037 — Assistant API untested

| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/v1/assistant/chat` |
| **Severity** | P2 |
| **Category** | TEST GAP |
| **Evidence** | Route in inventory; no Feature test file |
| **Impact** | Unknown auth, validation, error behavior |
| **Status** | OPEN |
| **Next phase** | 28.4/28.5 or add Feature test |

### KI-028-038 — Inventory script under-classifies dashboard routes

| Field | Value |
|-------|-------|
| **Severity** | P2 |
| **Category** | DOCUMENTATION |
| **Evidence** | 151 routes in `unclassified` — mostly `dashboard/*`, `chat/*` |
| **Impact** | Domain matrix appears weaker than actual test coverage |
| **Status** | OPEN |
| **Next phase** | Improve inventory script (non-blocking) |

---

## P3 — Minor

### KI-028-031 — Notification IDOR matrix incomplete

| Category | AUTHORIZATION |
| **Severity** | P3 |
| **Evidence** | `NotificationApiTest` exists; not exhaustive cross-user matrix |
| **Status** | OPEN → 28.6 |

### KI-028-033 — Assistant validation untested

| Category | VALIDATION |
| **Severity** | P3 |
| **Status** | OPEN |

### KI-028-034 — Admin write boundary coverage incomplete

| Category | VALIDATION |
| **Severity** | P3 |
| **Evidence** | 167 admin routes; tested via permission tests not per-route |
| **Status** | OPEN |

### KI-028-035 — Booking idempotency not verified

| Category | IDEMPOTENCY |
| **Severity** | P3 |
| **Status** | NOT VERIFIED |

### KI-028-036 — Chat message idempotency not verified

| Category | IDEMPOTENCY |
| **Severity** | P3 |
| **Status** | NOT VERIFIED |

---

## P4 — Informational

### KI-028-039 — Login invalid credentials return 422 not 401

| Category | API CONTRACT |
| **Severity** | P4 |
| **Evidence** | Intentional — `AuthenticationTest` |
| **Status** | DOCUMENTED (not a defect) |

### KI-028-040 — MySQL 8 API subset slow (~317s for 41 tests)

| Category | PERFORMANCE |
| **Severity** | P4 |
| **Evidence** | RefreshDatabase on MySQL |
| **Status** | DOCUMENTED → 28.7 CI tuning |

### KI-028-021 — ShippingRulePrecedenceTest flakiness (carried)

| Category | TEST DEFECT |
| **Severity** | P2 (from 28.2) |
| **Note** | **Not an API defect** — unit test factory issue |
| **Status** | OPEN → 28.5 |

---

## Resolved / updated from prior phases

| ID | Update |
|----|--------|
| KI-028-024 | **PARTIAL** — 41 MySQL 8 API tests PASS |
| KI-028-001 | Reclassified → KI-028-021 TEST DEFECT |

---

## Optimization backlog

| ID | Description |
|----|-------------|
| OPT-API-001 | Analytics API profiling |
| OPT-API-002 | Admin pagination at scale |

---

## Counts

| Severity | Count |
|----------|-------|
| P0 | 0 |
| P1 | 0 |
| P2 | 3 (+ KI-028-021 carried) |
| P3 | 5 |
| P4 | 3 |

---

## Unverified areas

```text
Full 696 Feature tests on MySQL 8
Assistant/AI API
500 error JSON body in production APP_DEBUG=false
Every paginated endpoint edge case
Booking/chat idempotency
Dedicated security abuse matrix (→ 28.6)
```
