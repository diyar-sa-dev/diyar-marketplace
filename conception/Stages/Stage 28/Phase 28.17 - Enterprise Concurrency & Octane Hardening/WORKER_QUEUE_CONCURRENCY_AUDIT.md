# Worker & Queue Concurrency Audit — Phase 28.17

**Date:** 2026-09-03  
**Scope:** Queue jobs, worker deployment, idempotency, scheduler safety  
**Supersedes:** [QUEUE_CONCURRENCY_AUDIT.md](./QUEUE_CONCURRENCY_AUDIT.md) (expanded inventory)

---

## Architecture Principle

```text
HTTP Layer (Octane/FPM)     Queue Layer (Supervisor)
        │                            │
        ├─ dispatch jobs ───────────►│ redis workers
        └─ never long-running work   └─ idempotent handlers
```

Queue provides **at-least-once** delivery. Correctness must not assume exactly-once execution.

---

## Queue Configuration

| Setting | Dev default | Loadtest / production target |
|---------|-------------|------------------------------|
| `QUEUE_CONNECTION` | `database` | `redis` |
| Redis prefix | — | `diyar-loadtest-` (loadtest) |
| Octane task workers | 2 (loadtest) | Separate from queue workers |

**Status:** **VERIFIED** (config). Production Redis enforcement via `DIYAR_ENFORCE_REDIS_IN_PRODUCTION`.

---

## Job Inventory (all `app/Jobs/**`)

| Job | Category | Uniqueness | Idempotency mechanism | Test | Status |
|-----|----------|------------|----------------------|------|--------|
| `ProcessPaymentWebhookJob` | **A — Critical** | `ShouldBeUnique` (event ID) | DB lease + status transitions | `ProcessPaymentWebhookJobTest` | **VERIFIED** (PHPUnit) |
| `DeliverNotificationChannelJob` | B — Retry-safe | `ShouldBeUnique` | Delivery row status | Prior notification tests | **PARTIALLY VERIFIED** |
| `ProcessNotificationBroadcastJob` | B | None | Broadcast outbox | — | **NOT VERIFIED** |
| `ArchiveOldMessagesJob` | C | None | Date-bounded archive | — | **PARTIALLY VERIFIED** |
| `RecordAdminAuditLogJob` | C | None | Append-only audit | — | **PARTIALLY VERIFIED** |
| `QueueIntegrationProbeJob` | Test | None | — | Integration tests | **VERIFIED** |

### Queued listeners

| Listener | Category | Status |
|----------|----------|--------|
| `DispatchNotificationListener` | B | **PARTIALLY VERIFIED** |

---

## Category Definitions

| Cat | Description | Requirement |
|-----|-------------|-------------|
| **A** | Money, inventory, webhooks, payouts | Must be idempotent under duplicate/concurrent execution |
| **B** | Notifications, emails, analytics | Retry-safe; duplicates acceptable or deduped |
| **C** | Reports, cache warm, stats | Best-effort |

---

## Critical Path: Payment Webhooks

```text
HTTP webhook ingest → PaymentWebhookEvent (unique payload_hash)
                   → ProcessPaymentWebhookJob (ShouldBeUnique)
                   → acquireProcessingLease() (processing_leased_until)
                   → PaymentFinalizationService (lockForUpdate)
```

| Failure mode | Protection |
|--------------|------------|
| Duplicate dispatch | `ShouldBeUnique` + event status |
| Concurrent workers | Processing lease UPDATE |
| Retry after timeout | Lease expiry + attempt counter |
| Crash mid-process | Lease expires; reconcile command |

**Runtime duplicate worker proof:** **NOT VERIFIED** (PHPUnit only).

---

## Worker Deployment (`deploy/supervisor/`)

| Program | Queues | Processes | Recycling |
|---------|--------|-----------|-----------|
| `diyar-queue-critical` | `critical` | 1 | `--max-jobs=1000 --max-time=3600` |
| `diyar-queue-high` | `notifications-high`, `notifications` | 2 | Same |
| `diyar-queue-broadcast` | `notifications-low`, `broadcast` | 1 | `--max-jobs=500` |
| `diyar-queue-chat` | `chat`, `chat-low`, `default` | 2 | Same |
| `diyar-reverb` | WebSocket | 1 | Separate process |
| `diyar-scheduler` | `schedule:run` loop | 1 | Single node recommended with `onOneServer()` |

Graceful shutdown: `stopwaitsecs=3600`, `stopasgroup=true`.

**Status:** **PREPARED** (config templates). Live supervisor proof: **NOT VERIFIED**.

---

## Scheduler Safety (`routes/console.php`)

**Fixed 2026-09-03:** All scheduled tasks wrapped with `$oneServer()` when cache driver is `redis`, `memcached`, or `database`.

| Task | Frequency | `onOneServer` | `withoutOverlapping` |
|------|-----------|---------------|----------------------|
| `inventory:release-expired` | Every minute | Yes | 5 min |
| `ArchiveOldMessagesJob` | Daily 02:30 | Yes | — |
| `chat:reconcile-unread` | Weekly | Yes | — |
| `notifications:broadcasts:dispatch-scheduled` | Every minute | Yes | 5 min |
| `outbox:process` | Every minute | Yes | 5 min |
| `outbox:recover` | Every 5 min | Yes | 10 min |
| `notifications:reconcile-deliveries` | Every 15 min | Yes | 15 min |
| `notifications:reconcile-unread` | Weekly | Yes | — |
| `payments:reconcile` | Every 15 min | Yes | 15 min |
| `notifications:prune` | Daily 04:00 | Yes | — |

**Status:** **VERIFIED** (code). Multi-node scheduler mutex runtime: **NOT VERIFIED**.

---

## Octane vs Queue Worker Isolation

| Concern | Mitigation | Status |
|---------|------------|--------|
| Octane HTTP worker runs queue inline | Production uses separate supervisor workers | **PREPARED** |
| Dev `sync` queue | Acceptable for local only | **VERIFIED** |
| Static dev state in HTTP worker | `FlushOctaneDevState` | **VERIFIED** |
| Static dev state in queue worker | Queue workers are short-lived PHP processes | **VERIFIED** |

---

## Gaps (remaining)

1. Runtime: 2 queue workers + duplicate webhook job dispatch — **NOT VERIFIED**
2. Full enumeration of `ShouldQueue` listeners across `app/Listeners/**` — **PARTIALLY VERIFIED**
3. Reverb + broadcast job end-to-end in loadtest stack — **NOT VERIFIED**
4. Horizon vs supervisor choice for production — **PREPARED** (supervisor configs exist)

---

## Verdict

| Area | Status |
|------|--------|
| Critical job idempotency (payment webhook) | **VERIFIED** (PHPUnit) |
| Scheduler multi-node mutex | **VERIFIED** (code) |
| Worker deployment templates | **PREPARED** |
| Live queue duplicate proof | **NOT VERIFIED** |

**Production Ready:** No.
