# Phase 28.15 — Observability Audit

## Logging

| Area | Implementation |
|------|----------------|
| Structured context | Payment/loyalty failures log with order_id, payment_id |
| Request correlation | `AssignRequestCorrelationId` middleware |
| Queue failures | Laravel failed_jobs + exception logging |

## Health endpoints

| Endpoint | Type | Checks |
|----------|------|--------|
| `/up` | Liveness | Process alive |
| `/api/v1/platform/readiness` | Readiness | DB, cache, queue, payments |

Health payloads exclude secrets; optional `environment` only when explicitly included.

## Diagnostics

- `diyar:validate-php-runtime` — extension/runtime gate without secret leakage
- Platform health caches probe results briefly (skipped during unit tests)

## Integration points (not fake telemetry)

Repository provides hooks for external APM/RUM via:

- Correlation ID header propagation
- Structured log keys (`loyalty.accrual_failed`, etc.)
- Health/readiness JSON for load balancer probes

## Verdict

**Observability: PASS** for repository scope.
