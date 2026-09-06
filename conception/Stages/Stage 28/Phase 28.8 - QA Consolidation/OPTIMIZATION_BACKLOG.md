# Optimization Backlog — Stage 28

**Date:** 2026-08-27  
**Rule:** Ranked for Phases **28.9+**. **Nothing implemented in 28.8.**

Priority formula: **Impact × confidence ÷ cost/risk**

---

## Tier 0 — Pre-optimization remediation (not OPT-*)

| Item | ID | Phase | Why first |
|------|-----|-------|-----------|
| Assistant product/security decision | KI-028-053 | 28.9 | Release blocker decision |
| Verify bcmath on Hostinger | BLOCK-002 | Deploy | Catalog depends on it |
| Fix RateLimitingTest | KI-028-054 | 28.9 | CI regression safety |
| Sanitize admin B2B preview | KI-028-055 | 28.9 | XSS hardening |
| Fix ShippingRulePrecedenceTest | KI-028-021 | 28.9 | CI stability |
| Fix b2b-admin E2E test | KI-028-051 | 28.9 | Harness quality |

---

## OPT-INFRA

| ID | Problem | Evidence | Current | Benefit | Risk | Priority | Phase |
|----|---------|----------|---------|---------|------|----------|-------|
| **OPT-INFRA-002** | bcmath missing in Octane Docker | PERF-028-001; `/products` 500 | Load test broken | Valid k6 catalog profile | Low | **P1** | 28.9 |
| **OPT-INFRA-001** | MySQL Docker cred drift | PERF-028-002 | Compose friction | Reproducible load env | Low | P2 | 28.9 |
| **OPT-INFRA-003** | MySQL 8 CI job for full PHPUnit | KI-028-030 | SQLite only | Engine parity confidence | Medium CI time | **P1** | 28.8/CI |

---

## OPT-SECURITY (new)

| ID | Problem | Evidence | Benefit | Risk | Priority | Phase |
|----|---------|----------|---------|------|----------|-------|
| **OPT-SECURITY-001** | No CSP | KI-028-056 | XSS depth defense | Medium breakages | P2 | 28.11 |
| **OPT-SECURITY-002** | Public assistant hardening | KI-028-053 | Cost/abuse control | Product impact | **P1** | 28.9 |
| **OPT-SECURITY-003** | Assistant + notification Feature tests | KI-028-057/058 | Regression safety | Low | P2 | 28.9 |

---

## OPT-DB

| ID | Problem | Evidence | Current metric | Expected benefit | Risk | Priority | Phase |
|----|---------|----------|----------------|------------------|------|----------|-------|
| **OPT-DB-001** | Products list scan+filesort | EXPLAIN @ 500 rows | ~0.31 ms analyze | Index `(status, created_at)` | **~0.09 ms; range scan** | Low DDL | P2 | **28.9 DONE** |
| **OPT-DB-002** | Analytics events aggregation | 5k rows, 1.9 ms | OK now | Stable at 100k+ | Medium | P3 | 28.9 deferred |
| **OPT-DB-003** | Admin lists @ 10k rows | Not measured | Unknown | Pagination perf | Low | P3 | 28.10 |

---

## OPT-API

| ID | Problem | Evidence | Current | Benefit | Priority | Phase |
|----|---------|----------|---------|---------|----------|-------|
| **OPT-API-002** | Admin funnel wall time >> SQL | 438 ms / 5.6 ms SQL | Slow admin at scale | P2 | 28.10 |
| **OPT-API-003** | Checkout preview load | Not measured | Unknown peak | P2 | 28.10 |
| **OPT-API-004** | Analytics HTTP under load | bcsub blocked in Docker | Unknown | P3 | 28.10 |
| **OPT-API-001** | Merge with OPT-INFRA-002 | Same bcmath root | — | — | P1 | 28.9 |

---

## OPT-FE

| ID | Problem | Evidence | Current | Benefit | Priority | Phase |
|----|---------|----------|---------|---------|----------|-------|
| **OPT-FE-001** | Main JS 499 KB | KI-028-018 | 144 KB gzip | Faster cold load | P3 | 28.10 |
| **OPT-FE-002** | CartesianChart 325 KB | dist | Heavy analytics route | P3 | 28.10 |
| **OPT-FE-003** | Ad popup z-index | KI-028-050 | UX + E2E flake | P2 | 28.9 |
| **OPT-FE-004** | Admin 404 page | KI-028-042 | UX | P4 | 28.10+ |

---

## OPT-REDIS / OPT-QUEUE

| ID | Problem | Evidence | Priority | Phase |
|----|---------|----------|----------|-------|
| OPT-REDIS-001 | Re-verify @ 500+ VU | p95 1.35 ms now | P4 | 28.11 |
| OPT-QUEUE-001 | Worker throughput benchmark | Unknown jobs/min | P3 | 28.11 |
| OPT-REDIS-002 | Optional Redis in default CI | KI-028-002 | P3 | 28.11 |

---

## OPT-NETWORK (new)

| ID | Problem | Evidence | Priority | Phase |
|----|---------|----------|----------|-------|
| OPT-NETWORK-001 | Staging VPS load benchmark | Local Docker only | P2 | Pre-launch |
| OPT-NETWORK-002 | 60 min soak on staging | 5 min only | P3 | 28.11 |

---

## Recommended optimization sequence

```text
1. 28.9  — Remediation + OPT-INFRA-002/003, OPT-SECURITY-002/003, OPT-FE-003, OPT-DB-001 (if large seed proves need)
2. 28.10 — OPT-API-002/003, OPT-FE-001/002
3. 28.11 — OPT-SECURITY-001, OPT-QUEUE-001, OPT-NETWORK-002, Redis CI
4. 28.12+ — Frontend perf deep dive, 25K VU if required
```

---

## Certification

```text
Backlog created: YES
Items implemented: 0
Commits: NO
```
