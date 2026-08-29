# Scalability Roadmap

## Current capacity (evidence-based estimate)

| Dimension | Comfortable now |
|-----------|-------------------|
| Active products | ~10k (indexed list; EXPLAIN verified) |
| Orders/day | ~1k (transaction + idempotent payments) |
| Concurrent users | ~100 on medium VPS (FPM medium pool) |
| Messages/notifications | ~100k rows (indexed; offset OK for inbox pages) |

## 10k users (daily active)

**Expected bottlenecks:**
- Homepage API fan-out (10+ product list calls)
- PHP-FPM worker saturation during peaks
- Redis memory if cache keys grow unbounded

**Actions:** Monitor; CDN for assets; ensure Redis maxmemory policy

## 100k users

**Expected bottlenecks:**
- Catalog search load
- Admin analytics date-range queries
- Queue depth (notifications, webhooks)
- Deep OFFSET on high-volume feeds (DB-PAG-001)

**Actions:**
- Homepage aggregate endpoint
- Cursor pagination on orders/notifications
- Scale queue workers (Supervisor)
- Optional read replica for analytics

## 1M+ records

**Required evolution:**
- Analytics rollups / separate aggregation tables
- Message/notification archival (chat archive exists)
- Cursor pagination everywhere on high-volume lists
- Evaluate PostgreSQL if MySQL-specific limits hit (not required now)

**Do NOT implement prematurely:** sharding, microservices, Kafka, read replicas until metrics prove need.
