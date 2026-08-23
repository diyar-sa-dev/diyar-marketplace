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

## Profiles not executed locally

| Profile | Peak VUs | Status |
|---------|----------|--------|
| 100 | 100 | NOT VERIFIED locally |
| 500 | 500 | STAGING REQUIRED |
| 1,000 | 1,000 | STAGING REQUIRED |
| 5,000 | 5,000 | STAGING REQUIRED |
| 10,000 | 10,000 | STAGING REQUIRED |
| 25,000 | 25,000 | **NOT VERIFIED** |

## How to reproduce

```powershell
docker run --rm `
  -v "${PWD}/scripts/performance:/scripts" `
  -e BASE_URL=http://host.docker.internal:8000/api/v1 `
  -e PROFILE=baseline `
  grafana/k6 run /scripts/profiles.js
```

For meaningful p95/p99, run against staging with `CACHE_STORE=redis`, `QUEUE_CONNECTION=redis`, PHP-FPM/Octane, and seeded production-like data.
