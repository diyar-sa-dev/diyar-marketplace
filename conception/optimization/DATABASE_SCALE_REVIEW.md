# Database Scale Review

## Index status (28.9 + re-verify)

- `products_status_created_at_index` — **EXPLAIN PASS** on MySQL 8
- Composite indexes on orders, catalog — migrated 28.9
- No production `Cache::flush()` — domain version bumps only

## Scale thresholds

| Table | OK until | Break signal | Action |
|-------|----------|--------------|--------|
| products | ~50k active | page-50 p95 >100ms | Cursor pagination (DB-PAG-001) |
| orders | ~500k | admin export timeout | Limit export + indexes on created_at |
| messages | ~1M | chat inbox offset slow | Cursor + archive (partial exists) |
| analytics_events | ~500k | admin funnel slow | Rollup tables |
| search_query_events | ~1M | write amplification | Partition/archive |

## PostgreSQL portability

Most queries use Eloquent/Query Builder. Raw SQL limited to EXPLAIN tests and analytics aggregates. **PORTABILITY RISK: LOW** for core paths.

## N+1

Hot paths covered by feature tests. God service `CustomerReviewHistoryService` uses batched loads but is complex — monitor query counts if extending.
