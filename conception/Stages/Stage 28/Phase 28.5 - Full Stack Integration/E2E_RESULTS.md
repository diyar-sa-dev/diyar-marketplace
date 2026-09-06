# Phase 28.5 — E2E Results

**Date:** 2026-08-27  
**Authoritative run:** CI-parity stack (SQLite seed, :8000/:3000)

**Raw:** `_e2e_playwright_ci_parity.txt`

---

## Summary

| Metric | Value |
|--------|-------|
| Total tests | **72** |
| Passed | **67** |
| Failed | **4** |
| Skipped | **1** (serial b2b after prior failure in worker) |
| Duration | **~3.8 min** |
| Workers | 6 (local) |

---

## Passed critical journeys

| Domain | Spec | Result |
|--------|------|--------|
| Customer | `customer-journey.spec.ts` | **3/3 PASS** |
| Vendor | `vendor-journey.spec.ts` | **3/3 PASS** |
| Provider | `provider-journey.spec.ts` | **3/3 PASS** |
| Admin | `admin-journey.spec.ts` | **2/2 PASS** |
| B2B public | `b2b.spec.ts` | **2/2 PASS** |
| B2B admin | `b2b-admin.spec.ts` | **2/3 PASS** |
| Blog public | `blog.spec.ts` | **PASS** |
| Blog admin | `blog-admin.spec.ts` | **PASS** |
| Auth isolation | `auth-isolation.spec.ts` | **6/6 PASS** |
| Messaging | `messaging.spec.ts` | **3/3 PASS** |
| Loyalty | `loyalty.spec.ts` | **2/2 PASS** |
| Analytics | `analytics.spec.ts` | **5/5 PASS** |
| Projects | `projects.spec.ts` | **PASS** (full suite) |
| Responsive smoke | `responsive-smoke.spec.ts` | **29/29 PASS** |
| Maintenance | `maintenance.spec.ts` | **1/2 PASS** |

---

## Failures (classified)

| Spec | Classification | ID |
|------|----------------|-----|
| `b2b-admin` customer admin API | **TEST BUG** — `request` lacks page session | KI-028-051 |
| `projects-modal-regression` dismiss | **TEST BUG** — ad close selector | KI-028-050 |
| `projects-modal-regression` repro | **TEST BUG** — assertion timing | KI-028-050 |
| `upload-smoke` vendor logo | **PARTIAL** — upload UI not confirmed in /me | KI-028-052 |

---

## Dev stack comparison (Phase 28.4 baseline)

| Run | Pass | Fail | Skip |
|-----|------|------|------|
| Dev MariaDB (`composer dev`) | 33 | 3 | 3 |
| CI-parity SQLite | **67** | **4** | **1** |

---

## Gate

```text
PARTIAL
```

Core commerce/admin/B2B/blog journeys pass on CI-parity stack. 4 failures are test-harness/upload-evidence gaps, not P0 commerce blockers.
