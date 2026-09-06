# Phase 26.6 — Performance Evidence

**Status: NOT MEASURED** (k6 not executed in this environment)

## Target budgets

| Endpoint | Budget p95 |
|----------|-------------|
| Notification inbox | 300ms |
| Notification enqueue | 150ms |
| Mark read | 150ms |

## PHPUnit query-count gates

| Test | Budget | Last run |
|------|--------|----------|
| Notification aggregation | bounded | PASS |
| Delivery recovery | bounded | PASS |

## k6

Scripts: `scripts/performance/` — **NOT RUN**

Record here after staging load test:

- VUs, duration, RPS, p50, p95, p99, error rate
