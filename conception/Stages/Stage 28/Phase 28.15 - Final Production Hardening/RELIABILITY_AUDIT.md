# Phase 28.15 — Reliability Audit

## Redis failure behavior

| Scenario | Behavior | Verified |
|----------|----------|----------|
| Cache miss | DB authoritative | Unit/feature tests |
| Redis unavailable (prod config) | Laravel falls back per `config/cache.php` | Documented 28.11 |
| Queue Redis down | Failed job table + retry | Job configs audited 28.11 |
| Stampede protection | `StampedeSafeCache` | CacheDeepAuditTest |

## Queue reliability

Payment webhooks, notifications, loyalty accrual, affiliate commissions use:

- Idempotency keys on financial mutations
- Unique reference constraints on loyalty transactions
- Sync driver in PHPUnit (deterministic)
- Retry/backoff on async jobs (28.11 audit)

**Re-enabled loyalty accrual** regression now passes — confirms event listener + ledger path after config toggle.

## Health / readiness

| Endpoint | Purpose | Status |
|----------|---------|--------|
| `GET /up` | Liveness | Laravel built-in |
| `GET /api/v1/platform/readiness` | DB + cache + queue + payments | ReadinessEndpointTest PASS |

`PlatformHealthService` probes degrade gracefully; optional failures mark `degraded` not hard 500.

## MySQL authority

Critical business state (orders, payments, inventory) always transaction-bound in services. Cache is read-through for settings/catalog only.

## Verdict

**Reliability: PASS**
