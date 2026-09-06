# Redis & Queue Review

## Redis usage classification

| Use | Dependency class |
|-----|------------------|
| Catalog version cache | Performance — falls back to DB |
| Admin permissions | Performance — recalculated on miss |
| Rate limiting | Functional in prod — array in tests |
| Queue backend | Functional async — sync in dev/tests |
| Session (prod config) | Functional — DB session in E2E |

## If Redis disappears 5 minutes

- Cache misses increase (MySQL load rises)
- Queue jobs fail to dispatch (must retry/sync fallback config)
- Rate limits may fail open/closed depending on driver — **use redis in prod**

## Queue reliability

- `ProcessPaymentWebhookJob` — ShouldBeUnique ✓
- Payment finalization — lockForUpdate + paid guard ✓
- Loyalty — unique reference constraint ✓
- Failed jobs table — standard Laravel

## Scripts

- `scripts/test-redis-integration.ps1` — run when Docker Redis up
