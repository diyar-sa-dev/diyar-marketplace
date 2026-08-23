# Load Test Results — DIYAR

**Status:** LOCAL VERIFIED (baseline only). Staging/production capacity **NOT VERIFIED**.

## Environment

| Field | Value |
|-------|-------|
| Date | 2026-08-23 |
| Machine | Windows 10 dev workstation |
| API | `php artisan serve` on 127.0.0.1:8000 (sqlite, no Redis in dev serve) |
| Tool | `grafana/k6:latest` via Docker |
| Script | `scripts/performance/profiles.js` |
| Profile | `baseline` (peak 10 VUs) |

## Baseline profile results

| Metric | Value | Threshold |
|--------|-------|-----------|
| RPS | 6.04 | — |
| p50 | 673 ms | — |
| p95 | 1,888 ms | < 800 ms (**FAIL** on dev `artisan serve`) |
| Error rate | 20.96% | < 2% (**FAIL** — timeouts during graceful shutdown / single-thread PHP) |

**Interpretation:** Baseline k6 executed successfully against local dev server. Threshold failures are expected on `artisan serve` (single-process, no Redis). **Do not use these numbers for production SLA claims.**

## Profile 100 — Octane + MySQL (2026-08-23, LOCAL VERIFIED)

| Field | Value |
|-------|-------|
| API | Laravel Octane + Swoole (Docker `docker-compose.loadtest.yml`) |
| DB | MySQL 8 (`diyar_loadtest`) |
| Cache | Redis |
| Workers | 8 workers, 4 task workers |
| k6 network | Compose internal (`http://api:8000/api/v1`) |

| Metric | Value | Threshold |
|--------|-------|-----------|
| RPS | 75.10 | — |
| p50 | 662 ms | — |
| p95 | 1,312 ms | < 1,500 ms (**PASS**) |
| Error rate | 0.00% | < 5% (**PASS**) |
| Iterations | 4,277 | — |

**Fix applied:** `CatalogSearchService::vendorFacets()` — `reorder()` before `GROUP BY` to satisfy MySQL `ONLY_FULL_GROUP_BY` (was causing 44% 500 errors on `/catalog/search`).

**Before fix (same stack):** RPS 7.45, p95 26,768 ms, error rate 44.79%.

## Profiles not executed locally

| Profile | Peak VUs | Status |
|---------|----------|--------|
| 100 | 100 | **LOCAL VERIFIED** (Octane + MySQL) |
| 500 | 500 | STAGING REQUIRED |
| 1,000 | 1,000 | STAGING REQUIRED |
| 5,000 | 5,000 | STAGING REQUIRED |
| 10,000 | 10,000 | STAGING REQUIRED |
| 25,000 | 25,000 | **NOT VERIFIED** |

## Profile 100 on `artisan serve` (2026-08-23)

| Metric | Value | Notes |
|--------|-------|-------|
| RPS | 9.90 | Single-thread PHP bottleneck |
| p50 | 5,387 ms | Connection queueing |
| p95 | 12,423 ms | **FAIL** — dial timeouts |
| Error rate | 24.12% | Server saturated ~60s into test |

**Root cause:** `php artisan serve` handles **one request at a time**. At 100 VUs, connections queue until k6 times out (`dial: i/o timeout`). This is **not** an application bug — it is the wrong server for load testing.

**Fix:** Use **Laravel Octane + Swoole** (see below).

## Octane + Swoole (required for PROFILE >= 100)

```powershell
# Terminal 1 — start Octane API + Redis (Docker)
docker compose -f docker-compose.loadtest.yml up --build

# Terminal 2 — run k6
.\scripts\performance\run-k6.ps1 -Profile 100
```

Load-test mode (`DIYAR_LOADTEST_MODE=true`) automatically:
- Disables API rate limits (catalog search was capped at 60 req/min per IP)
- Caches health probes (avoids DB/cache stampede)
- k6 sends unique `X-Forwarded-For` per VU

## How to reproduce (baseline)

```powershell
docker run --rm `
  -v "${PWD}/scripts/performance:/scripts" `
  -e BASE_URL=http://host.docker.internal:8000/api/v1 `
  -e PROFILE=baseline `
  grafana/k6 run /scripts/profiles.js
```

For meaningful p95/p99, run against staging with `CACHE_STORE=redis`, `QUEUE_CONNECTION=redis`, PHP-FPM/Octane, and seeded production-like data.
