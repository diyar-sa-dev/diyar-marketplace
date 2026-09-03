# Queue Concurrency Audit — Phase 28.17

**Date:** 2026-09-03  
**Phase:** 28.17 — Enterprise Concurrency & Octane Hardening  
**Scope:** Redis queue driver, job dispatch under Octane, duplicate processing risk

---

## Configuration

| Setting | Default (dev) | Loadtest stack | Status |
|---------|---------------|----------------|--------|
| `QUEUE_CONNECTION` | `database` (`config/queue.php`) | `redis` (`docker-compose.loadtest.yml`) | **VERIFIED** |
| Redis driver | `config/queue.php` → `redis` connection | Same + `REDIS_HOST=redis` | **VERIFIED** |
| Octane task workers | — | `OCTANE_TASK_WORKERS` default 2 | **VERIFIED** (config only) |

Production should use Redis (or SQS) — enforced via `DIYAR_ENFORCE_REDIS_IN_PRODUCTION` in non-loadtest envs.

---

## Job Categories (audit summary)

| Category | Examples | Concurrency concern | Code guard | Live audit |
|----------|----------|---------------------|------------|------------|
| Payment webhooks | `ProcessPaymentWebhook` (if queued) | Duplicate processing | DB lease on event | **PARTIALLY VERIFIED** (PHPUnit) |
| Notifications | Various `ShouldQueue` listeners | At-least-once delivery | Idempotent handlers vary | **NOT VERIFIED** |
| Inventory expiry | `ReleaseExpiredInventoryReservations` | Race with checkout | Row locks in service | **NOT VERIFIED** |
| Analytics / exports | Report jobs | Stale reads acceptable | — | **NOT VERIFIED** |
| Broadcast | Reverb events | WS delivery | — | **NOT VERIFIED** (no Reverb in loadtest) |

**Job audit summary (live):** **NOT VERIFIED** — no 2026-09-03 pass inventory of all `ShouldQueue` jobs for idempotency under duplicate dispatch.

---

## Octane Interaction

| Concern | Mitigation | Status |
|---------|------------|--------|
| Octane dispatches to Redis while workers run separately | Standard Laravel pattern | **PARTIALLY VERIFIED** |
| Same worker handles HTTP + queue (sync in dev) | Loadtest uses `redis` not `sync` | **VERIFIED** (loadtest) |
| Static state in queued jobs | `FlushOctaneDevState` clears dev statics on HTTP worker only | **PARTIALLY VERIFIED** |
| Queue worker count vs Octane workers | Not measured under load | **NOT VERIFIED** |

---

## Prior Phase Evidence

Phase 28.16 integration tests exercised Redis queue in staging-like config — **PARTIALLY VERIFIED** (not re-run in 28.17 pass).

---

## Gaps

1. Enumerate all `ShouldQueue` jobs and mark idempotent vs at-least-once — **NOT VERIFIED**
2. Run queue workers alongside Octane in loadtest; verify no duplicate side effects on webhook replay — **NOT VERIFIED**
3. Add Reverb to loadtest compose for broadcast job end-to-end — **NOT VERIFIED**
4. Stress test: N workers × duplicate job dispatch — **NOT VERIFIED**

---

## Verdict

| Area | Status |
|------|--------|
| Redis queue in loadtest stack | **VERIFIED** |
| Webhook lease (payment path) | **PARTIALLY VERIFIED** |
| Comprehensive job concurrency audit (live) | **NOT VERIFIED** |
| Queue + Octane under load | **NOT VERIFIED** |

**Production Ready:** No.
