# Phase 26.7 — Performance Evidence

**Status: NOT MEASURED** (k6 not executed in this environment)

## Target budgets

| Endpoint | Budget p95 |
|----------|-------------|
| Chat send | 250ms |
| Chat history | 300ms |
| Conversation inbox | 300ms |

## PHPUnit query-count gates

| Test | Budget | Last run |
|------|--------|----------|
| Chat API | bounded | PASS |
| Checkout shipping query count | bounded | PASS |

## k6

Scripts: `scripts/performance/` — **NOT RUN**

## Realtime

Reverb verified starting on Windows dev (`127.0.0.1:8090`) via `composer dev`.
WebSocket dev proxy: Vite `/app` → Reverb.
