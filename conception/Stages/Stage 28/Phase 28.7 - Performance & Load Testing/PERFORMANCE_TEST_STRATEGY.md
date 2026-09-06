# Performance Test Strategy — Phase 28.7

**Date:** 2026-08-27  
**Principle:** Measure → compare → identify bottleneck → document → defer optimization.

---

## Scope

| In scope | Out of scope |
|----------|--------------|
| Controlled local/staging load on Octane + MySQL 8 + Redis | Production load testing |
| k6 HTTP workloads (catalog, health, mixed) | WebSocket abuse / assistant abuse testing |
| EXPLAIN / EXPLAIN ANALYZE on MySQL 8 | Index additions or query rewrites |
| Redis ping/cache/queue latency | Redis TTL or strategy changes |
| Frontend bundle size capture | Bundle splitting / code optimization |
| Analytics service profiling (in-process) | Real payment or email/SMS load |

---

## Production DB decision

| Engine | Role in 28.7 |
|--------|--------------|
| **MySQL 8.x** | Canonical for production-representative measurements |
| MariaDB 10.4 (XAMPP) | Dev only — not labeled as production performance |
| SQLite | Regression tests only — **never** production performance evidence |
| PostgreSQL | **Rejected** — not tested |

---

## Workload groups

| Group | Endpoints tested | Status |
|-------|------------------|--------|
| Public/catalog | search, categories, services, vendors | **Measured** |
| Public/catalog | `GET /products` | **BLOCKED** (bcmath env — PERF-028-001) |
| Authentication | login flows | Not load-tested (rate-limit respect) |
| Cart / checkout | preview, shipping | Not load-tested (requires session + bcmath fix) |
| Orders | list/detail | Not load-tested at scale |
| Payments | — | Excluded (no real gateway) |
| Services | `GET /services` | **Measured** (small seed count) |
| Chat | — | No chat seed data |
| Notifications | — | Not HTTP load-tested |
| Affiliate | — | Not load-tested |
| Analytics | AdminAnalyticsService in-process | **Partial** (admin funnel OK; vendor bcsub blocked) |
| Admin lists | — | Not load-tested at 10k+ rows |
| Assistant (KI-028-053) | — | **Not tested** — no abuse testing per security phase |

---

## Concurrency profiles

| Level | Executed | Script |
|-------|----------|--------|
| 1–10 VU (baseline) | Yes | `stage28-workload.js` PROFILE=baseline |
| 100 VU | Yes | `stage28-workload.js` PROFILE=100 |
| 1→5→10→25→50→100 stepped | Partial | Spike profile covers ramp |
| 500+ VU | **No** | Staging infrastructure required |

---

## Tools

| Tool | Purpose |
|------|---------|
| k6 (`grafana/k6:latest`) | HTTP load / spike / soak |
| `stage28-performance-api-baseline.php` | Single-request latency percentiles |
| `stage28-performance-mysql-explain.php` | EXPLAIN ANALYZE + service profiles |
| `stage28-redis-benchmark.php` | Redis latency |
| `PerformanceDatasetSeeder` | Controlled dataset tiers |

---

## Threshold philosophy

No contractual SLAs invented. Observed boundaries documented as:

- **Healthy** — p95 stable, error rate ~0%
- **Degraded** — p95 sharp increase, elevated errors
- **Capacity boundary** — saturation or sustained errors
- **Failure** — widespread 5xx, timeouts, resource exhaustion

---

## Optimization rule

Findings recorded as **OPT-*** IDs only. **No fixes applied in 28.7.**
