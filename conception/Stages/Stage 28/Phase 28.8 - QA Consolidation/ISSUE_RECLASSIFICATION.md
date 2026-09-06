# Issue Reclassification — Stage 28

**Date:** 2026-08-27

Tracks duplicate findings, severity changes, and lifecycle updates across Phases 28.1–28.7.

---

## Superseded issues

| Original ID | Current ID | Reason | Evidence | Status |
|-------------|------------|--------|----------|--------|
| **KI-028-001** (P1 CONFIRMED BUG) | **KI-028-021** | Not shipping logic bug — PHPUnit factory random dimensions trigger weight limit before rule test | 28.2: 5/5 pass with null dims; volumetric calc | **SUPERSEDED** |
| **KI-028-008** (P3 UI) | **KI-028-050** | Same root cause: homepage ad dialog intercepts sidebar | 28.5 E2E flakiness analysis | **SUPERSEDED** |
| **KI-028-041** (P2 PRODUCT) | **KI-028-050** | 28.5 identified ad popup `z-300` vs sidebar `z-60` as primary cause | `HomePage.tsx` timing | **SUPERSEDED** |
| **KI-028-003** (P2 ENV) | **KI-028-048** | E2E seed parity — procedure established | 28.5 CI-parity: 67 pass | **SUPERSEDED** |
| **KI-028-004** (P2 ENV/BUG) | **KI-028-048** | Draft B2B visible on CI-parity seed | b2b-admin 2/3 pass | **SUPERSEDED** |
| **KI-028-009** (P3 ENV) | **KI-028-048** | Blog pass on seeded SQLite | blog.spec PASS | **SUPERSEDED** |
| **KI-028-024** (P2 NOT VERIFIED) | **KI-028-030** | Same topic — 30 is canonical ID in 28.3 | MySQL 8 41-test subset | **MERGED into 030** |
| **KI-028-033** (P3) | **KI-028-057** | Assistant validation covered under security test gap | 28.6 | **MERGED** |
| **KI-028-013** (P3) | **KI-028-043** | Same Vitest act() warnings | 28.4/28.1 | **DUPLICATE** — track 043 |

---

## Resolved issues

| ID | Resolution | Phase | Evidence |
|----|------------|-------|----------|
| **KI-028-048** | **RESOLVED WITH PROCEDURE** | 28.5 | CI-parity bootstrap (`E2E_SEED_PARITY.md`); blog/b2b pass on SQLite seed |
| **KI-028-006** | **PARTIALLY ADDRESSED** | 28.6 | Security matrix executed — not fully closed but no longer "NOT VERIFIED only" |
| **KI-028-007** | **PARTIALLY ADDRESSED** | 28.7 | Profile 100 verified; 25K still NOT VERIFIED |
| **KI-028-028** | **MEASURED** | 28.7 | EXPLAIN + admin funnel profile captured → OPT-DB-002 |

---

## Severity reclassifications

| ID | Was | Now | Reason |
|----|-----|-----|--------|
| KI-028-001 | P1 | P2 (via 021) | Test defect not production defect |
| KI-028-020 | P1 | P1 ENV GAP | Local XAMPP only — not production |
| PERF-028-001 | P1 | P2 ENV GAP* | Production uses PHP-FPM, not Octane Docker; verify bcmath on deploy target |
| KI-028-048 | P2 | RESOLVED | Procedure exists |

---

## False positives / not defects

| ID | Disposition | Evidence |
|----|-------------|----------|
| KI-028-039 | **DOCUMENTATION ONLY** | 422 on bad login is intentional contract |
| KI-028-044 | **PRODUCT GAP** | French not in product scope |
| KI-028-061 | **TEST DEFECT** | Loyalty config tests — not security |
| KI-028-041/050 | **Not auth bypass** | UX/flakiness only (28.6) |

---

## Rate limit test discrepancy

| Source | Claim |
|--------|-------|
| Phase 28.3 MySQL8 subset | RateLimitingTest included in 41 tests — **PASS** |
| Phase 28.6 security audit | RateLimitingTest **3/3 FAIL** — stale payloads |

**28.8 classification:** **KI-028-054 = TEST GAP / TEST DEFECT**. No evidence of production rate-limit bypass. Reconcile with fresh CI run before release.

---

## Counting rule (28.8)

When tallying open issues, count **canonical IDs only**:

- Do **not** count KI-028-001, 008, 041, 003, 004, 009, 024, 033 alongside their successors
- Do **not** double-count KI-028-013 and KI-028-043

**Deduplicated open P2 items:** 8 (021, 022, 030, 037, 038, 050, 053, PERF-001/002 as env)

---

## Certification

```text
Reclassification complete: YES
Same problem counted once: YES
```
