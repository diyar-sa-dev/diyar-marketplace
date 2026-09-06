# Production Failure Modes & Recovery

**Date:** 2026-08-29  
**Extends:** [PRODUCTION_FAILURE_ANALYSIS.md](./PRODUCTION_FAILURE_ANALYSIS.md)

---

## Failure scenario matrix

| Scenario | Detection | Impact | Fallback | Recovery | Data integrity | UX |
|----------|-----------|--------|----------|----------|----------------|-----|
| **Redis down 5 min** | Cache miss storm; queue connection errors | Slower reads; jobs stall | App continues; MySQL authoritative | Restart Redis; workers auto-retry | **Safe** — no financial truth in cache | Degraded speed |
| **Redis memory full** | OOM logs; evictions | Hot cache loss | LRU eviction | Raise maxmemory or flush version keys via command | **Safe** | Brief slowness |
| **MySQL slow** | Slow query log; p95 alerts | Checkout/admin timeout | Read from cache where valid | Optimize query / scale VPS | TX rollback on timeout | Errors on slow ops |
| **MySQL unavailable** | `/health/ready` fail | Full API outage | Static CDN may still serve shell | Restore/restart MySQL | In-flight TX rollback | 503 |
| **Queue workers stopped** | `failed_jobs` growth; horizon/supervisor alert | Async email, webhooks delayed | Sync path for critical? No — webhooks queue | `supervisorctl restart` | Webhook idempotency prevents dup pay | Delayed notifications |
| **Queue backlog >5000** | Redis LLEN / monitoring | Growing delay | Scale workers | Add workers; investigate slow jobs | Jobs retried with backoff | Stale notifications |
| **Payment provider down** | HTTP 5xx on checkout | Cannot complete payment | Show retry message | Queue reconciliation when up | Orders stay `unpaid` | Checkout error |
| **OpenAI unavailable** | 502/503 assistant | Chat only broken | Admin disable assistant | Toggle off via settings | N/A | "Unavailable" message |
| **CDN unavailable** | Asset 404/timeout | Slow/broken UI if no origin fallback | Serve from Nginx origin | Fix CDN DNS/config | N/A | Slow load |
| **Nginx restart** | Brief connection reset | Sub-second blip | — | Auto-restart | N/A | Retry |
| **PHP-FPM restart** | 502 during reload | Sub-second blip | — | Graceful reload | N/A | Retry |
| **Deploy during traffic** | Rolling 502s if hard restart | Brief errors | Blue/green not implemented | Off-peak deploy; `php artisan down` optional | Migrations in TX | Brief outage |
| **Migration during traffic** | Lock wait | Slow writes on affected tables | Schedule off-peak | Online DDL where possible | Migration atomicity | Slow checkout |
| **Disk almost full** | df alerts | Upload/log failures | Read-only mode manual | Clean logs; move media to object storage | Upload fails safe | Upload errors |
| **DB connection exhaustion** | "Too many connections" | 500 errors | — | Raise max_connections; reduce FPM | N/A | 500 |
| **Traffic spike 10×** | FPM queue depth | High latency | Rate limits absorb some | Scale FPM / add node | Inventory locks prevent oversell | Slow but correct |
| **Malicious traffic spike** | Rate limit 429 surge | Legit users may hit limits | Per-IP throttle | WAF/CDN rate limit; captcha on auth | N/A | 429 on abuse |
| **Duplicate webhook** | payload_hash unique | Ignored silently | — | — | **Safe** | None |
| **Stale EffectiveConfig** | Wrong loyalty until TTL | Incorrect points/rules | SettingsChanged listener | Per-key cache bust | Low risk (3600s TTL) | Wrong loyalty display |

---

## What breaks first by user scale

| Scale | First failure (predicted) |
|-------|---------------------------|
| 1k | None on medium VPS |
| 10k | PHP-FPM saturation during campaign |
| 25k | Homepage API fan-out + search |
| 50k | MySQL CPU on analytics; Redis memory |
| 100k | Single-node ceiling; need LB + 2–3 app nodes |

---

## Critical path dependencies

```text
Checkout:  MySQL (required) → Payment API (required) → Queue (async confirm)
Catalog:   MySQL OR Redis cache (degraded OK)
Auth:      MySQL (required)
Chat:      MySQL + Reverb + Redis pub/sub
Assistant: OpenAI (optional feature)
```

**Rule:** Redis failure must never corrupt financial state. **PROVEN** — payments/orders in MySQL with transactions.

---

## Runbook snippets

### Redis down
1. Check `redis-cli ping`
2. Restart Redis service
3. Restart queue workers: `supervisorctl restart diyar-worker:*`
4. Monitor cache miss rate normalization

### Queue backlog
1. Check `php artisan queue:monitor` or Redis LLEN
2. Scale workers in Supervisor
3. Inspect `failed_jobs` for poison messages
4. Retry: `php artisan queue:retry all` (after fixing root cause)

### MySQL connection exhaustion
1. `SHOW PROCESSLIST;`
2. Verify FPM max_children × nodes < max_connections budget
3. Kill long-running analytics queries
4. Temporarily reduce FPM workers

---

## Gaps

| Gap | Priority |
|-----|----------|
| No automated failover (Redis/MySQL) | P3 — acceptable for MVP |
| No blue/green deploy | P3 |
| No synthetic uptime monitoring documented | P2 — add before prod |
| Redis failure not live-tested this audit | P2 — run integration script |
