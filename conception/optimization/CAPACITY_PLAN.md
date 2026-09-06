# Capacity Plan — 10k → 25k → 50k → 100k

**Date:** 2026-08-29  
**Companion:** [SCALABILITY_MODEL.md](./SCALABILITY_MODEL.md)

---

## Stage gates

```text
CURRENT (dev/small VPS)
        ↓ trigger: >50 concurrent OR p95 catalog >300ms
10k registered
        ↓ trigger: >150 concurrent OR FPM >80% OR queue lag >5min
25k registered
        ↓ trigger: >300 concurrent OR MySQL CPU >70% sustained
50k registered
        ↓ trigger: >500 concurrent OR single-node RAM exhausted
100k registered
        ↓ trigger: analytics p95 >2s OR order list page-50 >100ms
100k+ horizontal
```

---

## Per-stage resource matrix

| Stage | VPS | FPM max | Queue | Redis | MySQL buffer | CDN | App nodes |
|-------|-----|---------|-------|-------|--------------|-----|-----------|
| Current | 2 GB | 10 | 2 | 256 MB | 512 MB | Optional | 1 |
| 10k | 4 GB | 20 | 6 | 512 MB | 1.5 GB | Yes | 1 |
| 25k | 4–8 GB | 24 | 8 | 512 MB–1 GB | 2 GB | Yes | 1 |
| 50k | 8 GB | 36 | 10 | 1 GB | 3 GB | Yes | 1–2 |
| 100k | 2×8 GB | 36×N | 12+ | 1–2 GB | 3 GB + replica | Required | 2–3 |

---

## Per-stage bottleneck → action

### 10k users

| Bottleneck | Symptom | Action | Priority |
|------------|---------|--------|----------|
| PHP-FPM | 502/504, slow TTFB | Medium VPS + 20 workers | P1 |
| Homepage fan-out | 10+ API on load | Monitor; aggregate API if p95 >200ms | P2 |
| Redis memory | OOM restart | `maxmemory` + LRU | P2 |

### 25k users

| Bottleneck | Symptom | Action | Priority |
|------------|---------|--------|----------|
| Catalog search | Slow suggestions | Cache hot queries; index review | P2 |
| Queue backlog | Delayed notifications | +2 workers | P2 |
| MySQL connections | "Too many connections" | Raise max_connections; pool audit | P1 |

### 50k users

| Bottleneck | Symptom | Action | Priority |
|------------|---------|--------|----------|
| Admin analytics | Timeouts | Read replica OR rollup tables | P2 |
| Deep OFFSET | Page 20+ slow | Cursor pagination (DB-PAG-001) | P2 |
| Media disk | Full disk | Object storage migration | P1 |

### 100k users

| Bottleneck | Symptom | Action | Priority |
|------------|---------|--------|----------|
| Single app node | CPU 100% | Load balancer + 2–3 nodes | P1 |
| WebSocket | Connection limit | Reverb scaling + sticky LB | P2 |
| analytics_events | Table bloat | Daily rollups + purge | P2 |
| messages/notifications | Inbox slow | Archival jobs (existing infra) | P2 |

---

## Connection budget formula

```text
MySQL max_connections ≥ (FPM_workers × 1.2) + (queue_workers × 2) + 20 admin margin

Medium VPS example:
  (20 × 1.2) + (6 × 2) + 20 = 24 + 12 + 20 = 56 → set max_connections ≥ 80
```

---

## Monitoring triggers (implement before each stage)

| Metric | Warning | Critical |
|--------|---------|----------|
| FPM active processes | >80% max_children 5min | 100% sustained |
| MySQL threads_running | >30 | >50 |
| Redis used_memory | >80% maxmemory | OOM |
| Queue depth | >1000 jobs | >5000 jobs |
| API p95 (catalog) | >200ms | >500ms |
| API p95 (checkout) | >500ms | >2000ms |
| Disk usage | >75% | >90% |

---

## Deployment profiles

See `deploy/php/fpm-pool-{small,medium,large}.conf.example` and `docker-compose.production-like.yml`.

| Profile | Use case |
|---------|----------|
| Development | Docker, SQLite/MySQL, array/redis cache |
| Small VPS | Demo, <50 concurrent |
| Medium VPS | Production MVP, 10k–25k users |
| Large VPS | Growth, 25k–50k single node |
| Horizontal | 50k–100k+, load balanced app tier |
