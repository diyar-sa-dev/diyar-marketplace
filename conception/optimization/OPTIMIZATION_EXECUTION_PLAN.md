# Optimization Execution Plan

## Tier 0 — Critical (money/data/security)

| Item | Status |
|------|--------|
| Payment webhook idempotency | PASS (verified) |
| Inventory/order transactions | PASS (E2E + PHPUnit) |
| Loyalty EffectiveConfig | FIXED 28.15 |
| Admin B2B XSS | FIXED 28.15 |
| Loadtest production guard | FIXED 28.14 |

## Tier 1 — High (this audit)

| Item | Action | Status |
|------|--------|--------|
| OPT-002 Auth /me storm | Implemented | **DONE** |
| OPT-003 Assistant admin toggle | Implemented | **DONE** |
| OPT-013 MySQL CI script | `scripts/test-phpunit-mysql.ps1` | **DONE** |
| OPT-014 Redis test script | `scripts/test-redis-integration.ps1` | **DONE** |
| KI-028-053 Public assistant | Product decision + monitor | **OPEN** |

## Tier 2 — Medium (next sprints)

| Item | Action |
|------|--------|
| OPT-004 Homepage API consolidation | Design `/platform/home` aggregate when metrics show need |
| OPT-012 Home section import cleanup | Extract shared section imports |
| KI-028-056 CSP | Nginx template at deploy |
| MySQL 8 CI job | Wire `test-phpunit-mysql.ps1` into GitHub Actions |

## Tier 3 — Future (scale triggers)

| Item | Trigger |
|------|---------|
| DB-PAG-001 cursor pagination | >50k SKUs OR page-50 p95 >100ms |
| CustomerReviewHistoryService split | Feature velocity or >50k reviews |
| Analytics rollups | analytics_events >1M rows |
| 25K VU load test | Pre-major marketing campaign |

## Test verification after fixes

```text
AssistantChatTest:     6/6 PASS
AuthContext.test.tsx:  7/7 PASS
Playwright E2E:        72/72 PASS (28.15 re-audit)
PHPUnit full:          764/770 PASS
```
