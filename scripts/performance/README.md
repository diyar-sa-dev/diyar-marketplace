# DIYAR k6 Load Profiles

Staged profiles for catalog hot paths (`health`, `catalog/search`, `products`).

## Profiles

| PROFILE | Peak VUs | Intended environment |
|---------|----------|----------------------|
| `baseline` | 10 | Local dev / CI smoke |
| `100` | 100 | Local verified |
| `500` | 500 | Staging |
| `1000` | 1000 | Staging |
| `5000` | 5000 | Staging only |
| `10000` | 10000 | Staging only |
| `25000` | 25000 | Staging only — **NOT production verified by default** |

## Run locally (Docker)

```bash
# 1. Boot API (from repo root)
cd backend && bash ../scripts/e2e/bootstrap-backend.sh
php artisan serve --host=127.0.0.1 --port=8000

# 2. Baseline profile
docker run --rm -i --network host \
  -v "%cd%/scripts/performance:/scripts" \
  -e BASE_URL=http://127.0.0.1:8000/api/v1 \
  -e PROFILE=baseline \
  grafana/k6 run /scripts/profiles.js
```

PowerShell:

```powershell
docker run --rm -i `
  -v "${PWD}/scripts/performance:/scripts" `
  -e BASE_URL=http://host.docker.internal:8000/api/v1 `
  -e PROFILE=baseline `
  grafana/k6 run /scripts/profiles.js
```

## Legacy smoke

`scripts/performance/smoke.js` remains for CI weekly workflow (10→100 VUs).

## Evidence

Record results in `conception/Stages/Stage 22/LOAD_TEST_RESULTS.md` with:
- date, machine, profile, p50/p95/p99, RPS, error rate
- mark **LOCAL VERIFIED** vs **STAGING VERIFIED** vs **NOT VERIFIED**
