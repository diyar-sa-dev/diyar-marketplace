# Scalability Model — 100k Users

**Date:** 2026-08-29  
**Claim rigor:** PROVEN | VALIDATED | PROJECTED | NOT YET TESTED

---

## What "100k users" means for Diyar

| Metric | Definition | Estimate at 100k registered |
|--------|------------|----------------------------|
| Registered users | Total accounts | 100,000 |
| MAU | Monthly active | 15–25% → **15k–25k** (PROJECTED) |
| DAU | Daily active | 3–8% → **3k–8k** (PROJECTED) |
| Peak concurrent | Simultaneous sessions | **150–400** (PROJECTED) |
| Peak RPS (API) | All endpoints | **80–200 req/s** (PROJECTED) |
| Peak RPS (catalog reads) | Public browse/search | **40–100 req/s** (PROJECTED) |
| Peak checkout RPS | Write-heavy | **5–15 req/s** (PROJECTED) |
| Read/write ratio | API overall | **~85:15** (PROJECTED) |
| WebSocket connections | Chat/notifications | **200–500** (PROJECTED) |
| Queue jobs/min | Notifications, webhooks, email | **500–2000** (PROJECTED) |

**Important:** 100k registered ≠ 100k concurrent. Capacity planning uses **peak concurrent** and **peak RPS**, not registration count alone.

---

## Traffic model assumptions (e-commerce marketplace)

```text
Session duration:     8–15 min average
Pages/session:        6–12 (homepage fan-out: 10+ API calls on load)
API calls/page:       2–5 (TanStack Query dedup helps)
Orders/day at scale:  500–2000 (0.5–2% DAU conversion)
Messages/day:         5k–20k at 100k users
Notifications/day:    10k–50k
Analytics events/day: 50k–200k
```

---

## Capacity by growth stage

### Current → 10k registered users

| Resource | Config | Bottleneck | Change required |
|----------|--------|------------|-----------------|
| VPS | Small (2 GB) | — | None |
| PHP-FPM | 10 workers | — | Default dev/small |
| MySQL | SQLite dev / MySQL prod | — | Indexes **VALIDATED** |
| Redis | Optional dev | — | Array cache in tests |
| CDN | Optional | — | Static from Nginx OK |

**First break:** PHP-FPM queue under marketing spike (PROJECTED)

---

### 10k → 25k registered (~750–2000 DAU, ~75–200 concurrent)

| Resource | Target | Bottleneck | Change |
|----------|--------|------------|--------|
| VPS | Medium (4 GB) | RAM for FPM+MySQL+Redis | Upgrade from small |
| PHP-FPM | 20 workers | Worker exhaustion | `fpm-pool-medium.conf` |
| MySQL connections | ~50 | Connection budget OK | `max_connections ≥ 80` |
| Redis | 512 MB | Cache keys | `maxmemory-policy allkeys-lru` |
| Queue | 6 workers | Notification backlog | Supervisor template |
| CDN | Recommended | TTFB for JS/CSS | `VITE_CDN_BASE_URL` |

**First break:** Homepage API fan-out + FPM (PROJECTED)

---

### 25k → 50k registered (~1500–4000 DAU, ~150–400 concurrent)

| Resource | Target | Bottleneck | Change |
|----------|--------|------------|--------|
| VPS | Large (8 GB) | MySQL buffer pool | 3 GB InnoDB buffer |
| PHP-FPM | 36 workers | CPU on catalog/search | OPcache production ini |
| MySQL | Single primary | Analytics range scans | Index review; optional read replica for admin analytics |
| Redis | 1 GB | Hot catalog keys | Monitor memory; versioned invalidation **PROVEN** |
| Search | LIKE + indexes | Full scan at scale | Monitor `search_query_events`; consider dedicated search at 500k+ SKUs |

**First break:** Admin analytics + catalog search (PROJECTED)

---

### 50k → 100k registered (~3000–8000 DAU, ~300–800 concurrent peak)

| Resource | Target | Bottleneck | Change |
|----------|--------|------------|--------|
| App nodes | 2–3 behind LB | Single-node FPM ceiling | Horizontal app scaling **PROJECTED** |
| MySQL | Primary + read replica | Read-heavy analytics | Replica for reporting only |
| Redis | Shared cluster | Sessions/cache/queue/rate limit | Single Redis → Sentinel optional |
| Object storage | S3-compatible | Local disk media | Move `storage/app/public` to object store |
| CDN | Mandatory | Asset latency | All static + media via CDN |
| Queue | 12+ workers | Webhook + notification depth | Scale Supervisor |
| Pagination | OFFSET on orders | Deep pages slow | Cursor pagination (DB-PAG-001 trigger) |

**First break at 100k:** Multi-node coordination + DB read path (PROJECTED)

---

### 100k+ / horizontal scaling

| Component | Requirement | Status |
|-----------|-------------|--------|
| Stateless HTTP | Sanctum tokens, no local session | **VALIDATED** |
| Shared Redis | Cache, queue, rate limits | **VALIDATED** (config) |
| Shared MySQL | Single source of truth | **VALIDATED** |
| Object storage | Media uploads | **PROJECTED** — config supports S3 driver |
| WebSocket scaling | Reverb behind LB | **PROJECTED** — sticky sessions or Redis pub/sub |
| Load balancer | Nginx/HAProxy | **NOT YET TESTED** multi-node |

---

## Database record projections at 100k users

| Table | Estimated rows | Index status | Scale trigger |
|-------|----------------|--------------|---------------|
| users | 100k | PK | OK |
| products | 10k–50k | Composite indexes **VALIDATED** | Cursor pag at 50k+ |
| orders | 200k–1M lifetime | Composite indexes | Cursor pag at 500k+ |
| order_items | 500k–3M | FK indexed | Archive old orders |
| messages | 1M–5M | Chat indexes | Archive batches exist **PROVEN** |
| notifications | 2M–10M | Inbox indexes | Rollups + archival |
| analytics_events | 10M–50M | Time indexes | Aggregation tables |
| search_query_events | 1M–5M | — | TTL purge job |
| payments | 200k–1M | Idempotency **PROVEN** | OK |

---

## Hostinger / VPS limits

| Profile | RAM | DIYAR fit | Max comfortable concurrent |
|---------|-----|-----------|---------------------------|
| Small VPS | 2 GB | Demo / early prod | ~50 |
| Medium VPS | 4 GB | Production MVP | ~200 |
| Large VPS | 8 GB | Growth single-node | ~500 |
| Multi-node | 2× medium+ | 100k target | ~800+ |

**Hostinger constraint:** Verify `bcmath`, OPcache, and Redis extension on chosen plan before production (**NOT YET TESTED** on Hostinger).

---

## Horizontal scaling readiness checklist

| Check | Status |
|-------|--------|
| No local file session | **PROVEN** — Sanctum |
| No local-only cache for shared data | **PROVEN** — Redis/array |
| Uploads to shared storage | **PARTIAL** — S3 driver ready, default local |
| Queue on Redis | **VALIDATED** — config |
| Rate limits in Redis | **VALIDATED** |
| WebSocket multi-node | **PROJECTED** — needs Reverb LB config |
| Cache invalidation cross-node | **PROVEN** — version keys |

---

## Capacity claim summary

| Claim | Rigor |
|-------|-------|
| 100 concurrent on medium VPS | **PROJECTED** (FPM math: 20 workers × ~5 req/s) |
| 10k SKUs with current indexes | **VALIDATED** (EXPLAIN tests) |
| Payment webhook idempotency | **PROVEN** (tests + unique constraints) |
| 100k registered user architecture path | **PROJECTED** (model above) |
| Multi-node production | **NOT YET TESTED** |
| 500 VU load test | **NOT YET TESTED** |
