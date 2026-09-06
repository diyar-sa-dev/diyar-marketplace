# Known Gaps — Phase 28.17

**Date:** 2026-09-03 (updated after audit file pass)  
**Phase:** 28.17 — Enterprise Concurrency & Octane Hardening  
**Inherited from:** [Final Enterprise Certification](../Phase%2028.17%20-%20Final%20Enterprise%20Certification/FINAL_ENTERPRISE_CERTIFICATION.md) (8.7/10, NOT COMPLETE)

Only statuses: **VERIFIED** · **PARTIALLY VERIFIED** · **NOT VERIFIED** · **BLOCKED**

---

## P0 — Octane Auth & Session

| ID | Gap | Impact | Status |
|----|-----|--------|--------|
| G28.17-O1 | `FlushAuthAndSessionState` listener | Cross-request auth bleed | **VERIFIED** (implemented 2026-09-03) |
| G28.17-O2 | `PersistApplicationSession` listener | Session loss under Octane | **VERIFIED** (implemented 2026-09-03) |
| G28.17-O3 | `EnsureCleanAuthState` middleware | Incomplete guard cleanup | **VERIFIED** (implemented 2026-09-03) |
| G28.17-O4 | `AuthSessionIsolationTest` | Automated Octane auth proof | **VERIFIED** (3/3 pass, PHPUnit) |
| G28.17-O5 | **Live Octane auth probe** (curl on Swoole stack) | Manual/cert gap | **VERIFIED** (400/400, `_raw/live-octane-auth-concurrency.txt`) |
| G28.17-O6 | Stash `octane.php` referenced missing classes | **BLOCKED** if stash applied blindly | **BLOCKED** (mitigated — HEAD re-implemented) |

---

## P0 — Checkout & Scaling (runtime)

| ID | Gap | Impact | Status |
|----|-----|--------|--------|
| G28.17-C0 | **`CheckoutInventoryConcurrencyTest`** (parallel reserve, last unit) | Oversell unproven under real HTTP | **PARTIALLY VERIFIED** (6 DB workers; HTTP Octane pending) |
| G28.17-C5 | **Multi-node / load-balancer** session without sticky cookies | Horizontal scale unproven | **NOT VERIFIED** |
| G28.17-C6 | Live Swoole stack boot post-listener (2026-09-03) | Octane regression unknown on Docker | **VERIFIED** (auth probe on loadtest stack) |

---

## P1 — Concurrency & Payments

| ID | Gap | Impact | Status |
|----|-----|--------|--------|
| G28.17-C1 | Payment/webhook race fixes — stash vs HEAD | Replay/race regressions | **PARTIALLY VERIFIED** (lease + locks in HEAD) |
| G28.17-C2 | Money-path tests on Octane + k6 (not PHPUnit loops) | Unknown under real concurrency | **NOT VERIFIED** |
| G28.17-C3 | `OrderCancellationService` stash diff unreviewed | Cancel/refund races | **NOT VERIFIED** |
| G28.17-C4 | Service booking payment locks untested for concurrency | Provider marketplace payments | **NOT VERIFIED** |

---

## P1 — Capacity (inherited open from 2026-08-29)

| ID | Gap | Impact | Status |
|----|-----|--------|--------|
| G28.17-P1 | 278 RPS / 1M req·hour never measured on target tier | Scaling claims unproven | **NOT VERIFIED** |
| G28.17-P2 | p95 >300 ms above ~25 RPS on dev Docker | Latency budget miss at saturation | **VERIFIED** (measured) |

---

## P2 — Platform & Testing (inherited)

| ID | Gap | Impact | Status |
|----|-----|--------|--------|
| G28.17-Q1 | Queue job idempotency (webhook job + audit docs) | Duplicate job side effects | **PARTIALLY VERIFIED** (PHPUnit; runtime workers pending) |
| G28.17-W1 | Live Reverb WebSocket not in loadtest compose | Real-time delivery unproven | **NOT VERIFIED** |
| G28.17-T1 | Playwright E2E not re-run in 28.17 pass | UI regression gap | **NOT VERIFIED** |
| G28.17-T2 | 15-min soak incomplete | Long-run stability unknown | **NOT VERIFIED** |
| G28.17-T3 | 50k/100k product EXPLAIN at scale | DB plan at volume unknown | **NOT VERIFIED** |
| G28.17-F1 | Lighthouse LCP/INP not captured | Frontend perf gap | **NOT VERIFIED** |

---

## Process Gaps

| ID | Gap | Status |
|----|-----|--------|
| G28.17-X1 | Two Phase 28.17 folders (Certification vs Concurrency) — scope split intentional 2026-09-03 | **VERIFIED** |
| G28.17-X2 | `stash@{0}` retained; Octane P0 re-implemented in HEAD | **PARTIALLY VERIFIED** |
| G28.17-X3 | CI still uses `artisan serve`; Octane path loadtest-only | **VERIFIED** |

---

## Closure Order

1. **P0 live Octane auth probe** on `docker-compose.loadtest.yml`  
2. **`CheckoutInventoryConcurrencyTest`** + parallel HTTP checkout  
3. **Multi-node** session test without sticky sessions  
4. P1 k6 money-path on hardened Octane stack  
5. Queue job audit + remaining stash cherry-picks  
6. Re-run certification gates — see [FINAL_CERTIFICATION.md](./FINAL_CERTIFICATION.md) (**5/8**, NOT CERTIFIED)

**Production Ready:** No.
