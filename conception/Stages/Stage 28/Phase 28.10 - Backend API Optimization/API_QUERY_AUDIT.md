# API Query Audit — Phase 28.10

Query construction optimizations applied. Database indexes from 28.9 not duplicated.

| Service | Change | Layer |
|---------|--------|-------|
| OrderCreationService | Product map reuse | API orchestration |
| AdminAnalyticsService | selectRaw aggregates | API orchestration |
| CartService | withUserSaved scope | Eloquent builder |
| ProductService | attachImages aggregate | Eloquent builder |

**Unchanged:** Payment transactions, inventory locks, idempotency boundaries.

See [API_BEFORE_AFTER.md](./API_BEFORE_AFTER.md) for measurements.
