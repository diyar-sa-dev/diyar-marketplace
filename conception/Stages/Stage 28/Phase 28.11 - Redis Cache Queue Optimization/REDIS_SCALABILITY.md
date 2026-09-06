# Redis Scalability

---

## Scale tiers

### 100 users (~178 RPS baseline, Phase 28.7)

- Redis not bottleneck (p95 ~1.35 ms cache ops on staging)
- MySQL + PHP-FPM dominate latency (p95 ~248 ms)
- Queue sync/async mix sufficient

### 500–1,000 users (projected)

| Resource | Expected pressure | Mitigation |
|----------|-------------------|------------|
| Catalog search facets | Cache miss storms | **StampedeSafeCache** (28.11) |
| Rate limit keys | Linear with IP | Redis handles easily |
| Notification deliveries | Queue depth growth | Scale workers on `notifications` |
| DB connections | PHP-FPM × workers | Connection pooling / read replicas (future) |
| Redis memory | Facet + analytics keys | TTL + version keys (orphans expire) |

### 10,000 users (future)

- Horizontal PHP-FPM instances → shared Redis required
- Multiple queue workers per queue name
- Consider Redis memory max + eviction policy `allkeys-lru` for non-critical caches
- Session driver → Redis if sticky sessions not used
- CDN for public catalog (28.13)

---

## Hostinger VPS layout

```
Nginx → PHP-FPM (1+ workers)
          ↓
        Redis (cache + queue + limits)
          ↓
        MySQL 8
Supervisor → queue:work redis (multiple queues)
```

**No Redis Cluster required** at current or projected MVP scale.

---

## Development ergonomics

- `QUEUE_CONNECTION=sync` — works without Redis
- `CACHE_STORE=array|file` — PHPUnit uses array
- `DIYAR_ENFORCE_REDIS_IN_PRODUCTION` — guards prod misconfiguration

---

## Horizontal scaling checklist

- [ ] Shared Redis reachable from all app nodes
- [ ] `TrustProxies` for rate limits
- [ ] Sticky sessions OR Redis sessions
- [ ] Supervisor worker count ≥ 2 for notifications under load
- [ ] Monitor Redis `used_memory` and queue lag

**Verdict:** PASS (architecture) — PARTIAL (live multi-node NOT VERIFIED)
